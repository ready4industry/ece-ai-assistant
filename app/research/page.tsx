'use client';

import { useState }     from 'react';
import { Topbar }       from '@/components/Topbar';
import { Sidebar }      from '@/components/Sidebar';
import { YearSelector } from '@/components/YearSelector';
import { QueryInput }   from '@/components/QueryInput';
import { OutputPanel }  from '@/components/OutputPanel';
import { useAuth }      from '@/components/AuthProvider';

interface Message { role: 'user' | 'assistant'; text: string; queryId?: string | null; provider?: string; }

export default function ResearchPage() {
  const { user } = useAuth();
  const [year, setYear] = useState<1|2|3|4>(4);
  const [query, setQuery]     = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionId = `res-${Date.now()}`;

  async function send() {
    if (!user || !query.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res   = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ query, mode: 'research', year, session_id: sessionId }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.text ?? data.error, queryId: data.query_id, provider: data.provider }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Network error' }]);
    } finally {
      setLoading(false);
      setQuery('');
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#f8faf7] font-sans">
      <Topbar title="Academic Research Assistant" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 gap-4 max-w-5xl mx-auto w-full">
          {/* Header Bar */}
          <div className="bg-surface-container-lowest border border-primary/15 p-4 rounded-2xl shadow-[0px_4px_20px_rgba(0,83,68,0.06)] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#41FDA8] shadow-[0_0_10px_#41FDA8]" />
              <div>
                <h1 className="text-lg font-bold text-primary">Academic Research & Literature Intelligence</h1>
                <p className="text-xs text-on-surface-variant">IEEE citation formatting, paper synthesis, and research methodology</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-semibold text-secondary bg-surface-container-low px-3 py-1 rounded-xl border border-primary/10">Year Level:</span>
              <YearSelector value={year} onChange={setYear} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 py-12">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-on-primary shadow-md border border-primary/20">
                  <span className="text-3xl font-bold">📚</span>
                </div>
                <div className="space-y-1 max-w-md">
                  <h2 className="text-xl font-bold text-primary">Academic Engineering Precision</h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Search research topics, summarize paper abstracts, formulate IEEE literature reviews, or draft thesis methodologies.
                  </p>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'user'
                  ? <div className="bg-primary text-on-primary rounded-2xl rounded-tr-sm px-4 py-3 max-w-xl text-sm shadow-sm font-sans">{m.text}</div>
                  : <div className="flex-1 max-w-3xl"><OutputPanel text={m.text} queryId={m.queryId} provider={m.provider} /></div>}
              </div>
            ))}
          </div>
          <QueryInput value={query} onChange={setQuery} onSubmit={send} loading={loading} placeholder="Ask about research papers, methodology, IEEE citations, or thesis drafting..." />
        </main>
      </div>
    </div>
  );
}

