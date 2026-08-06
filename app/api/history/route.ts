// /app/api/history/route.ts — Query history for the authenticated student
// GapFix Gap 17: paginate scans to 10 per page (not unlimited)

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase-admin';
import { supabase }    from '@/lib/supabase';
import { logger }      from '@/lib/logger';

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    let userId: string;
    try {
      const decoded = await verifyToken(req);
      userId = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit    = 10;
    const offset   = (page - 1) * limit;
    const modeFilter = searchParams.get('mode') ?? null;

    const { data: dbUser } = await supabase
      .from('users').select('id').eq('firebase_uid', userId).single();
    const dbUserId = dbUser?.id;

    if (!dbUserId) {
      return NextResponse.json({ queries: [], scans: [], total: 0 });
    }

    // Queries history
    let qBuilder = supabase
      .from('queries')
      .select('id, query_text, response_text, mode, subject, topic_slug, provider, tokens_used, rating, release_level, created_at', { count: 'exact' })
      .eq('user_id', dbUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (modeFilter) qBuilder = qBuilder.eq('mode', modeFilter);

    const { data: queries, count, error: qErr } = await qBuilder;

    if (qErr) {
      logger.failure(requestId, 'db_read', qErr, { table: 'queries' });
      return NextResponse.json({ queries: [], scans: [], total: 0 });
    }

    // Scans history
    const { data: scans } = await supabase
      .from('scans')
      .select('id, image_url, analysis, provider, created_at')
      .eq('user_id', dbUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    logger.success(requestId, 'api_history', { user_id: userId, page, count });

    return NextResponse.json({
      queries:      queries ?? [],
      scans:        scans ?? [],
      total:        count ?? 0,
      page,
      pages:        Math.ceil((count ?? 0) / limit),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.failure(requestId, 'api_history_uncaught', err);
    return NextResponse.json({ error: 'Internal Server Error', message: errorMsg }, { status: 500 });
  }
}

