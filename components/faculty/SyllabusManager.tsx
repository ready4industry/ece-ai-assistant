'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { SYLLABUS } from '@/lib/syllabus-data';

type TopicStatus = 'not_seeded' | 'seeded';

interface TopicRow {
  slug:       string;
  topic:      string;
  year:       number;
  subject:    string;
  complexity: number;
  co_po:      string[];
  status:     TopicStatus;
}

export function SyllabusManager() {
  const { user }    = useAuth();
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [seeding,    setSeeding]    = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [search,     setSearch]     = useState('');

  const topics: TopicRow[] = SYLLABUS
    .filter(t => !yearFilter || t.year === yearFilter)
    .filter(t =>
      !search ||
      t.topic.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
    )
    .map(t => ({
      slug:       t.topic_slug,
      topic:      t.topic,
      year:       t.year,
      subject:    t.subject_label,
      complexity: t.complexity,
      co_po:      t.co_po_mapping ?? [],
      status:     'not_seeded',
    }));

  async function handleSeedAll() {
    if (!user) return;
    setSeeding(true);
    setSeedResult(null);
    try {
      const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '';
      const res   = await fetch('/api/admin/seed-syllabus', {
        method:  'POST',
        headers: { 'x-admin-secret': adminSecret },
      });
      const data  = await res.json();
      setSeedResult(`Seeded ${data.success}/${data.total} topics. Skipped: ${data.skipped}. Failed: ${data.failed}.`);
    } catch {
      setSeedResult('Seeding failed — check admin secret and Gemini API key.');
    } finally {
      setSeeding(false);
    }
  }

  const COMPLEXITY_COLORS: Record<number, string> = {
    1: 'bg-green-100 text-green-700', 2: 'bg-green-100 text-green-700',
    3: 'bg-blue-100 text-blue-700',   4: 'bg-blue-100 text-blue-700',
    5: 'bg-yellow-100 text-yellow-700', 6: 'bg-yellow-100 text-yellow-700',
    7: 'bg-orange-100 text-orange-700', 8: 'bg-orange-100 text-orange-700',
    9: 'bg-red-100 text-red-700',    10: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-on-surface">Syllabus Manager — 62 Topics</h2>
        <button
          onClick={handleSeedAll}
          disabled={seeding}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          {seeding ? 'Seeding embeddings…' : 'Seed All Embeddings'}
        </button>
      </div>

      {seedResult && (
        <div className="bg-surface-container rounded-lg px-4 py-2.5 text-sm text-on-surface">{seedResult}</div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search topics…"
          className="flex-1 min-w-48 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-1">
          <button
            onClick={() => setYearFilter(null)}
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${!yearFilter ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant hover:bg-surface-container'}`}
          >
            All
          </button>
          {[1, 2, 3, 4].map(y => (
            <button
              key={y}
              onClick={() => setYearFilter(yearFilter === y ? null : y)}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${yearFilter === y ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant hover:bg-surface-container'}`}
            >
              Y{y}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-on-surface-variant">{topics.length} topics</p>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Topic</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Subject</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-on-surface-variant">Year</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-on-surface-variant">Complexity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">CO-PO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {topics.map(t => (
                <tr key={t.slug} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-on-surface">{t.topic}</p>
                    <p className="text-xs text-on-surface-variant font-mono">{t.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">{t.subject}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium inline-flex items-center justify-center">
                      {t.year}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COMPLEXITY_COLORS[t.complexity] ?? ''}`}>
                      {t.complexity}/10
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {t.co_po.map(cp => (
                        <span key={cp} className="text-xs px-1.5 py-0.5 bg-surface-container rounded text-on-surface-variant">
                          {cp}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
