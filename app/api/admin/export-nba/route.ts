// /app/api/admin/export-nba/route.ts — Export CO-PO evidence log for NBA accreditation

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase-admin';
import { supabase }    from '@/lib/supabase';
import { logger }      from '@/lib/logger';

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  // Accept either admin secret OR faculty token
  const adminSecret = req.headers.get('x-admin-secret');
  if (adminSecret !== process.env.ADMIN_SECRET) {
    try {
      const decoded = await verifyToken(req);
      const { data: user } = await supabase.from('users').select('role').eq('firebase_uid', decoded.uid).single();
      if (user?.role !== 'faculty') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const yearFilter = searchParams.get('year');

  let builder = supabase
    .from('co_po_evidence_log')
    .select(`
      id,
      user_id,
      topic_slug,
      co_codes,
      po_codes,
      query_id,
      evidence_text,
      created_at,
      users(year_of_study)
    `)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (yearFilter) {
    builder = builder.eq('users.year_of_study', parseInt(yearFilter, 10));
  }

  const { data: evidence, error } = await builder;

  if (error) {
    logger.failure(requestId, 'admin_export_nba', error, {});
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  // Aggregate CO-PO attainment counts
  const coAttainment: Record<string, number> = {};
  const poAttainment: Record<string, number> = {};

  for (const row of evidence ?? []) {
    for (const co of (row.co_codes ?? [])) {
      coAttainment[co] = (coAttainment[co] ?? 0) + 1;
    }
    for (const po of (row.po_codes ?? [])) {
      poAttainment[po] = (poAttainment[po] ?? 0) + 1;
    }
  }

  logger.success(requestId, 'admin_export_nba', { row_count: evidence?.length });

  return NextResponse.json({
    evidence_log:   evidence ?? [],
    co_attainment:  coAttainment,
    po_attainment:  poAttainment,
    total_records:  evidence?.length ?? 0,
    exported_at:    new Date().toISOString(),
  });
}
