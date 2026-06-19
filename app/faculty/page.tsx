'use client';

import { useState, useEffect, useCallback } from 'react';
import { Topbar }              from '@/components/Topbar';
import { useAuth }             from '@/components/AuthProvider';
import { LiveClassroom }       from '@/components/faculty/LiveClassroom';
import { CohortIntelligence }  from '@/components/faculty/CohortIntelligence';
import { SyllabusManager }     from '@/components/faculty/SyllabusManager';
import { ProbeStudio }         from '@/components/faculty/ProbeStudio';
import { ResearchOutput }      from '@/components/faculty/ResearchOutput';

type Tab = 'live' | 'cohort' | 'syllabus' | 'probe' | 'research';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'live',     label: 'Live Classroom',      icon: '🟢' },
  { id: 'cohort',   label: 'Cohort Intelligence', icon: '📊' },
  { id: 'syllabus', label: 'Syllabus Manager',    icon: '📋' },
  { id: 'probe',    label: 'Probe Studio',        icon: '🔬' },
  { id: 'research', label: 'Research Output',     icon: '📄' },
];

export default function FacultyPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('live');
  const [dashData,  setDashData]  = useState<Record<string, unknown> | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const res   = await fetch('/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 403) { setAuthorized(false); return; }
    setAuthorized(true);
    const data = await res.json();
    setDashData(data);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) fetchDashboard();
  }, [authLoading, user, fetchDashboard]);

  if (authLoading || authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex h-screen flex-col">
        <Topbar title="Faculty Dashboard" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-on-surface">Access Denied</p>
            <p className="text-sm text-on-surface-variant mt-1">This page is for faculty accounts only.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Topbar title="ECE Lab Pro — Faculty Dashboard" />

      {/* Tab bar */}
      <div className="bg-surface border-b border-outline-variant px-4">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'live'     && <LiveClassroom    data={dashData} onRefresh={fetchDashboard} />}
        {activeTab === 'cohort'   && <CohortIntelligence data={dashData} />}
        {activeTab === 'syllabus' && <SyllabusManager  />}
        {activeTab === 'probe'    && <ProbeStudio      />}
        {activeTab === 'research' && <ResearchOutput   data={dashData} />}
      </div>
    </div>
  );
}
