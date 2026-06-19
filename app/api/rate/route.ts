// /app/api/rate/route.ts — Star rating for a completed query
// Ownership check: student can only rate their own queries
// 409 if already rated (to prevent double-update)

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase-admin';
import { supabase }    from '@/lib/supabase';
import { logger }      from '@/lib/logger';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  let userId: string;
  try {
    const decoded = await verifyToken(req);
    userId = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { query_id: string; rating: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { query_id, rating } = body;

  if (!query_id || typeof query_id !== 'string') {
    return NextResponse.json({ error: 'query_id required' }, { status: 400 });
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be 1-5' }, { status: 400 });
  }

  // Fetch user id from firebase_uid
  const { data: dbUser } = await supabase
    .from('users').select('id').eq('firebase_uid', userId).single();
  const dbUserId = dbUser?.id ?? null;

  // Ownership check: query must belong to this user
  const { data: queryRow } = await supabase
    .from('queries')
    .select('id, user_id, rating')
    .eq('id', query_id)
    .single();

  if (!queryRow) {
    return NextResponse.json({ error: 'Query not found' }, { status: 404 });
  }

  if (String(queryRow.user_id) !== String(dbUserId)) {
    logger.log({ request_id: requestId, stage: 'api_rate', status: 'warn',
      details: { reason: 'ownership_violation', query_id, user_id: userId } });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 409 if already rated
  if (queryRow.rating !== null && queryRow.rating !== undefined) {
    return NextResponse.json({ error: 'Query already rated', current_rating: queryRow.rating }, { status: 409 });
  }

  const { error } = await supabase
    .from('queries')
    .update({ rating })
    .eq('id', query_id);

  if (error) {
    logger.failure(requestId, 'db_write', error, { table: 'queries', query_id });
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }

  logger.success(requestId, 'api_rate', { query_id, rating });
  return NextResponse.json({ success: true });
}
