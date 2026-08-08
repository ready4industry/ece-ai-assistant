'use client';

import { useState, useCallback } from 'react';
import { useRouter }            from 'next/navigation';
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
  const router   = useRouter();

  const [year,       setYear]       = useState<1|2|3|4>(1);
  const [controller, setController] = useState('arduino');
  const [mode,       setMode]       = useState<'code'|'error'|'concept'|'verilog'|'project'|'research'>('concept');
  const [query,      setQuery]      = useState('');
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});
  const [allProbeIds, setAllProbeIds] = useState<Record<string, string | null>>({});
  const [loading,    setLoading]    = useState(false);
  const [sessionId]  = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const tabKey = mode === 'code' ? `code:${controller}` : mode;

  const messages       = allMessages[tabKey] ?? [];
  const pendingProbeId = allProbeIds[tabKey] ?? null;

  const appendMessage = (msg: Message) =>
    setAllMessages(prev => ({ ...prev, [tabKey]: [...(prev[tabKey] ?? []), msg] }));

  const setPendingProbeId = (id: string | null) =>
    setAllProbeIds(prev => ({ ...prev, [tabKey]: id }));

  const sendQuery = useCallback(async (queryText: string, probeAnswer?: string) => {
    if (loading || !queryText.trim()) return;
    if (!user) {
      router.push('/login');
      return;
    }

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
          role:         'assistant',
          text:         data.probe_question ?? 'Knowledge Check: Please explain your understanding of this concept.',
          isProbe:      true,
          queryId:      data.query_id,
          probeId:      data.probe_id,
          topic:        data.topic,
        });
      } else {
        setPendingProbeId(null);
        appendMessage({
          role:         'assistant',
          text:         data.text || 'No response content returned. Please try again.',
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
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.text ?? query;
    sendQuery(lastUserMsg, answer);
  }

  return (
    <div className="flex flex-col h-screen bg-[#f8faf7] font-sans">
      <Topbar title="AI Assistant Workspace" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 gap-4 max-w-5xl mx-auto w-full">
          {/* Controls Bar */}
          <div className="bg-surface-container-lowest border border-primary/15 shadow-[0px_4px_20px_rgba(0,83,68,0.06)] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-primary/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#41FDA8]" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Engineering Intelligence Hub</span>
              </div>
              <span className="text-[11px] font-mono text-on-surface-variant">Socratic Mode Active</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <YearSelector value={year} onChange={setYear} />
              <div className="w-px h-6 bg-primary/15" />
              <ModeSelector value={mode} onChange={setMode} />
            </div>
            {mode === 'code' && (
              <div className="pt-2 border-t border-primary/10">
                <ControllerSelector value={controller} onChange={setController} />
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 py-12">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-on-primary shadow-md border border-primary/20">
                  <span className="text-3xl font-bold">⚡</span>
                </div>
                <div className="space-y-1 max-w-md">
                  <h2 className="text-xl font-bold text-primary">ECE Lab Pro AI Workspace</h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Ask technical questions on schematics, circuit diagnostics, embedded firmware, Verilog RTL, or literature reviews.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg pt-2">
                  {['ESP32 I2C OLED Init', 'Op-Amp Filter Design', 'Verilog 4-bit ALU', 'STM32 Timer Interrupts'].map((topicText) => (
                    <button
                      key={topicText}
                      onClick={() => { setQuery(topicText); sendQuery(topicText); }}
                      className="text-xs font-mono bg-surface-container-lowest border border-primary/20 hover:border-[#41FDA8] text-primary px-3 py-1.5 rounded-xl transition-all shadow-sm"
                    >
                      {topicText} ➔
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="bg-primary text-on-primary rounded-2xl rounded-tr-sm px-4 py-3 max-w-xl text-sm shadow-sm font-sans">
                    {msg.text}
                  </div>
                ) : (
                  <div className="flex-1 max-w-3xl">
                    <OutputPanel
                      text={msg.text}
                      queryId={msg.queryId}
                      provider={msg.provider}
                      releaseLevel={msg.releaseLevel}
                      topic={msg.topic}
                      probeText={msg.isProbe ? msg.text : null}
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
