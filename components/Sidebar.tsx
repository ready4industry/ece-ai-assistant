'use client';

import Link       from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/assistant', label: 'Assistant',  icon: '💬' },
  { href: '/scanner',   label: 'Scanner',    icon: '📷' },
  { href: '/project',   label: 'Project',    icon: '🔧' },
  { href: '/research',  label: 'Research',   icon: '📚' },
  { href: '/history',   label: 'History',    icon: '🕐' },
  { href: '/progress',  label: 'Progress',   icon: '📈' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-16 sm:w-56 bg-surface-container h-full flex flex-col py-4 gap-1">
      {NAV_ITEMS.map(item => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-secondary-container text-on-secondary-container font-medium'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="hidden sm:block">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
