// /app/api/cron/flush-knowledge-snapshots/route.ts
// Vercel Cron: runs nightly at 23:00 IST (17:30 UTC)
// Pulls knowledge_map from Redis session store and snapshots to Postgres

import { NextRequest, NextResponse } from 'next/server';
import { Redis }    from '@upstash/redis';
import { supabase } from '@/lib/supabase';
import { logger }   from '@/lib/logger';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.log({ request_id: requestId, stage: 'cron_flush_snapshots', status: 'success', details: { step: 'started' } });

  // Scan all session keys in Redis
  let cursor = 0;
  const sessionKeys: string[] = [];

  do {
    const result = await redis.scan(cursor, { match: 'session:*', count: 100 });
    cursor = Number(result[0]);
    sessionKeys.push(...(result[1] as string[]));
  } while (cursor !== 0);

  logger.log({ request_id: requestId, stage: 'cron_flush_snapshots', status: 'success',
    details: { session_count: sessionKeys.length } });

  let flushed = 0;
  let failed  = 0;

  for (const key of sessionKeys) {
    try {
      const session = await redis.get<Record<string, unknown>>(key);
      if (!session) continue;

      const knowledgeMap = (session as { knowledge_map?: Record<string, string> }).knowledge_map ?? {};
      if (Object.keys(knowledgeMap).length === 0) continue;

      const userId    = (session as { user_id?: string }).user_id;
      const sessionId = key.replace('session:', '');

      if (!userId) continue;

      const { error } = await supabase.from('knowledge_snapshots').insert({
        user_id:       userId,
        session_id:    sessionId,
        knowledge_map: knowledgeMap,
        snapshot_at:   new Date().toISOString(),
      });

      if (error) {
        failed++;
        logger.failure(requestId, 'cron_flush_snapshots', error, { session_id: sessionId });
      } else {
        flushed++;
      }
    } catch (err) {
      failed++;
      logger.failure(requestId, 'cron_flush_snapshots', err, { key });
    }
  }

  logger.success(requestId, 'cron_flush_snapshots', { flushed, failed, total: sessionKeys.length });
  return NextResponse.json({ flushed, failed, total: sessionKeys.length });
}
