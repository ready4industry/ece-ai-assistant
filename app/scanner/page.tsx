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
      <Topbar title="Circuit Scanner & Visual Inspector" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest border border-primary/15 p-5 rounded-3xl shadow-[0px_4px_20px_rgba(0,83,68,0.06)]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#41FDA8] shadow-[0_0_8px_#41FDA8]" />
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Visual Diagnostics & Optical Inspector</p>
              </div>
              <h1 className="text-2xl font-bold text-primary">Circuit Scanner AI</h1>
              <p className="text-xs text-on-surface-variant mt-0.5">AI-assisted visual inspection, component recognition, and fault detection.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-semibold text-secondary bg-surface-container-low px-3 py-1 rounded-xl border border-primary/10">Year Level:</span>
              <YearSelector value={year} onChange={setYear} />
            </div>
          </div>

          {/* Stitch Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Upload & Live Scan Preview */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="bg-surface-container-lowest border border-primary/15 rounded-3xl p-6 shadow-[0px_4px_20px_rgba(0,83,68,0.08)]">
                <ScanUploader
                  year={year}
                  sessionId={sessionId}
                  onResult={(a, url, id) => { setAnalysis(a); setImageUrl(url); setScanId(id); setError(''); }}
                  onError={msg => setError(msg)}
                />
              </div>

              {/* Live Preview Panel with Bounding Box Overlay Simulation */}
              <div className="bg-surface-container-lowest border border-primary/15 rounded-3xl overflow-hidden shadow-[0px_4px_20px_rgba(0,83,68,0.08)] flex flex-col">
                <div className="px-5 py-3 border-b border-primary/15 bg-surface-container-low flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Live Diagnostic Preview</span>
                  </div>
                  <span className="bg-[#E0F7F2] text-[#005344] font-mono text-xs font-bold px-3 py-1 rounded-full border border-primary/10">
                    {imageUrl ? 'Analysis Active' : 'Standby Mode'}
                  </span>
                </div>
                <div className="relative min-h-[300px] bg-[#d8dbd8] flex items-center justify-center overflow-hidden p-4">
                  {imageUrl ? (
                    <div className="relative w-full h-full max-h-80 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="Uploaded circuit" className="max-h-80 w-full object-contain rounded-2xl border border-primary/20 shadow-md" />
                      {/* Bounding Box Highlights */}
                      <div className="absolute top-[20%] left-[25%] w-[30%] h-[40%] border-2 border-[#41FDA8] bg-[#41FDA8]/10 rounded-lg shadow-[0_0_12px_#41FDA8] pointer-events-none">
                        <span className="absolute -top-6 left-0 bg-[#41FDA8] text-[#005344] font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                          COMPONENT_OK
                        </span>
                      </div>
                      <div className="absolute bottom-[20%] right-[25%] w-[25%] h-[30%] border-2 border-[#ba1a1a] bg-[#ba1a1a]/15 rounded-lg shadow-[0_0_12px_#ba1a1a] pointer-events-none">
                        <span className="absolute -top-6 left-0 bg-[#ba1a1a] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                          FAULT_DETECTED
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
                        📷
                      </div>
                      <p className="text-xs text-on-surface-variant max-w-xs">
                        Upload a breadboard photo or circuit schematic above to trigger real-time AI optical component detection.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Diagnostic Report & Component Cards */}
            <div className="lg:col-span-5 flex flex-col bg-surface-container-lowest border border-primary/15 rounded-3xl p-6 shadow-[0px_4px_20px_rgba(0,83,68,0.08)] space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-primary/15">
                <span className="text-xl">📊</span>
                <h2 className="text-base font-bold text-primary">Diagnostic Report</h2>
              </div>

              {/* Detected Component Badges */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider block">Detected Components</span>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#E0F7F2] text-[#005344] font-mono text-xs px-3 py-1 rounded-xl border border-primary/10 font-medium">STM32 / ESP32 MCU</span>
                  <span className="bg-[#E0F7F2] text-[#005344] font-mono text-xs px-3 py-1 rounded-xl border border-primary/10 font-medium">LED Array</span>
                  <span className="bg-[#E0F7F2] text-[#005344] font-mono text-xs px-3 py-1 rounded-xl border border-primary/10 font-medium">220Ω Resistor</span>
                  <span className="bg-surface-container-high text-on-surface-variant font-mono text-xs px-3 py-1 rounded-xl border border-primary/10 font-medium">Jumper Wires</span>
                </div>
              </div>

              {/* System Analysis Box */}
              <div className="bg-surface-container-low rounded-2xl p-4 border border-primary/10 space-y-1">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">System Inspection</span>
                <p className="text-xs text-on-surface leading-relaxed">
                  Optical AI scanner evaluates wire topology, pin orientations, and passive component tolerances.
                </p>
              </div>

              {/* Error Warning Toast Banner */}
              {error && (
                <div className="bg-error-container/20 text-on-error-container rounded-2xl p-4 border-l-4 border-error border border-error/20 text-xs font-medium space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-error">
                    <span>⚠️</span>
                    <span>Likely Issue Detected</span>
                  </span>
                  <p className="text-on-surface font-semibold">{error}</p>
                </div>
              )}

              {/* Analysis Output Result */}
              {analysis ? (
                <OutputPanel
                  text={analysis}
                  queryId={null}
                  provider="gemini-vision"
                />
              ) : (
                <div className="bg-[#005344] text-white rounded-2xl p-5 shadow-inner space-y-3">
                  <div className="flex items-center gap-2 text-[#41FDA8] font-bold text-xs uppercase tracking-wider">
                    <span>🛠️</span>
                    <span>Suggested Inspection Protocol</span>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed">
                    Upload your circuit image on the left. The Gemini Vision model will cross-check your connections against standard ECE pinouts and flag potential shorts, reversed polarity, or floating pins.
                  </p>
                  <div className="bg-[#002f26] text-[#41FDA8] font-mono text-xs p-3 rounded-xl border border-[#41FDA8]/20">
                    <code>// Ready for optical analysis</code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


