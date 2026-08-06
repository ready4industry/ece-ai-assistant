'use client';

import { useRef } from 'react';

interface QueryInputProps {
  value:       string;
  onChange:    (v: string) => void;
  onSubmit:    () => void;
  loading:     boolean;
  placeholder?: string;
}

export function QueryInput({ value, onChange, onSubmit, loading, placeholder }: QueryInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && value.trim()) onSubmit();
    }
  }

  return (
    <div className="relative bg-surface-container-lowest border border-primary/20 rounded-2xl shadow-sm focus-within:border-[#41FDA8] focus-within:ring-2 focus-within:ring-[#41FDA8]/30 transition-all p-2">
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Ask about schematics, code, circuits, or syllabus concepts...'}
        rows={2}
        disabled={loading}
        className="w-full bg-transparent border-none resize-none px-3 py-2 text-sm text-on-surface placeholder:text-outline outline-none disabled:opacity-60 font-sans"
      />
      <div className="flex items-center justify-between px-2 pt-1 border-t border-primary/10">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] font-bold">Shift+Enter for newline</span>
        </div>
        <button
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          className="bg-[#41FDA8] hover:bg-[#20e990] text-[#003a2f] w-9 h-9 flex items-center justify-center rounded-xl font-bold transition-all disabled:opacity-40 disabled:hover:bg-[#41FDA8] shadow-sm shrink-0"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-[#003a2f] border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-base leading-none">➔</span>
          )}
        </button>
      </div>
    </div>
  );
}

