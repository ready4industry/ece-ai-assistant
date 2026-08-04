'use client';

import { useState, useCallback } from 'react';
import { Topbar }              from '@/components/Topbar';
import { Sidebar }             from '@/components/Sidebar';
import { ControllerSelector }  from '@/components/ControllerSelector';
import { YearSelector }        from '@/components/YearSelector';
import { ModeSelector }        from '@/components/ModeSelector';
import { QueryInput }          from '@/components/QueryInput';
import { OutputPanel }         from '@/components/OutputPanel';
import { useAuth }             from '@/components/AuthProvider';

interface Message {
  role:          'user' | 'assistant';
  text:          string;
  queryId?:      string | null;
  provider?:     string;
  releaseLevel?: number;
  topic?:        string | null;
  isProbe?:      boolean;
  probeId?:      string | null;
}

export default function AssistantPage() {
  const { user } = useAuth();

  const [year,       setYear]       = useState<1|2|3|4>(1);
  const [controller, setController] = useState('arduino');
  const [mode,       setMode]       = useState<'code'|'error'|'concept'|'verilog'|'project'|'research'>('concept');
  const [query,      setQuery]      = useState('');
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [sessionId]  = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [pendingProbeId, setPendingProbeId] = useState<string | null>(null);

  const appendMessage = (msg: Message) => setMessages(prev => [...prev, msg]);

  const sendQuery = useCallback(async (queryText: string, probeAnswer?: string) => {
    if (!user || loading || !queryText.trim()) return;

    setLoading(true);
    appendMessage({ role: 'user', text: probeAnswer ? `[Probe answer] ${probeAnswer}` : queryText });

    try {
      const token   = await user.getIdToken();
      const subject = controller;

      const res  = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          query:      queryText,
          mode,
          year,
          subject,
          session_id: sessionId,
          probe_answer: probeAnswer ?? null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        appendMessage({ role: 'assistant', text: `Error: ${data.error ?? 'Unknown error'}` });
        return;
      }

      if (data.type === 'probe') {
        setPendingProbeId(data.probe_id ?? null);
        appendMessage({
          role: 'assistant', text: data.probe ?? '', isProbe: true,
          queryId: data.query_id, probeId: data.probe_id,
        });
      } else {
        setPendingProbeId(null);
        appendMessage({
          role:         'assistant',
          text:         data.text,
          queryId:      data.query_id,
          provider:     data.provider,
          releaseLevel: data.release_level,
          topic:        data.topic,
        });
      }
    } catch {
      appendMessage({ role: 'assistant', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
      setQuery('');
    }
  }, [user, loading, mode, year, controller, sessionId]);

  function handleProbeAnswer(answer: string) {
    sendQuery((query || (messages.find(m => m.role === 'user')?.text ?? '')), answer);
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden p-4 gap-4 max-w-4xl mx-auto w-full">
          {/* Controls */}
          <div className="flex flex-col gap-3 bg-surface rounded-xl p-4 border border-outline-variant">
            <div className="flex items-center gap-4 flex-wrap">
              <YearSelector value={year} onChange={setYear} />
              <div className="w-px h-6 bg-outline-variant" />
              <ModeSelector value={mode} onChange={setMode} />
            </div>
            {mode === 'code' && (
              <ControllerSelector value={controller} onChange={setController} />
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">⚡</span>
                </div>
                <h2 className="text-lg font-medium text-on-surface">ECE Lab Pro</h2>
                <p className="text-sm text-on-surface-variant max-w-xs">
                  Ask about circuits, code, signals, embedded systems, or anything in your ECE syllabus.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="bg-primary text-on-primary rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-lg text-sm">
                    {msg.text}
                  </div>
                ) : (
                  <div className="flex-1 max-w-2xl">
                    <OutputPanel
                      text={msg.text}
                      queryId={msg.queryId}
                      provider={msg.provider}
                      releaseLevel={msg.releaseLevel}
                      topic={msg.topic}
                      probeText={msg.isProbe ? (msg.text || null) : null}
                      onProbeAnswer={msg.isProbe ? handleProbeAnswer : undefined}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <QueryInput
            value={query}
            onChange={setQuery}
            onSubmit={() => sendQuery(query)}
            loading={loading}
          />
        </main>
      </div>
    </div>
  );
}
