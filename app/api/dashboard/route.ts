// /app/api/dashboard/route.ts — Faculty-only dashboard data endpoint

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase-admin';
import { supabase }    from '@/lib/supabase';
import { logger }      from '@/lib/logger';

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  let userId: string;
  try {
    const decoded = await verifyToken(req);
    userId = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Faculty-only guard
  const { data: dbUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('firebase_uid', userId)
    .single();

  if (!dbUser || dbUser.role !== 'faculty') {
    logger.log({ request_id: requestId, stage: 'api_dashboard', status: 'warn',
      details: { reason: 'not_faculty', user_id: userId } });
    return NextResponse.json({ error: 'Forbidden — faculty only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const yearFilter = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : null;

  // Active students today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: activeToday } = await supabase
    .from('queries')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString());

  // Queries in last 24h per mode
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const { data: queriesByMode } = await supabase
    .from('queries')
    .select('mode')
    .gte('created_at', yesterday);

  const modeCounts: Record<string, number> = {};
  for (const row of queriesByMode ?? []) {
    modeCounts[row.mode] = (modeCounts[row.mode] ?? 0) + 1;
  }

  // Low-engagement students (score < 40)
  const { data: lowEngagement } = await supabase
    .from('users')
    .select('id, email:firebase_uid, year_of_study, session_engagement(engagement_score)')
    .eq('role', 'student')
    .limit(50);

  // Recent faculty flags
  const { data: flags } = await supabase
    .from('faculty_flags')
    .select('id, user_id, reason, created_at, resolved')
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(20);

  // Cohort misconception clusters
  const { data: misconceptionClusters } = await supabase
    .from('misconception_clusters')
    .select('id, cluster_label, member_count, top_misconception, created_at')
    .order('member_count', { ascending: false })
    .limit(10);

  // Topic difficulty (topics with most honest_confusion probe responses)
  const { data: difficultTopics } = await supabase
    .from('probe_responses')
    .select('topic:probes(topic_slug), classification')
    .eq('classification', 'honest_confusion')
    .limit(100);

  const topicConfusionCount: Record<string, number> = {};
  for (const row of difficultTopics ?? []) {
    const slug = (row.topic as unknown as { topic_slug: string })?.topic_slug ?? 'unknown';
    topicConfusionCount[slug] = (topicConfusionCount[slug] ?? 0) + 1;
  }
  const hardestTopics = Object.entries(topicConfusionCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([slug, count]) => ({ slug, confusion_count: count }));

  // Progression metrics (last cohort run)
  const { data: progressionMetrics } = await supabase
    .from('progression_metrics')
    .select('user_id, topic_slug, score, computed_at')
    .order('computed_at', { ascending: false })
    .limit(100);

  logger.success(requestId, 'api_dashboard', { faculty_id: userId });

  return NextResponse.json({
    active_students_today: activeToday ?? 0,
    queries_by_mode:       modeCounts,
    low_engagement:        lowEngagement ?? [],
    open_flags:            flags ?? [],
    misconception_clusters: misconceptionClusters ?? [],
    hardest_topics:        hardestTopics,
    progression_metrics:   progressionMetrics ?? [],
  });
}
