'use client';

import { useState }         from 'react';
import { Topbar }           from '@/components/Topbar';
import { Sidebar }          from '@/components/Sidebar';
import { ScanUploader }     from '@/components/ScanUploader';
import { OutputPanel }      from '@/components/OutputPanel';
import { YearSelector }     from '@/components/YearSelector';

export default function ScannerPage() {
  const [year,     setYear]    = useState<1|2|3|4>(1);
  const [analysis, setAnalysis] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [scanId,   setScanId]  = useState<string | null>(null);
  const [error,    setError]   = useState('');

  const sessionId = `scan-${Date.now()}`;

  return (
    <div className="flex flex-col h-screen bg-background">
      <Topbar title="Circuit Scanner" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-on-surface">Circuit & Waveform Scanner</h1>
            <YearSelector value={year} onChange={setYear} />
          </div>

          <div className="bg-surface rounded-xl border border-outline-variant p-6">
            <ScanUploader
              year={year}
              sessionId={sessionId}
              onResult={(a, url, id) => { setAnalysis(a); setImageUrl(url); setScanId(id); setError(''); }}
              onError={msg => setError(msg)}
            />
          </div>

          {error && (
            <div className="bg-error/10 text-error rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          {analysis && (
            <div className="space-y-4">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="Uploaded circuit" className="max-h-64 rounded-xl object-contain border border-outline-variant" />
              )}
              <OutputPanel
                text={analysis}
                queryId={null}
                provider="gemini"
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
