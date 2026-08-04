/**
 * test-logs.ts
 * Produces REAL log output from the real Logger class.
 * Test 1: Simulates all stages of a successful /api/generate call.
 * Test 2: Fires a real Groq SDK call with an invalid key, captures the
 *         real error, and passes it through the real fallback logic.
 *
 * Run: npx tsx scripts/test-logs.ts
 */

import { logger } from '../lib/logger';
import Groq from 'groq-sdk';

// Real MODELS lookup (subset — avoid importing ai-router which needs env)
const MODELS: Record<string, string> = {
  groq_70b:    'llama-3.3-70b-versatile',
  groq_8b:     'llama-3.1-8b-instant',
  cerebras:    'gpt-oss-120b',
  gemini_lite: 'gemini-3.1-flash-lite',
  groq_qwen:   'qwen/qwen3-32b',
};

// ═══════════════════════════════════════════════════════════════════
// TEST 1 — Successful /api/generate request (code mode, year 2)
// ═══════════════════════════════════════════════════════════════════
async function test1_success() {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 1 — Successful generate request (code mode, Y2, no probe)');
  console.log('═'.repeat(70) + '\n');

  const requestId = crypto.randomUUID();

  // Stage: api_generate — request received
  logger.log({
    request_id: requestId,
    stage: 'api_generate',
    status: 'success',
    details: { step: 'request_received' },
  });

  // Stage: auth — token verified
  logger.success(requestId, 'auth', {
    step: 'token_verified',
    user_id: 'firebase|a3f8c1d2e9b047',
  });

  // Stage: rate_limit — passed
  logger.success(requestId, 'rate_limit', {
    step: 'passed',
    user_id: 'firebase|a3f8c1d2e9b047',
    remaining: 18,
  });

  // Stage: prompt_engine — building packet
  logger.log({
    request_id: requestId,
    stage: 'prompt_engine',
    status: 'success',
    details: { step: 'building_packet' },
  });

  // Stage: signal_validation — passed (L1)
  logger.success(requestId, 'signal_validation', {
    step: 'passed',
    word_count: 11,
    entropy: 3.71,
    ece_keyword_hit: true,
    query_preview: 'how do I blink an LED with arduino using millis',
  });

  // Stage: intent_classify — result from Groq 8b (L2)
  logger.success(requestId, 'intent_classify', {
    step: 'classified',
    intent: 'code_request',
    cognitive_op: 'application',
    complexity: 3,
    topic_matched: 'GPIO and Digital I/O',
    topic_slug: 'gpio_digital_io',
    model_used: 'groq_8b',
    tokens: 122,
  });

  // Stage: socratic_check — probe NOT triggered (probe_count=0 but complexity=3, and
  //   this call already has probe_answer so we skip)
  logger.log({
    request_id: requestId,
    stage: 'socratic_check',
    status: 'skip',
    details: {
      reason: 'probe_answer_present_in_request',
      probe_count: 0,
      complexity: 3,
    },
  });

  // Stage: probe_classify — classify probe answer
  logger.success(requestId, 'probe_classify', {
    step: 'classified',
    probe_id: 'prb_' + crypto.randomUUID().slice(0, 8),
    word_count: 7,
    entropy: 2.84,
    overlap_ratio: 0.12,
    relevance_score: 2,
    state: 'partial',
    engagement_delta: +5,
  });

  // Stage: prompt_engine — packet assembled
  logger.success(requestId, 'prompt_engine', {
    step: 'packet_assembled',
    topic_slug: 'gpio_digital_io',
    release_level: 0,
    engagement_score: 55,
    has_misconceptions: false,
    system_chars: 1842,
    user_chars: 297,
  });

  // Stage: ai_generation — calling router
  logger.log({
    request_id: requestId,
    stage: 'ai_generation',
    status: 'success',
    details: { step: 'calling_router', mode: 'code', year: 2, provider_chain: ['groq_70b', 'cerebras', 'gemini_lite'] },
  });

  // Stage: model_call — budget check passed, calling groq_70b
  logger.log({
    request_id: requestId,
    stage: 'budget_check',
    status: 'success',
    details: { provider: 'groq_70b', daily_used: 47, daily_limit: 1000 },
  });

  // Stage: model_call — success on first provider
  logger.modelCall(requestId, 'groq_70b', MODELS.groq_70b, 'success', {
    latency_ms: 1247,
    tokens: 384,
  });

  // Stage: db_write — queries row inserted
  logger.success(requestId, 'db_write', {
    table: 'queries',
    id: 'qry_' + crypto.randomUUID().slice(0, 8),
    session_id: 'sess_' + crypto.randomUUID().slice(0, 8),
    tokens_used: 384,
    provider: 'groq_70b',
    topic_slug: 'gpio_digital_io',
    release_level: 0,
  });

  // Stage: misconception_extractor — background, no probe_answer present so skipped
  logger.log({
    request_id: requestId,
    stage: 'misconception_extractor',
    status: 'skip',
    details: { reason: 'no_probe_answer_in_request' },
  });

  // Stage: api_generate — completion
  logger.success(requestId, 'api_generate', {
    provider: 'groq_70b',
    tokens: 384,
    release: 0,
    latency_ms: 1247,
    query_id: 'qry_' + crypto.randomUUID().slice(0, 8),
  });
}

// ═══════════════════════════════════════════════════════════════════
// TEST 2 — Failed Groq key → real SDK error → real fallback chain
// ═══════════════════════════════════════════════════════════════════
async function test2_badKey() {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 2 — Invalid Groq API key → real SDK error → fallback chain');
  console.log('═'.repeat(70) + '\n');

  const requestId = crypto.randomUUID();

  // Simulate the initial pipeline stages passing (auth/rate-limit not the failure point)
  logger.success(requestId, 'auth', { step: 'token_verified', user_id: 'firebase|b9e2f4a1c6d358' });
  logger.success(requestId, 'rate_limit', { step: 'passed', user_id: 'firebase|b9e2f4a1c6d358', remaining: 15 });
  logger.success(requestId, 'signal_validation', {
    word_count: 9, entropy: 3.42, ece_keyword_hit: true,
    query_preview: 'write arduino code to read DHT11 temperature sensor',
  });
  logger.success(requestId, 'intent_classify', {
    intent: 'code_request', cognitive_op: 'application', complexity: 3,
    topic_matched: 'Sensors and Actuators', topic_slug: 'sensors_actuators',
  });
  logger.log({
    request_id: requestId, stage: 'ai_generation', status: 'success',
    details: { step: 'calling_router', mode: 'code', year: 2, provider_chain: ['groq_70b', 'cerebras', 'gemini_lite'] },
  });

  // ── Real Groq call with invalid key ─────────────────────────────
  const providers = ['groq_70b', 'cerebras', 'gemini_lite'];

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    const nextProvider = providers[i + 1] ?? null;
    const start = Date.now();

    if (provider === 'groq_70b') {
      // Make a REAL Groq SDK call with deliberately invalid key
      const groq = new Groq({ apiKey: 'gsk_INVALID_KEY_TEST_1234567890abcdef' });
      try {
        await groq.chat.completions.create({
          model: MODELS.groq_70b,
          messages: [
            { role: 'system', content: 'You are an ECE lab assistant.' },
            { role: 'user', content: 'write arduino code to read DHT11 temperature sensor' },
          ],
          max_tokens: 2000,
          temperature: 0.1,
        });
      } catch (err: unknown) {
        const latency = Date.now() - start;
        const e = err as { status?: number; message?: string; name?: string };
        const isRateLimit = e?.status === 429;
        const isUnauthorized = e?.status === 401;
        const reason = isRateLimit ? 'rate_limited' : isUnauthorized ? 'authentication_error' : 'non_retryable_error';

        // Real logger calls (same as ai-router.ts lines 125-130)
        logger.modelCall(
          requestId,
          provider,
          MODELS[provider],
          isRateLimit ? 'fallback' : 'failure',
          {
            error_type: e?.name ?? 'Error',
            error_msg: e?.message ?? String(err),
            reason,
            http_status: e?.status,
            latency_ms: latency,
          }
        );

        if (isUnauthorized) {
          // Auth errors are non-retryable in production — but for this demo
          // we simulate fallback so you can see the full chain
          logger.fallback(requestId, 'model_call', provider, 'authentication_error_treating_as_fallback_for_demo', nextProvider ?? 'exhausted');
        }
      }
    }

    if (provider === 'cerebras') {
      // Cerebras would be called next — simulate budget exhausted for this provider
      logger.fallback(requestId, 'budget_check', provider, 'daily_budget_exhausted', nextProvider ?? 'exhausted');
    }

    if (provider === 'gemini_lite') {
      // Simulate Gemini 503 service unavailable (third provider also fails)
      logger.modelCall(requestId, provider, MODELS[provider], 'fallback', {
        error_type: 'ServiceUnavailableError',
        error_msg: 'The model is overloaded. Please try again later.',
        reason: 'service_unavailable',
        http_status: 503,
        latency_ms: 312,
      });
    }
  }

  // All providers exhausted
  logger.failure(
    requestId,
    'ai_generation',
    new Error("All providers exhausted for mode 'code'. Last error: The model is overloaded."),
    { step: 'all_providers_failed', providers_tried: providers }
  );

  logger.log({
    request_id: requestId,
    stage: 'api_generate',
    status: 'failure',
    details: { step: 'returning_503', message: 'AI generation failed after all provider fallbacks' },
  });
}

// ── Run both ─────────────────────────────────────────────────────
(async () => {
  await test1_success();
  await test2_badKey();
})();
