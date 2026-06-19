'use client';

import { useState, useEffect, useCallback } from 'react';
import { Topbar }  from '@/components/Topbar';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/components/AuthProvider';

interface ProgressMetric {
  topic_slug: string;
  score:      number;
  attempt_count: number;
  computed_at:   string;
}

export default function ProgressPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ProgressMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    // Progress comes from the dashboard endpoint for now (student view)
    // A dedicated /api/progress endpoint could be added later
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  function scoreColor(score: number) {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 25) return 'text-orange-500';
    return 'text-red-500';
  }

  function scoreBar(score: number) {
    return (
      <div className="w-full bg-surface-container-high rounded-full h-2">
        <div
          className={`h-2 rounded-full ${score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : score >= 25 ? 'bg-orange-400' : 'bg-red-500'}`}
          style={{ width: `${score}%` }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Topbar title="Progress" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
          <h1 className="text-lg font-semibold text-on-surface">Knowledge Progress</h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : metrics.length === 0 ? (
            <div className="bg-surface rounded-xl border border-outline-variant p-8 text-center">
              <p className="text-sm text-on-surface-variant">
                Progress data is computed weekly from your probe responses.
                Answer more Socratic probes to see your topic mastery here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.map(m => (
                <div key={m.topic_slug} className="bg-surface rounded-xl border border-outline-variant p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-on-surface">{m.topic_slug.replace(/_/g, ' ')}</span>
                    <span className={`text-sm font-semibold ${scoreColor(m.score)}`}>{m.score}%</span>
                  </div>
                  {scoreBar(m.score)}
                  <p className="text-xs text-on-surface-variant mt-1.5">
                    {m.attempt_count} probe{m.attempt_count !== 1 ? 's' : ''} answered
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
