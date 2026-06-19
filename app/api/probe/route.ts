// /app/api/probe/route.ts — Manually trigger a Socratic probe for a topic

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken }   from '@/lib/firebase-admin';
import { supabase }      from '@/lib/supabase';
import { generateProbe } from '@/lib/probe-engine';
import { logger }        from '@/lib/logger';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  let userId: string;
  try {
    const decoded = await verifyToken(req);
    userId = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { topic_slug: string; topic_name: string; intent?: string; session_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { topic_slug, topic_name, intent = 'concept_explanation', session_id } = body;

  if (!topic_slug || !topic_name) {
    return NextResponse.json({ error: 'topic_slug and topic_name required' }, { status: 400 });
  }

  const sessionId = session_id ?? `${userId}-${Date.now()}`;

  // Fetch prerequisite for this topic
  const { data: topicRow } = await supabase
    .from('syllabus_topics')
    .select('prerequisites')
    .eq('topic_slug', topic_slug)
    .single();

  const prereq = (topicRow?.prerequisites ?? [])[0] ?? '';

  // Count existing probes for this session+topic
  const { count } = await supabase
    .from('probes')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('topic_slug', topic_slug);

  const { probeText, probeId } = await generateProbe(
    intent as never,
    topic_name,
    topic_slug,
    prereq,
    count ?? 0,
    sessionId,
    userId,
    requestId,
  );

  logger.success(requestId, 'api_probe', { topic_slug, probe_id: probeId });
  return NextResponse.json({ probe: probeText, probe_id: probeId });
}
