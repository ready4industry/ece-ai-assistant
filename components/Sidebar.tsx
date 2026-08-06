'use client';

import Link       from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/assistant', label: 'Assistant',  icon: '💬', badge: 'AI' },
  { href: '/scanner',   label: 'Scanner',    icon: '📷' },
  { href: '/project',   label: 'Project',    icon: '🔧' },
  { href: '/research',  label: 'Research',   icon: '📚' },
  { href: '/history',   label: 'History',    icon: '🕐' },
  { href: '/progress',  label: 'Progress',   icon: '📈' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-16 sm:w-60 bg-surface-container-low border-r border-primary/15 h-full flex flex-col justify-between p-3 select-none shrink-0">
      <div className="flex flex-col gap-1.5">
        <div className="px-3 py-2 hidden sm:block mb-2">
          <span className="text-[11px] font-bold text-primary/70 uppercase tracking-widest">Workspace Navigation</span>
        </div>
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-primary text-on-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="hidden sm:inline text-xs sm:text-sm">{item.label}</span>
              </div>
              {active ? (
                <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-[#41FDA8] shadow-[0_0_8px_#41FDA8]" />
              ) : item.badge ? (
                <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Stitch Footer Badge */}
      <div className="hidden sm:flex flex-col gap-1 p-3 rounded-xl bg-surface-container-lowest border border-primary/10 text-xs">
        <div className="flex items-center justify-between font-semibold text-primary">
          <span>ECE Lab Pro</span>
          <span className="w-2 h-2 rounded-full bg-[#41FDA8] animate-pulse" />
        </div>
        <span className="text-[11px] text-on-surface-variant">Socratic AI Model v2.4</span>
      </div>
    </nav>
  );
}

