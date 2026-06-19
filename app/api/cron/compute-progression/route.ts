// /app/api/cron/compute-progression/route.ts
// Vercel Cron: weekly on Sunday 22:00 IST (16:30 UTC)
// Computes per-student per-topic progression scores from probe response history

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger }   from '@/lib/logger';

const SCORE_WEIGHTS: Record<string, number> = {
  correct:          1.0,
  partial:          0.6,
  honest_confusion: 0.3,
  surface_answer:   0.2,
  disengaged:      -0.1,
  irrelevant_genuine: 0.1,
};

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.log({ request_id: requestId, stage: 'cron_compute_progression', status: 'success', details: { step: 'started' } });

  // Fetch all probe responses with their topic slugs via probe join
  const { data: responses } = await supabase
    .from('probe_responses')
    .select(`
      id,
      classification,
      created_at,
      probes(user_id, topic_slug)
    `)
    .order('created_at', { ascending: true })
    .limit(5000);

  if (!responses?.length) {
    return NextResponse.json({ processed: 0 });
  }

  // Aggregate per user per topic
  type TopicAccum = { user_id: string; topic_slug: string; scores: number[]; latest: string };
  const accumMap: Record<string, TopicAccum> = {};

  for (const row of responses) {
    const probe = row.probes as unknown as { user_id: string; topic_slug: string } | null;
    if (!probe?.user_id || !probe?.topic_slug) continue;

    const key   = `${probe.user_id}::${probe.topic_slug}`;
    const score = SCORE_WEIGHTS[row.classification] ?? 0;

    if (!accumMap[key]) {
      accumMap[key] = { user_id: probe.user_id, topic_slug: probe.topic_slug, scores: [], latest: row.created_at };
    }
    accumMap[key].scores.push(score);
    accumMap[key].latest = row.created_at;
  }

  let written = 0;
  let failed  = 0;

  for (const { user_id, topic_slug, scores, latest } of Object.values(accumMap)) {
    // Weighted average: more recent attempts count more (linear decay)
    const weighted = scores.reduce((sum, s, i) => sum + s * (i + 1), 0) /
                     scores.reduce((sum, _, i) => sum + (i + 1), 0);
    const finalScore = Math.round(weighted * 100);

    const { error } = await supabase.from('progression_metrics').upsert({
      user_id,
      topic_slug,
      score:       finalScore,
      attempt_count: scores.length,
      computed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,topic_slug' });

    if (error) {
      failed++;
      logger.failure(requestId, 'cron_compute_progression', error, { user_id, topic_slug });
    } else {
      written++;
    }
  }

  logger.success(requestId, 'cron_compute_progression', { written, failed });
  return NextResponse.json({ processed: written, failed });
}
