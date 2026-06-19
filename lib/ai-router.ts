// /lib/ai-router.ts
// Model strings from Live Model Verification §6 — overrides all other documents.
// ROUTES from Live Model Verification §7.

import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import OpenAI from 'openai';
import type { AIProvider, QueryMode, RouterResult } from './types';
import { logger, persistError } from './logger';
import { checkProviderBudget, trackProviderTokens } from './ratelimit';

// ── Verified model strings (Live Model Verification §6) ────────────────────
export const MODELS: Record<AIProvider, string> = {
  groq_70b:    'llama-3.3-70b-versatile',
  groq_8b:     'llama-3.1-8b-instant',
  groq_qwen:   'qwen/qwen3-32b',
  groq_27b:    'qwen/qwen3.6-27b',
  groq_120b:   'openai/gpt-oss-120b',
  cerebras:    'gpt-oss-120b',
  cerebras_b:  'zai-glm-4.7',
  sn_verilog:  'gpt-oss-120b',
  sn_research: 'DeepSeek-V3.1',
  sn_reserve:  'Meta-Llama-3.3-70B-Instruct',
  gemini_p:    'gemini-3.5-flash',
  gemini_f:    'gemini-2.5-flash',
  gemini_lite: 'gemini-3.1-flash-lite',
} as const;

// ── Routes (Live Model Verification §7) ────────────────────────────────────
// scan mode is NOT here — handled in /api/scan/route.ts
export const ROUTES: Record<QueryMode, AIProvider[]> = {
  code:     ['groq_70b',    'cerebras',    'gemini_lite'],
  error:    ['groq_70b',    'groq_qwen',   'cerebras',    'gemini_lite'],
  concept:  ['groq_8b',     'cerebras',    'gemini_lite'],
  verilog:  ['sn_verilog',  'groq_70b',    'gemini_p'],
  project:  ['sn_research', 'groq_120b',   'gemini_p'],
  research: ['sn_research', 'gemini_p',    'groq_120b'],
};

// Year 3-4 concept override (Live Model Verification §7 note)
const CONCEPT_Y34_PROVIDERS: AIProvider[] = ['groq_70b', 'cerebras', 'gemini_p'];

// ── Main export ─────────────────────────────────────────────────────────────
export async function generate(
  mode:              QueryMode,
  system:            string,
  user:              string,
  requestId:         string,
  yearOfStudy?:      number,
  overrideProviders?: AIProvider[],
): Promise<RouterResult> {
  let providers: AIProvider[];
  if (overrideProviders) {
    providers = overrideProviders;
  } else if (mode === 'concept' && yearOfStudy && yearOfStudy >= 3) {
    providers = CONCEPT_Y34_PROVIDERS;
  } else {
    providers = ROUTES[mode];
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    // Skip Cerebras for long-context (GapFix Gap 08)
    if (provider === 'cerebras' || provider === 'cerebras_b') {
      const estimatedTokens = (system.length + user.length) / 4;
      if (estimatedTokens > 6000) {
        logger.fallback(requestId, 'model_call', provider, 'context_too_long_for_cerebras', providers[providers.indexOf(provider) + 1]);
        continue;
      }
    }

    // Provider budget check
    const hasBudget = await checkProviderBudget(provider);
    if (!hasBudget) {
      logger.fallback(requestId, 'budget_check', provider, 'daily_budget_exhausted', providers[providers.indexOf(provider) + 1]);
      continue;
    }

    const start = Date.now();
    try {
      const { text, tokens } = await callProvider(provider, system, user, requestId);
      const latency = Date.now() - start;

      // Track tokens asynchronously
      if (tokens > 0) {
        trackProviderTokens(provider, tokens).catch(() => {});
      }

      logger.modelCall(requestId, provider, MODELS[provider], 'success', {
        latency_ms: latency, tokens,
      });

      return {
        text,
        provider,
        model:       MODELS[provider],
        latency_ms:  latency,
        tokens_used: tokens,
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const e = err as { status?: number; statusCode?: number; code?: string; message?: string };

      // ── Auth failure: invalid/revoked API key ─────────────────────────────
      // 401 means the key itself is broken — every future request to this provider
      // will also fail until the key is rotated. Treated as critical, not a fallback.
      const isAuthError =
        e?.status === 401 ||
        e?.statusCode === 401 ||
        e?.status === 403 ||
        e?.statusCode === 403 ||
        e?.code === 'invalid_api_key' ||
        e?.message?.toLowerCase().includes('invalid api key') ||
        e?.message?.toLowerCase().includes('authentication');

      if (isAuthError) {
        logger.critical(requestId, 'model_call', provider, lastError, {
          http_status: e?.status,
          model:       MODELS[provider],
          action_required: `Rotate ${provider.toUpperCase()} API key — all requests to this provider will fail until fixed`,
        });
        await persistError({
          request_id: requestId,
          stage:      'model_call',
          status:     'critical',
          provider,
          model:      MODELS[provider],
          error_type: 'CRITICAL_AUTH_FAILURE',
          error_msg:  lastError.message,
        });
        throw lastError;
      }

      const isRateLimit =
        e?.status === 429 ||
        e?.statusCode === 429 ||
        e?.code === 'rate_limit_exceeded' ||
        e?.message?.toLowerCase().includes('rate limit') ||
        e?.message?.toLowerCase().includes('rate_limit');

      const isUnavailable =
        e?.status === 503 || e?.status === 502 ||
        e?.message?.toLowerCase().includes('unavailable');

      const shouldFallback = isRateLimit || isUnavailable;

      const reason = isRateLimit
        ? 'rate_limited'
        : isUnavailable
        ? 'service_unavailable'
        : 'non_retryable_error';

      logger.modelCall(requestId, provider, MODELS[provider], shouldFallback ? 'fallback' : 'failure', {
        error_type: lastError.name,
        error_msg:  lastError.message,
        reason,
        http_status: e?.status,
      });

      await persistError({
        request_id: requestId,
        stage:      'model_call',
        status:     'failure',
        provider,
        model:      MODELS[provider],
        error_type: lastError.name,
        error_msg:  lastError.message,
      });

      if (shouldFallback) {
        const nextIdx = providers.indexOf(provider) + 1;
        if (nextIdx < providers.length) {
          logger.fallback(requestId, 'model_call', provider, reason, providers[nextIdx]);
        }
        continue;
      }
      // Non-retryable: throw immediately
      throw err;
    }
  }

  throw new Error(
    `All providers exhausted for mode '${mode}'. Last error: ${lastError?.message ?? 'unknown'}`
  );
}

// ── Provider implementations ─────────────────────────────────────────────────
async function callProvider(
  provider: AIProvider,
  system:   string,
  user:     string,
  requestId: string,
): Promise<{ text: string; tokens: number }> {
  const messages = [
    { role: 'system' as const, content: system },
    { role: 'user'   as const, content: user },
  ];

  // ── GROQ ──────────────────────────────────────────────────────────────────
  if (['groq_70b', 'groq_8b', 'groq_qwen', 'groq_27b', 'groq_120b'].includes(provider)) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
    const res  = await groq.chat.completions.create({
      model:       MODELS[provider as AIProvider],
      messages,
      max_tokens:  provider === 'groq_8b' ? 1000 : 2000,
      temperature: 0.1,
    });
    return {
      text:   res.choices[0]?.message?.content ?? '',
      tokens: res.usage?.total_tokens ?? 0,
    };
  }

  // ── CEREBRAS ─────────────────────────────────────────────────────────────
  if (provider === 'cerebras' || provider === 'cerebras_b') {
    const client = new Cerebras({ apiKey: process.env.CEREBRAS_API_KEY! });
    const res = await (client.chat.completions.create as Function)({
      model:       MODELS[provider],
      messages,
      max_tokens:  2000,
      temperature: 0.1,
    });
    return {
      text:   (res as { choices: { message: { content: string } }[] }).choices[0]?.message?.content ?? '',
      tokens: (res as { usage?: { total_tokens?: number } }).usage?.total_tokens ?? 0,
    };
  }

  // ── SAMBANOVA ─────────────────────────────────────────────────────────────
  if (['sn_verilog', 'sn_research', 'sn_reserve'].includes(provider)) {
    if (provider === 'sn_reserve') {
      logger.log({
        request_id: requestId,
        stage:      'model_call',
        status:     'warn',
        provider,
        model:      MODELS[provider],
        details:    { warning: 'sn_reserve has 3072 token output cap — truncation risk for Verilog' },
      });
    }
    const client = new OpenAI({
      baseURL: 'https://api.sambanova.ai/v1',
      apiKey:  process.env.SAMBANOVA_API_KEY!,
    });
    const res = await client.chat.completions.create({
      model:       MODELS[provider],
      messages,
      max_tokens:  provider === 'sn_verilog' ? 8000 : 2000,
      temperature: 0.1,
    });
    return {
      text:   res.choices[0]?.message?.content ?? '',
      tokens: res.usage?.total_tokens ?? 0,
    };
  }

  // ── GEMINI ────────────────────────────────────────────────────────────────
  if (['gemini_p', 'gemini_f', 'gemini_lite'].includes(provider)) {
    const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model  = genAI.getGenerativeModel({ model: MODELS[provider] });
    const result = await model.generateContent([{ text: system }, { text: user }]);
    const tokens = result.response.usageMetadata?.totalTokenCount ?? 0;
    return { text: result.response.text(), tokens };
  }

  throw new Error(`Unknown provider: ${provider}`);
}

// ── Vision-specific Gemini call (used by scan route) ────────────────────────
const VISION_MODELS: AIProvider[] = ['gemini_p', 'gemini_f'];

export async function callGeminiVision(
  imageBase64: string,
  mimeType:    string,
  system:      string,
  userPrompt:  string,
  requestId:   string,
): Promise<{ text: string; model: string }> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  let lastError: Error | null = null;

  for (const providerKey of VISION_MODELS) {
    try {
      const hasBudget = await checkProviderBudget(providerKey);
      if (!hasBudget) {
        logger.fallback(requestId, 'model_call', providerKey, 'vision_budget_exhausted');
        continue;
      }
      const model = genAI.getGenerativeModel({ model: MODELS[providerKey] });
      const result = await model.generateContent([
        { text: system },
        { inlineData: { data: imageBase64, mimeType } },
        { text: userPrompt },
      ]);
      logger.modelCall(requestId, providerKey, MODELS[providerKey], 'success');
      return { text: result.response.text(), model: MODELS[providerKey] };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const e = err as { status?: number; message?: string };
      const isRetryable =
        e?.status === 429 ||
        e?.status === 503 ||
        e?.message?.includes('model not found') ||
        e?.message?.includes('not found');
      logger.modelCall(requestId, providerKey, MODELS[providerKey], isRetryable ? 'fallback' : 'failure', {
        error_msg: lastError.message,
      });
      if (isRetryable) continue;
      throw err;
    }
  }
  throw new Error(`All vision models failed. Last: ${lastError?.message}`);
}
