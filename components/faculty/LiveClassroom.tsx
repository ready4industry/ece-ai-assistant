'use client';

// Live Classroom tab — matches professor_dashboard.html layout exactly:
// Top stats row → Active Student Queries panel (scrollable) → Socratic Probe Monitor

interface Flag {
  id:         string;
  user_id:    string;
  reason:     string;
  flag_type:  string;
  created_at: string;
}

interface LiveClassroomProps {
  data:      Record<string, unknown> | null;
  onRefresh: () => void;
}

export function LiveClassroom({ data, onRefresh }: LiveClassroomProps) {
  const activeToday    = (data?.active_students_today as number) ?? 0;
  const openFlags      = (data?.open_flags as Flag[]) ?? [];
  const queriesByMode  = (data?.queries_by_mode as Record<string, number>) ?? {};
  const totalQueries   = Object.values(queriesByMode).reduce((a, b) => a + b, 0);
  const hardestTopics  = (data?.hardest_topics as Array<{ slug: string; confusion_count: number }>) ?? [];

  const MODE_COLORS: Record<string, string> = {
    code:     'bg-blue-100 text-blue-700',
    error:    'bg-red-100 text-red-700',
    concept:  'bg-green-100 text-green-700',
    verilog:  'bg-purple-100 text-purple-700',
    project:  'bg-orange-100 text-orange-700',
    research: 'bg-teal-100 text-teal-700',
    scan:     'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Students Today" value={String(activeToday)} accent="text-primary" />
        <StatCard label="Queries (24h)"          value={String(totalQueries)} accent="text-on-surface" />
        <StatCard label="Open Flags"             value={String(openFlags.length)} accent={openFlags.length > 0 ? 'text-red-600' : 'text-green-600'} />
        <StatCard label="Topics in Confusion"    value={String(hardestTopics.length)} accent="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query mode breakdown */}
        <div className="bg-surface rounded-xl border border-outline-variant p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-on-surface">Queries by Mode (24h)</h2>
            <button onClick={onRefresh} className="text-xs text-primary hover:underline">Refresh</button>
          </div>
          {Object.keys(queriesByMode).length === 0 ? (
            <p className="text-xs text-on-surface-variant">No queries in the last 24 hours.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(queriesByMode).sort(([,a],[,b]) => b - a).map(([mode, count]) => (
                <div key={mode} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-20 text-center ${MODE_COLORS[mode] ?? 'bg-surface-container text-on-surface'}`}>
                    {mode}
                  </span>
                  <div className="flex-1 bg-surface-container-high rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.round((count / Math.max(totalQueries, 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-on-surface-variant w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Socratic Probe Monitor — hardest topics */}
        <div className="bg-surface rounded-xl border border-outline-variant p-5">
          <h2 className="text-sm font-semibold text-on-surface mb-4">Socratic Probe Monitor</h2>
          <p className="text-xs text-on-surface-variant mb-3">Topics with most &quot;honest_confusion&quot; probe responses:</p>
          {hardestTopics.length === 0 ? (
            <p className="text-xs text-on-surface-variant">No probe data yet.</p>
          ) : (
            <div className="space-y-2">
              {hardestTopics.map((t, i) => (
                <div key={t.slug} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-red-100 text-red-700' : 'bg-surface-container text-on-surface-variant'}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-xs text-on-surface">{t.slug.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-on-surface-variant">{t.confusion_count} confused</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Open Flags */}
      {openFlags.length > 0 && (
        <div className="bg-surface rounded-xl border border-red-200 p-5">
          <h2 className="text-sm font-semibold text-red-700 mb-4">⚑ Open Flags ({openFlags.length})</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {openFlags.map(flag => (
              <div key={flag.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs font-medium text-on-surface">{flag.reason}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {flag.flag_type} · {new Date(flag.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-surface rounded-xl border border-outline-variant p-4">
      <p className="text-xs text-on-surface-variant mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
