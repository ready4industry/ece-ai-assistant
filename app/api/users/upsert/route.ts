// /app/api/users/upsert/route.ts — Create or update user on first Firebase login

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase-admin';
import { supabase }    from '@/lib/supabase';
import { logger }      from '@/lib/logger';

export async function PUT(req: NextRequest) {
  const requestId = crypto.randomUUID();

  let userId: string;
  let email:  string | undefined;
  let name:   string | undefined;
  let photo:  string | undefined;

  try {
    const decoded = await verifyToken(req);
    userId = decoded.uid;
    email  = decoded.email ?? undefined;
    name   = decoded.name  ?? undefined;
    photo  = decoded.picture ?? undefined;
  } catch (err) {
    logger.failure(requestId, 'auth', err, {});
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { year_of_study?: number; role?: string } = {};
  try {
    body = await req.json();
  } catch {
    // body is optional
  }

  const year = body.year_of_study && [1, 2, 3, 4].includes(body.year_of_study)
    ? body.year_of_study
    : 1;

  // Only allow 'student' or 'faculty' as roles, default student
  const role = body.role === 'faculty' ? 'faculty' : 'student';

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        firebase_uid:  userId,
        email:         email ?? null,
        display_name:  name  ?? null,
        photo_url:     photo ?? null,
        role,
        year_of_study: year,
      },
      {
        onConflict: 'firebase_uid', // GapFix: upsert on firebase_uid conflict
        ignoreDuplicates: false,
      }
    )
    .select('id, role, year_of_study')
    .single();

  if (error) {
    logger.failure(requestId, 'db_write', error, { table: 'users', firebase_uid: userId });
    return NextResponse.json({ error: 'Failed to upsert user' }, { status: 500 });
  }

  logger.success(requestId, 'api_users_upsert', { firebase_uid: userId, db_id: data?.id });
  return NextResponse.json({ id: data?.id, role: data?.role, year_of_study: data?.year_of_study });
}
