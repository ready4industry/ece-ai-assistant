'use client';

type Mode = 'code' | 'error' | 'concept' | 'verilog' | 'project' | 'research';

interface ModeSelectorProps {
  value:    Mode;
  onChange: (mode: Mode) => void;
}

const MODES: Array<{ id: Mode; label: string; desc: string }> = [
  { id: 'concept',  label: 'Explain',  desc: 'Concepts & theory' },
  { id: 'code',     label: 'Code',     desc: 'Write & review code' },
  { id: 'error',    label: 'Debug',    desc: 'Analyze errors' },
  { id: 'verilog',  label: 'Verilog',  desc: 'RTL & FPGA' },
  { id: 'project',  label: 'Project',  desc: 'Design guidance' },
  { id: 'research', label: 'Research', desc: 'Papers & literature' },
];

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {MODES.map(m => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          title={m.desc}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            value === m.id
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
