'use client';

import { useState } from 'react';
import { useAuth }  from '@/components/AuthProvider';
import { SYLLABUS } from '@/lib/syllabus-data';

export function ProbeStudio() {
  const { user }           = useAuth();
  const [topicSlug, setTopicSlug] = useState('');
  const [intent,    setIntent]    = useState('concept_explanation');
  const [probe,     setProbe]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const selectedTopic = SYLLABUS.find(t => t.topic_slug === topicSlug);

  async function generateProbe() {
    if (!user || !topicSlug) return;
    setLoading(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res   = await fetch('/api/probe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          topic_slug:  topicSlug,
          topic_name:  selectedTopic?.topic ?? topicSlug,
          intent,
          session_id: `faculty-probe-studio-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed'); return; }
      setProbe(data.probe);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  const INTENT_OPTIONS = [
    { id: 'concept_explanation', label: 'Concept Explanation' },
    { id: 'code_request',        label: 'Code Request' },
    { id: 'error_analysis',      label: 'Error Analysis' },
    { id: 'verilog_review',      label: 'Verilog Review' },
    { id: 'derivation',          label: 'Derivation' },
    { id: 'design_request',      label: 'Design Request' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-base font-semibold text-on-surface">Probe Studio</h2>
      <p className="text-sm text-on-surface-variant">
        Generate Socratic probe questions for any syllabus topic. Use these in class or review AI-generated ones.
      </p>

      <div className="bg-surface rounded-xl border border-outline-variant p-5 space-y-4">
        {/* Topic selector */}
        <div>
          <label className="text-xs font-medium text-on-surface-variant mb-1.5 block">Select Topic</label>
          <select
            value={topicSlug}
            onChange={e => setTopicSlug(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">— choose a topic —</option>
            {[1, 2, 3, 4].map(y => (
              <optgroup key={y} label={`Year ${y}`}>
                {SYLLABUS.filter(t => t.year === y).map(t => (
                  <option key={t.topic_slug} value={t.topic_slug}>
                    {t.topic} (complexity {t.complexity}/10)
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Intent selector */}
        <div>
          <label className="text-xs font-medium text-on-surface-variant mb-1.5 block">Query Intent</label>
          <div className="flex flex-wrap gap-2">
            {INTENT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setIntent(opt.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  intent === opt.id
                    ? 'bg-primary text-on-primary border-primary'
                    : 'border-outline-variant text-on-surface-variant hover:border-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {selectedTopic && (
          <div className="bg-surface-container-low rounded-lg p-3 text-xs text-on-surface-variant">
            <p><span className="font-medium">Prerequisites:</span> {selectedTopic.prerequisites.join(', ') || 'None'}</p>
            <p className="mt-1"><span className="font-medium">CO-PO:</span> {(selectedTopic.co_po_mapping ?? []).join(', ')}</p>
          </div>
        )}

        <button
          onClick={generateProbe}
          disabled={!topicSlug || loading}
          className="w-full py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          {loading ? 'Generating probe…' : 'Generate Socratic Probe'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {probe && (
        <div className="bg-surface rounded-xl border border-secondary-container p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">Generated Probe</span>
            <button
              onClick={() => navigator.clipboard.writeText(probe)}
              className="text-xs text-primary hover:underline"
            >
              Copy
            </button>
          </div>
          <p className="text-sm text-on-surface">{probe}</p>
        </div>
      )}
    </div>
  );
}
