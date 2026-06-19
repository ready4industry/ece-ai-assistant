// /app/api/flags/route.ts — Faculty flags: list (GET) and create/resolve (POST/PATCH)

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase-admin';
import { supabase }    from '@/lib/supabase';
import { logger }      from '@/lib/logger';

async function getFacultyId(userId: string): Promise<{ id: string; role: string } | null> {
  const { data } = await supabase
    .from('users')
    .select('id, role')
    .eq('firebase_uid', userId)
    .single();
  return data;
}

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  let userId: string;
  try {
    const decoded = await verifyToken(req);
    userId = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getFacultyId(userId);
  if (!user || user.role !== 'faculty') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const resolved = searchParams.get('resolved') === 'true';

  const { data: flags, error } = await supabase
    .from('faculty_flags')
    .select('id, user_id, reason, flag_type, session_snapshot, created_at, resolved, resolved_at')
    .eq('resolved', resolved)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    logger.failure(requestId, 'db_read', error, { table: 'faculty_flags' });
    return NextResponse.json({ error: 'Failed to fetch flags' }, { status: 500 });
  }

  return NextResponse.json({ flags: flags ?? [] });
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  let userId: string;
  try {
    const decoded = await verifyToken(req);
    userId = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { target_user_id: string; reason: string; flag_type?: string; session_snapshot?: object };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { target_user_id, reason, flag_type = 'disengagement', session_snapshot } = body;

  const { data, error } = await supabase.from('faculty_flags').insert({
    user_id:          target_user_id,
    flagged_by:       userId,
    reason,
    flag_type,
    session_snapshot: session_snapshot ?? null,
  }).select('id').single();

  if (error) {
    logger.failure(requestId, 'db_write', error, { table: 'faculty_flags' });
    return NextResponse.json({ error: 'Failed to create flag' }, { status: 500 });
  }

  logger.success(requestId, 'api_flags', { flag_id: data?.id, target_user_id });
  return NextResponse.json({ flag_id: data?.id });
}

export async function PATCH(req: NextRequest) {
  const requestId = crypto.randomUUID();
  let userId: string;
  try {
    const decoded = await verifyToken(req);
    userId = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getFacultyId(userId);
  if (!user || user.role !== 'faculty') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { flag_id: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { error } = await supabase.from('faculty_flags').update({
    resolved: true, resolved_at: new Date().toISOString(),
  }).eq('id', body.flag_id);

  if (error) {
    logger.failure(requestId, 'db_write', error, { table: 'faculty_flags', flag_id: body.flag_id });
    return NextResponse.json({ error: 'Failed to resolve flag' }, { status: 500 });
  }

  logger.success(requestId, 'api_flags', { action: 'resolved', flag_id: body.flag_id });
  return NextResponse.json({ success: true });
}
