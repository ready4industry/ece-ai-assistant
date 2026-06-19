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
      <div className="rounded-xl border border-secondary-container bg-surface-container-low p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-secondary-container" />
          <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">Socratic Probe</span>
        </div>
        <p className="text-sm text-on-surface mb-4">{probeText}</p>
        <div className="flex gap-2">
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
            placeholder="Your answer..."
            className="flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => {
              if (probeInput.trim() && onProbeAnswer) {
                onProbeAnswer(probeInput.trim());
                setProbeInput('');
              }
            }}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm"
          >
            Reply
          </button>
        </div>
      </div>
    );
  }

  if (!text) return null;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-5">
      {releaseLevel !== undefined && releaseLevel > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-tertiary/20 text-tertiary font-medium">
            Guided Mode (Level {releaseLevel})
          </span>
          {topic && <span className="text-xs text-on-surface-variant">Topic: {topic}</span>}
        </div>
      )}

      <div className="prose prose-sm prose-invert max-w-none text-on-surface">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-outline-variant pt-3">
        <span className="text-xs text-on-surface-variant">
          {provider && `via ${provider}`}
        </span>
        {queryId && !rated && (
          <StarRating onRate={handleRate} />
        )}
        {rated && (
          <span className="text-xs text-secondary-container">Rating saved ✓</span>
        )}
      </div>
    </div>
  );
}
