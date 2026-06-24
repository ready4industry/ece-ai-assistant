// /app/api/generate/route.ts — Primary AI generation endpoint
// GapFix Gap 10: crypto.randomUUID (not nanoid)
// GapFix Gap 11: await scans insert only after queries insert resolves
// GapFix Gap 14: session_id stamped on DB row
// GapFix Gap 19: token capture from all providers

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken }     from '@/lib/firebase-admin';
import { supabase }        from '@/lib/supabase';
import { ratelimit }       from '@/lib/ratelimit';
import { buildPromptPacket } from '@/lib/prompt-engine';
import { getPrompt, type PromptMode } from '@/lib/prompts';
import { generate }        from '@/lib/ai-router';
import { extractAndVerifyMisconception } from '@/lib/misconception-extractor';
import { logger, persistError } from '@/lib/logger';
import type { GenerateRequest } from '@/lib/types';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID(); // GapFix Gap 10
  logger.log({ request_id: requestId, stage: 'api_generate', status: 'success', details: { step: 'request_received' } });

  // ── Auth ─────────────────────────────────────────────────────────────────────
  let userId: string;
  let userYear: 1 | 2 | 3 | 4;

  try {
    const decoded = await verifyToken(req);
    userId = decoded.uid;
  } catch (err) {
    logger.failure(requestId, 'auth', err, { step: 'token_verify_failed' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Rate limit ────────────────────────────────────────────────────────────────
  // Wrapped in try-catch: @upstash/ratelimit sliding window has a known null-arg
  // Lua script incompatibility with certain @upstash/redis versions. Fail open
  // (allow request) if Upstash itself errors — rate limiting is non-critical
  // infrastructure and must never block the core AI path.
  try {
    const { success: ratePassed } = await ratelimit.limit(userId);
    if (!ratePassed) {
      logger.log({ request_id: requestId, stage: 'rate_limit', status: 'warn', details: { user_id: userId } });
      return NextResponse.json({ error: 'Rate limit exceeded. Max 20 requests per hour.' }, { status: 429 });
    }
  } catch (rlErr) {
    logger.log({
      request_id: requestId,
      stage:      'rate_limit',
      status:     'warn',
      details:    { reason: 'ratelimit_infra_error_fail_open', error: String(rlErr) },
    });
    // Fail open — continue processing the request
  }

  // ── Parse body ────────────────────────────────────────────────────────────────
  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { query, mode, year, subject, session_id, probe_answer } = body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }
  if (!mode || !['code', 'error', 'concept', 'scan', 'verilog', 'project', 'research'].includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }
  if (!year || ![1, 2, 3, 4].includes(year)) {
    return NextResponse.json({ error: 'year must be 1-4' }, { status: 400 });
  }

  userYear = year as 1 | 2 | 3 | 4;
  const sessionId = session_id ?? `${userId}-${Date.now()}`;

  // ── Fetch user from DB ────────────────────────────────────────────────────────
  const { data: dbUser } = await supabase
    .from('users')
    .select('id, year_of_study')
    .eq('firebase_uid', userId)
    .single();

  const dbUserId = dbUser?.id ?? null;

  // ── L1-L4 Prompt engine ───────────────────────────────────────────────────────
  logger.log({ request_id: requestId, stage: 'prompt_engine', status: 'success', details: { step: 'building_packet' } });

  let packet;
  try {
    packet = await buildPromptPacket(query, sessionId, userId, userYear, subject ?? '', requestId, probe_answer ?? undefined);
  } catch (err) {
    logger.failure(requestId, 'prompt_engine', err, { step: 'build_packet_failed' });
    await persistError({ request_id: requestId, stage: 'prompt_engine', status: 'failure', error_type: 'Error', error_msg: String(err) }, {});
    return NextResponse.json({ error: 'Internal server error in prompt engine' }, { status: 500 });
  }

  // If engine decided to send a Socratic probe instead of calling AI
  if (packet.probe_pending && packet.probeToShow) {
    // Insert skeleton query row so probe_responses can FK back to it
    const { data: queryRow } = await supabase.from('queries').insert({
      user_id:       dbUserId,
      session_id:    sessionId, // GapFix Gap 14
      request_id:    requestId,
      query_text:    query,
      mode,
      year_of_study: userYear,
      subject:       subject ?? '',
      topic_slug:    packet.topic_slug ?? '',
      provider:      'groq_27b', // probe generator
      response_json: null,
      tokens_used:   0,
      release_level: packet.release_level,
      engagement_delta: 0,
    }).select('id').single();

    logger.success(requestId, 'api_generate', { step: 'probe_issued', query_id: queryRow?.id });

    return NextResponse.json({
      type:     'probe',
      probe:    packet.probeToShow,
      probe_id: packet.probeId ?? null,
      query_id: queryRow?.id ?? null,
    });
  }

  // ── Build prompt ──────────────────────────────────────────────────────────────
  const promptResult = getPrompt(mode as PromptMode, packet, query);

  // ── AI generation ─────────────────────────────────────────────────────────────
  logger.log({ request_id: requestId, stage: 'ai_generation', status: 'success', details: { step: 'calling_router' } });

  let aiResult;
  try {
    const routeMode = ((['code','error','concept','verilog','project','research'] as string[]).includes(mode) ? mode : 'concept') as import('@/lib/types').QueryMode;
    aiResult = await generate(
      routeMode,
      promptResult.system,
      promptResult.user,
      requestId,
      userYear,
    );
  } catch (err) {
    logger.failure(requestId, 'ai_generation', err, { step: 'all_providers_failed' });
    await persistError({ request_id: requestId, stage: 'ai_generation', status: 'failure', error_type: 'Error', error_msg: String(err) }, {});
    return NextResponse.json({ error: 'AI generation failed after all provider fallbacks' }, { status: 503 });
  }

  // ── Persist to DB ─────────────────────────────────────────────────────────────
  const { data: queryRow, error: queryErr } = await supabase.from('queries').insert({
    user_id:          dbUserId,
    session_id:       sessionId, // GapFix Gap 14
    request_id:       requestId,
    query_text:       query,
    response_json:    JSON.stringify({ text: aiResult.text }),
    mode,
    year_of_study:    userYear,
    subject:          subject ?? '',
    topic_slug:       packet.topic_slug ?? '',
    provider:         aiResult.provider,
    tokens_used:      aiResult.tokens_used ?? 0, // GapFix Gap 19
    release_level:    packet.release_level,
    engagement_delta: 0,
    misconceptions_tagged: [],
  }).select('id').single(); // GapFix Gap 11: await before any dependent writes

  if (queryErr) {
    logger.failure(requestId, 'db_write', queryErr, { table: 'queries' });
  } else {
    logger.success(requestId, 'db_write', { table: 'queries', id: queryRow?.id });
  }

  // ── Background: Misconception extraction (non-blocking) ───────────────────────
  if (probe_answer && packet.topic_slug && queryRow?.id) {
    const pendingProbeQuestion = packet.probe_template ?? '';
    extractAndVerifyMisconception(
      pendingProbeQuestion,
      probe_answer,
      packet.topic_slug,
      packet.topic_matched,
      userYear,
      userId,
      requestId,
    ).then(result => {
      if (result.verified && result.misconception && queryRow?.id) {
        supabase.from('queries').update({
          misconceptions_tagged: [result.misconception],
        }).eq('id', queryRow.id).then(() => {});
      }
    }).catch(() => {});
  }

  logger.success(requestId, 'api_generate', {
    provider: aiResult.provider,
    tokens:   aiResult.tokens_used,
    release:  packet.release_level,
    query_id: queryRow?.id,
  });

  return NextResponse.json({
    type:       'answer',
    text:       aiResult.text,
    provider:   aiResult.provider,
    tokens:     aiResult.tokens_used,
    query_id:   queryRow?.id ?? null,
    topic:      packet.topic_matched ?? null,
    topic_slug: packet.topic_slug ?? null,
    release_level: packet.release_level,
  });
}
