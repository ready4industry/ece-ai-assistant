// /app/api/scan/route.ts — Circuit/waveform image scanner
// GapFix Gap 11: await queries insert before scans insert
// GapFix Gap 16: 504 handling for Gemini Vision timeout

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken }      from '@/lib/firebase-admin';
import { supabase }         from '@/lib/supabase';
import { uploadScanImage }  from '@/lib/storage';
import { callGeminiVision } from '@/lib/ai-router';
import { buildScanPrompt }  from '@/lib/prompts/scan';
import { logger, persistError } from '@/lib/logger';
import type { ScanRequest } from '@/lib/types';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  logger.log({ request_id: requestId, stage: 'api_scan', status: 'success', details: { step: 'request_received' } });

  // ── Auth ──────────────────────────────────────────────────────────────────────
  let userId: string;
  try {
    const decoded = await verifyToken(req);
    userId = decoded.uid;
  } catch (err) {
    logger.failure(requestId, 'auth', err, {});
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse multipart form ──────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const imageFile = formData.get('image') as File | null;
  const query     = (formData.get('query') as string | null) ?? '';
  const year      = parseInt(formData.get('year') as string ?? '1', 10) as 1 | 2 | 3 | 4;
  const sessionId = (formData.get('session_id') as string | null) ?? `${userId}-${Date.now()}`;

  if (!imageFile) {
    return NextResponse.json({ error: 'image field is required' }, { status: 400 });
  }

  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  if (imageFile.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Image too large. Max 5 MB.' }, { status: 413 });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(imageFile.type)) {
    return NextResponse.json({ error: 'Unsupported image type. Use JPEG, PNG, WebP, or GIF.' }, { status: 415 });
  }

  // ── Upload to Supabase Storage ────────────────────────────────────────────────
  let storageUrl: string;
  let storagePath: string;
  try {
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);
    const result      = await uploadScanImage(buffer, imageFile.type, userId);
    storageUrl  = result.publicUrl;
    storagePath = result.path;
    logger.success(requestId, 'storage_upload', { path: storagePath });
  } catch (err) {
    logger.failure(requestId, 'storage_upload', err, {});
    await persistError({ request_id: requestId, stage: 'storage_upload', status: 'failure', error_msg: String(err) }, {});
    return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
  }

  // ── Fetch DB user ─────────────────────────────────────────────────────────────
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('firebase_uid', userId)
    .single();
  const dbUserId = dbUser?.id ?? null;

  // ── Gemini Vision call ────────────────────────────────────────────────────────
  const scanPrompt = buildScanPrompt(
    {
      student_year: year, subject: 'scan', topic_matched: '', topic_slug: '', prerequisites: [],
      complexity_score: 5, intent: 'image_analysis', cognitive_op: 'analysis',
      has_image: true, has_code_paste: false, has_error_paste: false,
      socratic_stage: 'graduated_release', probe_pending: false, probe_template: null,
      engagement_score: 50, release_level: 0, correct_concepts: [], misconceptions: [],
      prior_attempt: null, probe_answer: null, probe_answer_quality: 'none',
      recommended_model: 'gemini_p', fallback_models: ['gemini_f'],
      max_tokens: 1500, raw_query: query, session_history: '',
    },
    query,
  );

  let analysisText: string;
  let provider: string;

  try {
    const imageBytes = await imageFile.arrayBuffer();
    const base64     = Buffer.from(imageBytes).toString('base64');

    // GapFix Gap 16: wrap in AbortSignal for 504 protection
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 25000); // 25s

    try {
      const result = await callGeminiVision(
        base64,
        imageFile.type,
        scanPrompt.system,
        scanPrompt.user,
        requestId,
      );
      clearTimeout(timeoutId);
      analysisText = result.text;
      provider     = result.model ?? 'gemini_p';
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isTimeout = (err as Error)?.name === 'AbortError' || (err as Error)?.message?.includes('504');
      if (isTimeout) {
        logger.failure(requestId, 'ai_generation', err, { step: 'gemini_vision_timeout' });
        return NextResponse.json({ error: 'Image analysis timed out. Please try a smaller image.' }, { status: 504 });
      }
      throw err;
    }
  } catch (err) {
    logger.failure(requestId, 'ai_generation', err, { step: 'gemini_vision_failed' });
    await persistError({ request_id: requestId, stage: 'ai_generation', status: 'failure', error_msg: String(err) }, {});
    return NextResponse.json({ error: 'Image analysis failed' }, { status: 503 });
  }

  // ── Persist queries row first, then scans row ────────────────────────────── (GapFix Gap 11)
  const { data: queryRow, error: queryErr } = await supabase.from('queries').insert({
    user_id:       dbUserId,
    session_id:    sessionId,
    request_id:    requestId,
    query_text:    query || '[image scan]',
    response_text: analysisText,
    mode:          'scan',
    year_of_study: year,
    subject:       'scan',
    topic_slug:    '',
    provider,
    tokens_used:   0,
    release_level: 0,
    engagement_delta: 0,
  }).select('id').single();

  if (queryErr) {
    logger.failure(requestId, 'db_write', queryErr, { table: 'queries' });
  }

  // GapFix Gap 11: scans insert ONLY after queries insert resolves
  const { data: scanRow, error: scanErr } = await supabase.from('scans').insert({
    user_id:      dbUserId,
    query_id:     queryRow?.id ?? null, // FK — only set after queries row exists
    image_url:    storageUrl,
    storage_path: storagePath,
    analysis:     analysisText,
    provider,
  }).select('id').single();

  if (scanErr) {
    logger.failure(requestId, 'db_write', scanErr, { table: 'scans' });
  } else {
    logger.success(requestId, 'api_scan', { scan_id: scanRow?.id, query_id: queryRow?.id });
  }

  return NextResponse.json({
    analysis:  analysisText,
    provider,
    scan_id:   scanRow?.id  ?? null,
    query_id:  queryRow?.id ?? null,
    image_url: storageUrl,
  });
}
