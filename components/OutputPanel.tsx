'use client';

import ReactMarkdown                from 'react-markdown';
import { StarRating }               from './StarRating';
import { useState }                 from 'react';
import { useAuth }                  from './AuthProvider';

interface OutputPanelProps {
  text:          string;
  queryId?:      string | null;
  provider?:     string;
  releaseLevel?: number;
  topic?:        string | null;
  probeText?:    string | null;
  onProbeAnswer?: (answer: string) => void;
}

export function OutputPanel({
  text, queryId, provider, releaseLevel, topic, probeText, onProbeAnswer,
}: OutputPanelProps) {
  const { user }       = useAuth();
  const [rated, setRated] = useState(false);
  const [probeInput, setProbeInput] = useState('');

  async function handleRate(stars: number) {
    if (!queryId || !user) return;
    const token = await user.getIdToken();
    await fetch('/api/rate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ query_id: queryId, rating: stars }),
    });
    setRated(true);
  }

  if (probeText) {
    return (
      <div className="bg-[#f0f9f6] border border-[#41FDA8]/40 rounded-xl p-5 shadow-[0px_4px_20px_rgba(0,83,68,0.06)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#41FDA8]" />
        <div className="flex items-center gap-2 mb-2 pl-2">
          <span className="text-base">🧠</span>
          <h4 className="text-sm font-bold text-[#005344] uppercase tracking-wide">Knowledge Check · Socratic Probe</h4>
        </div>
        <p className="text-sm text-on-surface mb-4 pl-2 font-medium leading-relaxed">{probeText}</p>
        <div className="flex gap-2 pl-2">
          <input
            type="text"
            value={probeInput}
            onChange={e => setProbeInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && probeInput.trim() && onProbeAnswer) {
                onProbeAnswer(probeInput.trim());
                setProbeInput('');
              }
            }}
            placeholder="Type your response here..."
            className="flex-1 rounded-xl border border-primary/20 bg-surface-container-lowest px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#41FDA8] focus:ring-2 focus:ring-[#41FDA8]/30 transition-all font-mono"
          />
          <button
            onClick={() => {
              if (probeInput.trim() && onProbeAnswer) {
                onProbeAnswer(probeInput.trim());
                setProbeInput('');
              }
            }}
            className="px-5 py-2.5 bg-[#41FDA8] hover:bg-[#20e990] text-[#003a2f] font-bold rounded-xl text-sm transition-all shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <span>Submit</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    );
  }

  if (!text) return null;

  return (
    <div className="bg-surface-container-lowest border border-primary/15 shadow-[0px_4px_20px_rgba(0,83,68,0.08)] rounded-2xl rounded-tl-sm p-5 space-y-4">
      {releaseLevel !== undefined && releaseLevel > 0 && (
        <div className="flex items-center gap-2 pb-1 border-b border-primary/10">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#41FDA8]/20 text-[#005344] font-bold tracking-wide">
            Guided Mode (Level {releaseLevel})
          </span>
          {topic && <span className="text-xs text-on-surface-variant font-mono">Topic: {topic}</span>}
        </div>
      )}

      <div className="prose prose-sm max-w-none text-on-surface leading-relaxed">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-primary/10 pt-3">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-[#41FDA8]" />
          <span>{provider ? `Model: ${provider}` : 'ECE AI Engine'}</span>
        </div>
        {queryId && !rated && (
          <StarRating onRate={handleRate} />
        )}
        {rated && (
          <span className="text-xs font-semibold text-primary">Rating saved ✓</span>
        )}
      </div>
    </div>
  );
}

