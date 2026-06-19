// /app/api/probe-response/route.ts — Student submits an answer to a Socratic probe

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken }          from '@/lib/firebase-admin';
import { supabase }             from '@/lib/supabase';
import { classifyProbeResponse, determineRelease, ENGAGEMENT_DELTAS } from '@/lib/probe-engine';
import { updateEngagementScore, updateSession, updateKnowledgeMap } from '@/lib/session-store';
import { logger }               from '@/lib/logger';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  let userId: string;
  try {
    const decoded = await verifyToken(req);
    userId = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { probe_id: string; answer: string; session_id: string; topic_slug?: string; disengage_count?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { probe_id, answer, session_id, topic_slug = '', disengage_count = 0 } = body;

  if (!probe_id || !answer || !session_id) {
    return NextResponse.json({ error: 'probe_id, answer, session_id required' }, { status: 400 });
  }

  // Fetch probe question text for classification
  const { data: probeRow } = await supabase
    .from('probes')
    .select('generated_text')
    .eq('id', probe_id)
    .single();

  const probeQuestion = probeRow?.generated_text ?? '';

  const classification = await classifyProbeResponse(
    probe_id,
    probeQuestion,
    answer,
    topic_slug,
    disengage_count,
    requestId,
  );

  const engagementDelta = ENGAGEMENT_DELTAS[classification.state];
  const newScore        = await updateEngagementScore(session_id, engagementDelta);

  const releaseInfo = determineRelease(classification.state, 0, disengage_count);

  await updateSession(session_id, {
    pending_probe_id: null,
    release_level:    releaseInfo.level,
    disengage_count:  classification.state === 'disengaged' ? disengage_count + 1 : 0,
  });

  if (topic_slug) {
    const mapValue =
      classification.state === 'correct'  ? 'correct' :
      classification.state === 'partial'  ? 'partial' : 'gap';
    await updateKnowledgeMap(session_id, topic_slug, mapValue);
  }

  logger.success(requestId, 'api_probe_response', {
    probe_id,
    classification: classification.state,
    engagement_delta: engagementDelta,
    new_score: newScore,
  });

  return NextResponse.json({
    classification:    classification.state,
    engagement_score:  newScore,
    engagement_delta:  engagementDelta,
    release_level:     releaseInfo.level,
    release_instruction: releaseInfo.instruction,
    flag:              releaseInfo.flag,
  });
}
