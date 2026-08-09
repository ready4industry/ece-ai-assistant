import { Ratelimit } from '@upstash/ratelimit';
import { Redis }     from '@upstash/redis';

const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasRedis
  ? new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

const upstashRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter:   Ratelimit.slidingWindow(20, '60 m'),
      analytics: false,
      prefix:    'ece_rl',
    })
  : null;

function withTimeout<T>(promise: Promise<T>, ms = 800): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Redis timeout after ${ms}ms`)), ms)
    ),
  ]);
}

export const ratelimit = {
  async limit(userId: string) {
    if (!upstashRatelimit) {
      return { success: true, limit: 20, remaining: 19, reset: 0 };
    }
    try {
      return await withTimeout(upstashRatelimit.limit(userId), 800);
    } catch {
      return { success: true, limit: 20, remaining: 19, reset: 0 };
    }
  }
};

const SN_KEY = () => `sambanova:daily:${new Date().toISOString().slice(0, 10)}`;

export async function checkSambaNovaBudget(): Promise<boolean> {
  if (!redis) return true;
  try {
    const count = await redis.incr(SN_KEY());
    if (count === 1) await redis.expire(SN_KEY(), 86400);
    return count <= 20;
  } catch {
    return true;
  }
}

const TODAY = () => new Date().toISOString().slice(0, 10);

const PROVIDER_LIMITS: Record<string, { daily_req?: number; daily_tokens?: number }> = {
  groq_70b:      { daily_req: 1000 },
  groq_8b:       { daily_req: 14400 },
  groq_qwen:     { daily_req: 1000 },
  groq_27b:      { daily_req: 1000 },
  groq_120b:     { daily_req: 1000 },
  cerebras:      { daily_tokens: 1_000_000 },
  cerebras_b:    { daily_tokens: 1_000_000 },
  sambanova_all: { daily_req: 20 },
  gemini_p:      { daily_req: 250 },
  gemini_f:      { daily_req: 250 },
  gemini_lite:   { daily_req: 1000 },
};

export async function checkProviderBudget(provider: string): Promise<boolean> {
  if (!redis) return true;
  try {
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
        await redis.decr(key);
        return false;
      }
    }
  } catch {
    return true;
  }
  return true;
}

export async function trackProviderTokens(provider: string, tokens: number): Promise<void> {
  if (!tokens || !redis) return;
  try {
    const key = `budget:tok:${provider}:${TODAY()}`;
    await redis.incrby(key, tokens);
  } catch {}
}

export { redis };

