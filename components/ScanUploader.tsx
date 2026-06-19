'use client';

import { useState, useRef } from 'react';
import { useAuth }          from './AuthProvider';

interface ScanUploaderProps {
  year:      1 | 2 | 3 | 4;
  sessionId: string;
  onResult:  (analysis: string, imageUrl: string, scanId: string | null) => void;
  onError:   (msg: string) => void;
}

export function ScanUploader({ year, sessionId, onResult, onError }: ScanUploaderProps) {
  const { user }            = useAuth();
  const inputRef            = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [query, setQuery]   = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!inputRef.current?.files?.[0] || !user) return;

    setLoading(true);
    try {
      const token  = await user.getIdToken();
      const form   = new FormData();
      form.append('image',      inputRef.current.files[0]);
      form.append('query',      query);
      form.append('year',       String(year));
      form.append('session_id', sessionId);

      const res  = await fetch('/api/scan', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    form,
      });
      const data = await res.json();

      if (!res.ok) {
        onError(data.error ?? 'Scan failed');
      } else {
        onResult(data.analysis, data.image_url, data.scan_id);
      }
    } catch {
      onError('Network error during scan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) { handleFile(file); if (inputRef.current) { const dt = new DataTransfer(); dt.items.add(file); inputRef.current.files = dt.files; } }
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/50'
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-contain" />
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
              <span className="text-2xl">📷</span>
            </div>
            <p className="text-sm text-on-surface-variant text-center">
              Drop a circuit diagram or oscilloscope screenshot<br />
              <span className="text-xs">JPEG, PNG, WebP up to 5 MB</span>
            </p>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Optional: What do you want to know about this circuit?"
        className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />

      <button
        onClick={handleSubmit}
        disabled={!preview || loading}
        className="w-full py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
      >
        {loading ? 'Analyzing...' : 'Analyze Circuit'}
      </button>
    </div>
  );
}
