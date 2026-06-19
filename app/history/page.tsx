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
    <div className="flex flex-col h-screen bg-background">
      <Topbar title="History" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4">
          <h1 className="text-lg font-semibold text-on-surface">Query History</h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : queries.length === 0 ? (
            <p className="text-sm text-on-surface-variant py-8 text-center">No history yet. Ask your first question!</p>
          ) : (
            <div className="space-y-2">
              {queries.map(q => (
                <div key={q.id} className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-container transition-colors"
                  >
                    <span className="text-base">{MODE_ICONS[q.mode] ?? '💬'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface truncate">{q.query_text}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {q.provider} · {new Date(q.created_at).toLocaleDateString()}
                        {q.rating && ` · ${'★'.repeat(q.rating)}`}
                      </p>
                    </div>
                    <span className={`text-xs transition-transform ${expanded === q.id ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {expanded === q.id && (
                    <div className="px-4 pb-4 border-t border-outline-variant">
                      <p className="text-xs text-on-surface-variant mt-3 mb-1 font-medium">Response:</p>
                      <p className="text-sm text-on-surface whitespace-pre-wrap line-clamp-10">{q.response_text}</p>
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
                className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm disabled:opacity-40 hover:bg-surface-container transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-on-surface-variant">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm disabled:opacity-40 hover:bg-surface-container transition-colors"
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
