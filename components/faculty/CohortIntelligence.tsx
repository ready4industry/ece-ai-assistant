'use client';

interface CohortAssignment {
  user_id:     string;
  cohort_tier: 'advanced' | 'on_track' | 'needs_support' | 'at_risk';
  avg_score:   number;
  assigned_at: string;
}

interface MisconceptionCluster {
  id:                string;
  cluster_label:     string;
  top_misconception: string;
  member_count:      number;
  created_at:        string;
}

interface CohortIntelligenceProps {
  data: Record<string, unknown> | null;
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  advanced:      { label: 'Advanced',       color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  on_track:      { label: 'On Track',       color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  needs_support: { label: 'Needs Support',  color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  at_risk:       { label: 'At Risk',        color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
};

export function CohortIntelligence({ data }: CohortIntelligenceProps) {
  const clusters = (data?.misconception_clusters as MisconceptionCluster[]) ?? [];
  const progressionMetrics = (data?.progression_metrics as Array<{ user_id: string; topic_slug: string; score: number }>) ?? [];

  // Derive cohort distribution from progression metrics
  const userAvgScores: Record<string, number[]> = {};
  for (const m of progressionMetrics) {
    if (!userAvgScores[m.user_id]) userAvgScores[m.user_id] = [];
    userAvgScores[m.user_id].push(m.score);
  }

  const tierCounts: Record<string, number> = { advanced: 0, on_track: 0, needs_support: 0, at_risk: 0 };
  for (const scores of Object.values(userAvgScores)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const tier = avg >= 75 ? 'advanced' : avg >= 50 ? 'on_track' : avg >= 25 ? 'needs_support' : 'at_risk';
    tierCounts[tier]++;
  }

  const totalStudents = Object.values(tierCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h2 className="text-base font-semibold text-on-surface">Cohort Intelligence</h2>

      {/* Tier distribution */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(TIER_CONFIG).map(([tier, cfg]) => (
          <div key={tier} className={`rounded-xl border p-4 ${cfg.bg}`}>
            <p className={`text-xs font-medium mb-1 ${cfg.color}`}>{cfg.label}</p>
            <p className={`text-2xl font-bold ${cfg.color}`}>{tierCounts[tier] ?? 0}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {totalStudents > 0 ? Math.round(((tierCounts[tier] ?? 0) / totalStudents) * 100) : 0}% of class
            </p>
          </div>
        ))}
      </div>

      {/* Misconception clusters */}
      <div className="bg-surface rounded-xl border border-outline-variant p-5">
        <h3 className="text-sm font-semibold text-on-surface mb-4">Misconception Clusters</h3>
        {clusters.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-on-surface-variant">No misconception clusters yet.</p>
            <p className="text-xs text-on-surface-variant mt-1">Clusters are computed weekly from probe response data.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clusters.map((c, i) => (
              <div key={c.id} className="flex items-start gap-4 p-4 bg-surface-container-low rounded-lg">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < 3 ? 'bg-red-100 text-red-700' : 'bg-surface-container text-on-surface-variant'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface">{c.cluster_label}</p>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{c.top_misconception}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-on-surface">{c.member_count}</p>
                  <p className="text-xs text-on-surface-variant">students</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Low engagement alert */}
      {(data?.low_engagement as unknown[])?.length > 0 && (
        <div className="bg-surface rounded-xl border border-orange-200 p-5">
          <h3 className="text-sm font-semibold text-orange-700 mb-3">⚠ Low Engagement Students</h3>
          <p className="text-xs text-on-surface-variant mb-3">Students with engagement score below threshold:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(data?.low_engagement as Array<{ id: string; year_of_study: number }>).slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-xs text-orange-700">Y{s.year_of_study}</span>
                </div>
                <span className="text-xs text-on-surface font-mono">{s.id.slice(0, 8)}…</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
