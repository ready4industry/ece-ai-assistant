import { Ratelimit } from '@upstash/ratelimit';
import { Redis }     from '@upstash/redis';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Per-user sliding window rate limit. Configurable via RATE_LIMIT_PER_HOUR (default 40).
const rateLimitPerHour = parseInt(process.env.RATE_LIMIT_PER_HOUR ?? '40', 10);
export const ratelimit = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(rateLimitPerHour, '60 m'),
  analytics: false,
  prefix:    'ece_rl',
});

// ── SambaNova 20 req/day budget tracker (GapFix Gap 09) ────────────────────
const SN_KEY = () => `sambanova:daily:${new Date().toISOString().slice(0, 10)}`;

export async function checkSambaNovaBudget(): Promise<boolean> {
  const count = await redis.incr(SN_KEY());
  if (count === 1) await redis.expire(SN_KEY(), 86400);
  return count <= 20;
}

// ── Provider daily budget tracking (Architecture §5.2) ─────────────────────
const TODAY = () => new Date().toISOString().slice(0, 10);

const PROVIDER_LIMITS: Record<string, { daily_req?: number; daily_tokens?: number }> = {
  groq_70b:        { daily_req: 1000 },
  groq_8b:         { daily_req: 14400 },
  groq_qwen:       { daily_req: 1000 },
  groq_27b:        { daily_req: 1000 },
  groq_120b:       { daily_req: 1000 },
  cerebras:        { daily_tokens: 1_000_000 },
  cerebras_b:      { daily_tokens: 1_000_000 },
  sambanova_all:   { daily_req: 20 },
  gemini_f:        { daily_req: 250 },
  gemini_p:        { daily_req: 250 },
  gemini_fl:       { daily_req: 1000 },
  gemini_lite:     { daily_req: 1000 },
  gemini_preview:  { daily_req: 250 },
  gemini_latest:   { daily_req: 1000 },
  gemini_litelast: { daily_req: 1000 },
};

export async function checkProviderBudget(provider: string): Promise<boolean> {
  // SambaNova providers all share the 20/day pool
  const budgetKey = ['sn_verilog', 'sn_research', 'sn_reserve'].includes(provider)
    ? 'sambanova_all'
    : provider;

  const limit = PROVIDER_LIMITS[budgetKey];
  if (!limit) return true;

  if (limit.daily_req !== undefined) {
    const key = `budget:req:${budgetKey}:${TODAY()}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 86400);
    if (count > limit.daily_req) {
      // Decrement back — don't count failed budget check as usage
      await redis.decr(key);
      return false;
    }
  }
  return true;
}

export async function trackProviderTokens(provider: string, tokens: number): Promise<void> {
  if (!tokens) return;
  const key = `budget:tok:${provider}:${TODAY()}`;
  await redis.incrby(key, tokens);
}

export { redis };
