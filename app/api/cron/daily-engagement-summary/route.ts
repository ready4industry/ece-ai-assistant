// /app/api/cron/daily-engagement-summary/route.ts
// Vercel Cron: runs nightly at 23:30 IST (18:00 UTC)
// Aggregates session_engagement into daily_engagement_summary for faculty dashboard

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger }   from '@/lib/logger';

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  // Vercel cron auth
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.log({ request_id: requestId, stage: 'cron_daily_engagement', status: 'success', details: { step: 'started' } });

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Get all students with query activity today
  const { data: todayQueries } = await supabase
    .from('queries')
    .select('user_id, engagement_delta, topic_slug')
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at',  `${today}T23:59:59.999Z`);

  if (!todayQueries?.length) {
    logger.log({ request_id: requestId, stage: 'cron_daily_engagement', status: 'success',
      details: { step: 'no_activity_today' } });
    return NextResponse.json({ processed: 0, date: today });
  }

  // Aggregate per user
  const userStats: Record<string, { query_count: number; engagement_sum: number; topics: Set<string> }> = {};
  for (const row of todayQueries) {
    if (!row.user_id) continue;
    if (!userStats[row.user_id]) {
      userStats[row.user_id] = { query_count: 0, engagement_sum: 0, topics: new Set() };
    }
    userStats[row.user_id].query_count++;
    userStats[row.user_id].engagement_sum += (row.engagement_delta ?? 0);
    if (row.topic_slug) userStats[row.user_id].topics.add(row.topic_slug);
  }

  let inserted = 0;
  let failed   = 0;

  for (const [userId, stats] of Object.entries(userStats)) {
    const { error } = await supabase.from('daily_engagement_summary').upsert({
      user_id:          userId,
      date:             today,
      query_count:      stats.query_count,
      engagement_delta: stats.engagement_sum,
      topics_touched:   Array.from(stats.topics),
      computed_at:      new Date().toISOString(),
    }, { onConflict: 'user_id,date' });

    if (error) {
      failed++;
      logger.failure(requestId, 'cron_daily_engagement', error, { user_id: userId });
    } else {
      inserted++;
    }
  }

  logger.success(requestId, 'cron_daily_engagement', { date: today, inserted, failed });
  return NextResponse.json({ processed: inserted, failed, date: today });
}
