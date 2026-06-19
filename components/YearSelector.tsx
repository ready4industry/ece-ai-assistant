'use client';

interface YearSelectorProps {
  value:    1 | 2 | 3 | 4;
  onChange: (value: 1 | 2 | 3 | 4) => void;
}

export function YearSelector({ value, onChange }: YearSelectorProps) {
  return (
    <div className="flex gap-1">
      {([1, 2, 3, 4] as const).map(y => (
        <button
          key={y}
          onClick={() => onChange(y)}
          className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
            value === y
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container text-on-surface-variant hover:bg-primary/10'
          }`}
        >
          Y{y}
        </button>
      ))}
    </div>
  );
}
