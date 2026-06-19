// /app/api/cron/assign-cohorts/route.ts
// Vercel Cron: weekly on Monday 06:00 IST (00:30 UTC)
// Assigns students to cohort tiers based on progression scores

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger }   from '@/lib/logger';

type CohortTier = 'advanced' | 'on_track' | 'needs_support' | 'at_risk';

function scoreToCohort(avgScore: number): CohortTier {
  if (avgScore >= 75) return 'advanced';
  if (avgScore >= 50) return 'on_track';
  if (avgScore >= 25) return 'needs_support';
  return 'at_risk';
}

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.log({ request_id: requestId, stage: 'cron_assign_cohorts', status: 'success', details: { step: 'started' } });

  // Fetch average progression score per student
  const { data: metrics } = await supabase
    .from('progression_metrics')
    .select('user_id, score');

  if (!metrics?.length) {
    return NextResponse.json({ assigned: 0 });
  }

  // Average across topics per student
  const studentScores: Record<string, number[]> = {};
  for (const row of metrics) {
    if (!row.user_id) continue;
    if (!studentScores[row.user_id]) studentScores[row.user_id] = [];
    studentScores[row.user_id].push(row.score);
  }

  let assigned = 0;
  let failed   = 0;

  for (const [userId, scores] of Object.entries(studentScores)) {
    const avg    = scores.reduce((a, b) => a + b, 0) / scores.length;
    const cohort = scoreToCohort(avg);

    const { error } = await supabase.from('cohort_assignments').upsert({
      user_id:     userId,
      cohort_tier: cohort,
      avg_score:   Math.round(avg),
      assigned_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) {
      failed++;
      logger.failure(requestId, 'cron_assign_cohorts', error, { user_id: userId });
    } else {
      assigned++;
    }
  }

  const tierCounts: Record<CohortTier, number> = { advanced: 0, on_track: 0, needs_support: 0, at_risk: 0 };
  for (const scores of Object.values(studentScores)) {
    const avg    = scores.reduce((a, b) => a + b, 0) / scores.length;
    tierCounts[scoreToCohort(avg)]++;
  }

  logger.success(requestId, 'cron_assign_cohorts', { assigned, failed, tier_distribution: tierCounts });
  return NextResponse.json({ assigned, failed, tier_distribution: tierCounts });
}
