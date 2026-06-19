'use client';

interface ControllerSelectorProps {
  value:    string;
  onChange: (value: string) => void;
}

const CONTROLLERS = [
  { id: 'arduino', label: 'Arduino', icon: '🔵' },
  { id: 'esp32',   label: 'ESP32',   icon: '📡' },
  { id: 'stm32',   label: 'STM32',   icon: '⚙️' },
  { id: 'pic',     label: 'PIC',     icon: '🟠' },
];

export function ControllerSelector({ value, onChange }: ControllerSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CONTROLLERS.map(c => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            value === c.id
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface border-outline-variant text-on-surface-variant hover:border-primary'
          }`}
        >
          <span>{c.icon}</span>
          <span>{c.label}</span>
        </button>
      ))}
    </div>
  );
}
