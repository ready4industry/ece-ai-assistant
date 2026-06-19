'use client';

import { useState } from 'react';
import { useAuth }  from '@/components/AuthProvider';

interface ResearchOutputProps {
  data: Record<string, unknown> | null;
}

export function ResearchOutput({ data }: ResearchOutputProps) {
  const { user }           = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportData, setExportData] = useState<Record<string, unknown> | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);

  const progressionMetrics = (data?.progression_metrics as Array<{ user_id: string; topic_slug: string; score: number; computed_at: string }>) ?? [];

  async function handleExportNBA() {
    if (!user) return;
    setExporting(true);
    try {
      const token = await user.getIdToken();
      const url   = `/api/admin/export-nba${yearFilter ? `?year=${yearFilter}` : ''}`;
      const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      setExportData(result);
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  }

  const coAttainment = (exportData?.co_attainment as Record<string, number>) ?? {};
  const poAttainment = (exportData?.po_attainment as Record<string, number>) ?? {};

  // Topic coverage stats from progression
  const topicScoreMap: Record<string, number[]> = {};
  for (const m of progressionMetrics) {
    if (!topicScoreMap[m.topic_slug]) topicScoreMap[m.topic_slug] = [];
    topicScoreMap[m.topic_slug].push(m.score);
  }

  const topicAvgs = Object.entries(topicScoreMap)
    .map(([slug, scores]) => ({
      slug,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
    }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-on-surface">Research Output & NBA Evidence</h2>
          <p className="text-sm text-on-surface-variant mt-0.5">CO-PO evidence log for accreditation reporting</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            <button
              onClick={() => setYearFilter(null)}
              className={`px-3 py-1.5 rounded-lg text-xs border ${!yearFilter ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant'}`}
            >
              All Years
            </button>
            {[1, 2, 3, 4].map(y => (
              <button
                key={y}
                onClick={() => setYearFilter(yearFilter === y ? null : y)}
                className={`px-3 py-1.5 rounded-lg text-xs border ${yearFilter === y ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant'}`}
              >
                Y{y}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportNBA}
            disabled={exporting}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            {exporting ? 'Exporting…' : 'Export NBA Evidence'}
          </button>
        </div>
      </div>

      {/* CO-PO attainment heatmap */}
      {exportData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-surface rounded-xl border border-outline-variant p-5">
            <h3 className="text-sm font-semibold text-on-surface mb-3">CO Attainment (interaction count)</h3>
            {Object.keys(coAttainment).length === 0 ? (
              <p className="text-xs text-on-surface-variant">No CO evidence recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(coAttainment).sort(([,a],[,b]) => b - a).map(([co, count]) => (
                  <div key={co} className="flex items-center gap-3">
                    <span className="text-xs font-mono w-16 text-on-surface">{co}</span>
                    <div className="flex-1 bg-surface-container-high rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.min(100, (count / Math.max(...Object.values(coAttainment))) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-on-surface-variant w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface rounded-xl border border-outline-variant p-5">
            <h3 className="text-sm font-semibold text-on-surface mb-3">PO Attainment (interaction count)</h3>
            {Object.keys(poAttainment).length === 0 ? (
              <p className="text-xs text-on-surface-variant">No PO evidence recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(poAttainment).sort(([,a],[,b]) => b - a).map(([po, count]) => (
                  <div key={po} className="flex items-center gap-3">
                    <span className="text-xs font-mono w-16 text-on-surface">{po}</span>
                    <div className="flex-1 bg-surface-container-high rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-secondary-container"
                        style={{ width: `${Math.min(100, (count / Math.max(...Object.values(poAttainment))) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-on-surface-variant w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Topic mastery overview */}
      <div className="bg-surface rounded-xl border border-outline-variant p-5">
        <h3 className="text-sm font-semibold text-on-surface mb-4">Topic Mastery Overview</h3>
        {topicAvgs.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-6">
            Progression data is computed weekly. Check back after the first cron run.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {topicAvgs.map(t => (
              <div key={t.slug} className="flex items-center gap-3">
                <span className="text-xs text-on-surface flex-1 truncate">{t.slug.replace(/_/g, ' ')}</span>
                <div className="w-32 bg-surface-container-high rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${t.avg >= 75 ? 'bg-green-500' : t.avg >= 50 ? 'bg-yellow-500' : t.avg >= 25 ? 'bg-orange-400' : 'bg-red-500'}`}
                    style={{ width: `${t.avg}%` }}
                  />
                </div>
                <span className="text-xs text-on-surface-variant w-10 text-right">{t.avg}%</span>
                <span className="text-xs text-on-surface-variant w-16 text-right">{t.count} students</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {exportData && (
        <div className="bg-surface-container rounded-lg px-4 py-3 text-xs text-on-surface-variant">
          Exported {(exportData.total_records as number) ?? 0} evidence records · {exportData.exported_at as string}
        </div>
      )}
    </div>
  );
}
