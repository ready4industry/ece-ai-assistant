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
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Ask an ECE question... (Shift+Enter for new line)'}
        rows={3}
        disabled={loading}
        className="w-full resize-none rounded-xl border border-outline-variant bg-surface-container px-4 py-3 pr-14 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 transition-shadow"
      />
      <button
        onClick={onSubmit}
        disabled={loading || !value.trim()}
        className="absolute bottom-3 right-3 w-9 h-9 bg-primary rounded-lg flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4 text-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7 7 7-7 7" />
          </svg>
        )}
      </button>
    </div>
  );
}
