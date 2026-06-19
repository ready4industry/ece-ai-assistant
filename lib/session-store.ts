// Redis session helpers — manages SessionState per browser session
// TTL: 7 days (604800 seconds) per Architecture §4.1

import { redis } from './ratelimit';
import type { SessionState, YearOfStudy } from './types';

const SESSION_TTL = 604800; // 7 days in seconds
const sessionKey  = (sid: string) => `ece:session:${sid}`;

export async function loadSession(sessionId: string): Promise<SessionState | null> {
  const raw = await redis.get<SessionState>(sessionKey(sessionId));
  return raw ?? null;
}

export async function createSession(
  sessionId: string,
  userId:    string,
  year:      YearOfStudy,
): Promise<SessionState> {
  const state: SessionState = {
    session_id:       sessionId,
    user_id:          userId,
    year,
    engagement_score: 50,
    probe_count:      0,
    disengage_count:  0,
    release_level:    0,
    pending_probe_id: null,
    knowledge_map:    {},
    last_topic_slug:  null,
    last_activity:    Date.now(),
  };
  await redis.set(sessionKey(sessionId), state, { ex: SESSION_TTL });
  return state;
}

export async function updateSession(
  sessionId: string,
  updates:   Partial<SessionState>,
): Promise<void> {
  const existing = await loadSession(sessionId);
  if (!existing) return;
  const updated: SessionState = {
    ...existing,
    ...updates,
    last_activity: Date.now(),
  };
  await redis.set(sessionKey(sessionId), updated, { ex: SESSION_TTL });
}

// Update engagement score as rolling average
export async function updateEngagementScore(
  sessionId: string,
  delta:     number, // +15 correct, +5 partial, 0 confusion, -5 surface, -15 disengaged
): Promise<number> {
  const session = await loadSession(sessionId);
  if (!session) return 50;

  const newScore = Math.max(0, Math.min(100,
    session.probe_count === 0
      ? 50 + delta
      : (session.engagement_score * session.probe_count + 50 + delta) / (session.probe_count + 1)
  ));

  await updateSession(sessionId, {
    engagement_score: newScore,
    probe_count:      session.probe_count + 1,
  });
  return newScore;
}

// Update knowledge map for Reflexion pattern
export async function updateKnowledgeMap(
  sessionId:     string,
  topicSlug:     string,
  state:         'gap' | 'partial' | 'correct',
): Promise<void> {
  const session = await loadSession(sessionId);
  if (!session) return;
  await updateSession(sessionId, {
    knowledge_map: { ...session.knowledge_map, [topicSlug]: state },
  });
}

export async function getKnowledgeMapContext(sessionId: string): Promise<string> {
  const session = await loadSession(sessionId);
  if (!session || Object.keys(session.knowledge_map).length === 0) return '';

  const entries = Object.entries(session.knowledge_map);
  const gaps    = entries.filter(([, v]) => v === 'gap').map(([k]) => k);
  const partial = entries.filter(([, v]) => v === 'partial').map(([k]) => k);
  const correct = entries.filter(([, v]) => v === 'correct').map(([k]) => k);

  const parts: string[] = [];
  if (gaps.length)    parts.push(`Topics this student struggles with: ${gaps.join(', ')}`);
  if (partial.length) parts.push(`Partial understanding of: ${partial.join(', ')}`);
  if (correct.length) parts.push(`Demonstrated understanding of: ${correct.join(', ')}`);

  return parts.length ? `\n[Session context — Reflexion memory]\n${parts.join('\n')}\n` : '';
}
