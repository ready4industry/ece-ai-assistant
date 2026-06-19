'use client';

import { useState }     from 'react';
import { Topbar }       from '@/components/Topbar';
import { Sidebar }      from '@/components/Sidebar';
import { YearSelector } from '@/components/YearSelector';
import { QueryInput }   from '@/components/QueryInput';
import { OutputPanel }  from '@/components/OutputPanel';
import { useAuth }      from '@/components/AuthProvider';

interface Message { role: 'user' | 'assistant'; text: string; queryId?: string | null; provider?: string; }

export default function ProjectPage() {
  const { user }   = useAuth();
  const [year, setYear] = useState<1|2|3|4>(4);
  const [query, setQuery]     = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionId = `proj-${Date.now()}`;

  async function send() {
    if (!user || !query.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res   = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ query, mode: 'project', year, session_id: sessionId }),
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
    <div className="flex flex-col h-screen bg-background">
      <Topbar title="Project Advisor" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden p-4 gap-4 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-4 bg-surface rounded-xl p-3 border border-outline-variant">
            <span className="text-sm text-on-surface-variant">Year:</span>
            <YearSelector value={year} onChange={setYear} />
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'user'
                  ? <div className="bg-primary text-on-primary rounded-2xl px-4 py-2.5 max-w-lg text-sm">{m.text}</div>
                  : <div className="flex-1 max-w-2xl"><OutputPanel text={m.text} queryId={m.queryId} provider={m.provider} /></div>}
              </div>
            ))}
          </div>
          <QueryInput value={query} onChange={setQuery} onSubmit={send} loading={loading} placeholder="Describe your project idea or ask for design guidance..." />
        </main>
      </div>
    </div>
  );
}
