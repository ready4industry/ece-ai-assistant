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
    <div className="flex flex-col h-screen bg-[#f8faf7] font-sans">
      <Topbar title="Circuit Scanner" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest border border-primary/15 p-5 rounded-2xl shadow-[0px_4px_20px_rgba(0,83,68,0.06)]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#41FDA8]" />
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Visual Diagnostics & Schematic OCR</p>
              </div>
              <h1 className="text-2xl font-bold text-on-surface">Circuit Scanner AI</h1>
            </div>
            <YearSelector value={year} onChange={setYear} />
          </div>

          <div className="bg-surface-container-lowest border border-primary/15 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,83,68,0.08)]">
            <ScanUploader
              year={year}
              sessionId={sessionId}
              onResult={(a, url, id) => { setAnalysis(a); setImageUrl(url); setScanId(id); setError(''); }}
              onError={msg => setError(msg)}
            />
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container rounded-xl px-4 py-3 text-sm font-medium border border-error/20">{error}</div>
          )}

          {analysis && (
            <div className="space-y-4">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="Uploaded circuit" className="max-h-72 rounded-2xl object-contain border border-primary/20 bg-surface-container-low shadow-sm" />
              )}
              <OutputPanel
                text={analysis}
                queryId={null}
                provider="gemini-vision"
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

