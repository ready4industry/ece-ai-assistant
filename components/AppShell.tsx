import type { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

/** Shared Stitch portal frame; it deliberately contains no data or authorization logic. */
export function AppShell({ children, title = 'ECE Lab Pro', className = '' }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Topbar title={title} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className={`min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${className}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
