'use client';

import { useState, useEffect, useCallback } from 'react';
import { Topbar }    from '@/components/Topbar';
import { Sidebar }   from '@/components/Sidebar';
import { useAuth }   from '@/components/AuthProvider';

interface QueryRow {
  id: string;
  query_text: string;
  response_text: string;
  mode: string;
  subject: string;
  provider: string;
  tokens_used: number;
  rating: number | null;
  release_level: number;
  created_at: string;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [queries, setQueries]   = useState<QueryRow[]>([]);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchHistory = useCallback(async (p: number) => {
    if (!user) return;
    setLoading(true);
    const token = await user.getIdToken();
    const res   = await fetch(`/api/history?page=${p}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data  = await res.json();
    setQueries(data.queries ?? []);
    setTotalPages(data.pages ?? 1);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchHistory(page); }, [fetchHistory, page]);

  const MODE_ICONS: Record<string, string> = {
    code: '💻', error: '🔴', concept: '💡', verilog: '🔷', project: '🔧', research: '📚', scan: '📷',
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8faf7] font-sans">
      <Topbar title="Activity History" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-5">
          <div className="bg-surface-container-lowest border border-primary/15 p-5 rounded-2xl shadow-[0px_4px_20px_rgba(0,83,68,0.06)] flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#41FDA8]" />
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Engineering Activity Ledger</p>
              </div>
              <h1 className="text-2xl font-bold text-on-surface">Query & Session History</h1>
            </div>
            <span className="text-xs font-mono bg-surface-container-low px-3 py-1 rounded-xl border border-primary/10 text-secondary">
              Page {page} of {totalPages}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : queries.length === 0 ? (
            <div className="bg-surface-container-lowest border border-primary/15 rounded-2xl p-8 text-center text-on-surface-variant text-sm shadow-sm">
              No history recorded yet. Ask your first question in the AI Assistant Workspace!
            </div>
          ) : (
            <div className="space-y-3">
              {queries.map(q => (
                <div key={q.id} className="bg-surface-container-lowest border border-primary/15 rounded-2xl overflow-hidden shadow-[0px_4px_20px_rgba(0,83,68,0.04)] transition-all hover:border-primary/30">
                  <button
                    onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface-container-low/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg shrink-0">
                      {MODE_ICONS[q.mode] ?? '💬'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{q.query_text}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                        <span className="font-mono bg-primary/5 px-2 py-0.5 rounded text-[11px] text-primary">{q.mode}</span>
                        <span>{q.provider}</span>
                        <span>•</span>
                        <span>{new Date(q.created_at).toLocaleDateString()}</span>
                        {q.rating && <span className="text-amber-600 font-bold">{ '★'.repeat(q.rating) }</span>}
                      </div>
                    </div>
                    <span className={`text-xs text-primary transition-transform duration-200 ${expanded === q.id ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {expanded === q.id && (
                    <div className="px-5 pb-5 pt-2 border-t border-primary/10 bg-surface-container-low/30">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-2">Response:</span>
                      <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed font-sans">{q.response_text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-primary/20 text-sm font-semibold disabled:opacity-40 hover:bg-surface-container-low transition-colors text-primary"
              >
                Previous
              </button>
              <span className="text-xs font-mono text-on-surface-variant font-semibold">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-primary/20 text-sm font-semibold disabled:opacity-40 hover:bg-surface-container-low transition-colors text-primary"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

