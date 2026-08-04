// /app/api/admin/debug/last-errors/route.ts — Last 50 error log entries
// Protected by ADMIN_SECRET header
// CRITICAL_AUTH_FAILURE entries appear at the top of the critical_alerts array.

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret');
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: errors, error } = await supabase
    .from('error_log')
    .select('id, request_id, stage, provider, error_type, error_msg, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: 'DB error', detail: error.message }, { status: 500 });
  }

  const all = errors ?? [];
  const criticalAlerts = all.filter(e => e.error_type === 'CRITICAL_AUTH_FAILURE');

  return NextResponse.json({
    critical_alerts: criticalAlerts,
    errors:          all,
    total:           all.length,
  });
}
