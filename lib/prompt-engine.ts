// /lib/prompt-engine.ts — The 4-layer orchestrator
// L1: Signal validation (zero tokens)
// L2: Intent classification (embedding → Groq 8b fallback)
// L3: Socratic engine (pure TypeScript + Redis)
// L4: PromptPacket assembly

import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { MODELS } from './ai-router';
import { supabase } from './supabase';
import { loadSession, createSession, getKnowledgeMapContext } from './session-store';
import { generateProbe, determineRelease, classifyProbeResponse, ENGAGEMENT_DELTAS } from './probe-engine';
import { updateEngagementScore, updateSession, updateKnowledgeMap } from './session-store';
import { containsECEKeyword } from './keywords';
import { logger } from './logger';
import type {
  YearOfStudy, IntentType, CognitiveOp, PromptPacket, SessionState,
} from './types';

// ── Shannon entropy ──────────────────────────────────────────────────────────
function shannonEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const c of str) freq[c] = (freq[c] || 0) + 1;
  return -Object.values(freq).reduce((s, f) => {
    const p = f / str.length; return s + p * Math.log2(p);
  }, 0);
}

// ── L1: Signal Validator ─────────────────────────────────────────────────────
interface SignalResult {
  valid:   boolean;
  reason:  'too_short' | 'pure_noise' | 'continuation' | 'valid';
  nudge?:  string;
}

function validateSignal(raw: string): SignalResult {
  const stripped = raw.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const words    = stripped.split(/\s+/).filter(Boolean);

  if (words.length < 2 && stripped.length < 10) {
    return { valid: false, reason: 'too_short',
      nudge: 'Tell me a bit more — what are you trying to understand or build?' };
  }

  const entropy = shannonEntropy(stripped);
  if (entropy > 4.5 && words.length < 3) {
    return { valid: false, reason: 'pure_noise',
      nudge: 'I did not quite catch that. What topic or concept are you working on?' };
  }

  const continuations = ['yes', 'ok', 'okay', 'got it', 'thanks', 'understood', 'alright'];
  if (words.length <= 2 && continuations.includes(words[0]?.toLowerCase())) {
    return { valid: true, reason: 'continuation' };
  }

  return { valid: true, reason: 'valid' };
}

// ── L2: Intent Classifier ────────────────────────────────────────────────────
const INTENT_PATTERNS: Array<[IntentType, RegExp]> = [
  ['code_request',    /\b(write|generate|create|give me|show me code|implement|make me)\b/i],
  ['error_analysis',  /\b(error|undefined|null|failed|not working|bug|crash|exception|warning|segfault)\b/i],
  ['verilog_review',  /\b(verilog|vhdl|fpga|rtl|synthesis|always block|module|wire|reg|synthesize)\b/i],
  ['definition',      /\b(what is|what are|define|explain|meaning of|what does|what do you mean)\b/i],
  ['derivation',      /\b(derive|prove|show that|derivation|formula|equation|mathematically|proof)\b/i],
  ['design_request',  /\b(design|architect|plan|create a system|how would you)\b/i],
  ['image_analysis',  /\b(circuit|waveform|diagram|schematic|uploaded|this image|image)\b/i],
  ['project_help',    /\b(project|final year|semester project|dissertation|capstone)\b/i],
  ['research_help',   /\b(paper|research|literature|reference|cite|journal|ieee|survey)\b/i],
];

interface ClassifyResult {
  intent:     IntentType;
  topicMatch: { topic: string; slug: string; complexity: number; prerequisites: string[] } | null;
  confidence: 'high' | 'medium' | 'low';
  method:     'script' | 'embedding' | 'groq_8b';
}

async function classifyIntent(
  raw:       string,
  year:      YearOfStudy,
  requestId: string,
): Promise<ClassifyResult> {
  // Step A: Script patterns (zero cost)
  for (const [intent, regex] of INTENT_PATTERNS) {
    if (regex.test(raw)) {
      const topicMatch = await lookupTopicByKeyword(raw, year);
      logger.log({ request_id: requestId, stage: 'intent_classification', status: 'success',
        details: { method: 'script', intent, confidence: 'high' } });
      return { intent, topicMatch, confidence: 'high', method: 'script' };
    }
  }

  // Step B: Gemini Embedding 2 similarity search
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const { embedding } = await model.embedContent(raw);

    const { data: matches } = await supabase.rpc('match_topic', {
      query_embedding: embedding.values,
      match_year:      year,
      match_threshold: 0.7,
      match_count:     3,
    });

    if (matches && matches.length > 0) {
      const top      = matches[0];
      const intent   = inferIntentFromTopic(top.topic, raw);
      logger.log({ request_id: requestId, stage: 'intent_classification', status: 'success',
        details: { method: 'embedding', intent, similarity: top.similarity, topic: top.topic } });
      return {
        intent,
        topicMatch: { topic: top.topic, slug: top.topic_slug ?? '', complexity: top.complexity ?? 5, prerequisites: top.prerequisites ?? [] },
        confidence: top.similarity > 0.85 ? 'high' : 'medium',
        method:     'embedding',
      };
    }
  } catch (err) {
    logger.failure(requestId, 'intent_classification', err, { step: 'embedding_failed' });
  }

  // Step C: Groq 8b last resort (~50 tokens)
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
    const res  = await groq.chat.completions.create({
      model:           MODELS.groq_8b,
      messages: [
        { role: 'system', content: `Classify this ECE student prompt. Year: ${year}. Return JSON only with fields: intent, topic, complexity (1-10).` },
        { role: 'user',   content: raw },
      ],
      max_tokens:      80,
      temperature:     0,
      response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}');
    logger.log({ request_id: requestId, stage: 'intent_classification', status: 'success',
      details: { method: 'groq_8b', intent: parsed.intent, confidence: 'low' } });
    return {
      intent:     (parsed.intent as IntentType) ?? 'definition',
      topicMatch: parsed.topic ? { topic: parsed.topic, slug: '', complexity: parsed.complexity ?? 5, prerequisites: [] } : null,
      confidence: 'low',
      method:     'groq_8b',
    };
  } catch (err) {
    logger.failure(requestId, 'intent_classification', err, { step: 'groq_8b_failed' });
  }

  // Last fallback: definition
  return { intent: 'definition', topicMatch: null, confidence: 'low', method: 'groq_8b' };
}

async function lookupTopicByKeyword(
  raw:  string,
  year: YearOfStudy,
): Promise<ClassifyResult['topicMatch']> {
  const lower = raw.toLowerCase();
  const { data } = await supabase
    .from('syllabus_topics')
    .select('topic, topic_slug, complexity, prerequisites, keywords')
    .eq('year', year)
    .limit(20);

  if (!data) return null;
  for (const row of data) {
    if ((row.keywords as string[])?.some(k => lower.includes(k.toLowerCase()))) {
      return { topic: row.topic, slug: row.topic_slug, complexity: row.complexity ?? 5, prerequisites: row.prerequisites ?? [] };
    }
  }
  return null;
}

function inferIntentFromTopic(topic: string, raw: string): IntentType {
  if (/verilog|fpga|rtl/i.test(topic)) return 'verilog_review';
  if (/error|bug|crash/i.test(raw))    return 'error_analysis';
  if (/code|program/i.test(raw))       return 'code_request';
  if (/derive|proof/i.test(raw))       return 'derivation';
  return 'concept_explanation';
}

function mapIntentToCognitiveOp(intent: IntentType, complexity: number): CognitiveOp {
  if (intent === 'definition')               return 'recall';
  if (intent === 'code_request' && complexity <= 4) return 'application';
  if (intent === 'error_analysis')           return 'analysis';
  if (intent === 'derivation')               return 'analysis';
  if (intent === 'design_request')           return 'synthesis';
  if (intent === 'project_help')             return 'synthesis';
  if (intent === 'research_help')            return 'evaluation';
  if (complexity >= 7)                       return 'evaluation';
  if (complexity >= 5)                       return 'application';
  return 'classification';
}

// ── Main orchestrator ────────────────────────────────────────────────────────
export async function buildPromptPacket(
  rawQuery:    string,
  sessionId:   string,
  userId:      string,
  year:        YearOfStudy,
  subject:     string,
  requestId:   string,
  probeAnswer?: string, // if student is answering a pending probe
): Promise<PromptPacket & { signalNudge?: string; probeToShow?: string; probeId?: string }> {
  // ── L1: Signal validation ─────────────────────────────────────────────────
  const signal = validateSignal(rawQuery);
  logger.log({
    request_id: requestId, stage: 'signal_validation', status: signal.valid ? 'success' : 'warn',
    details: { reason: signal.reason, query_length: rawQuery.length },
  });

  if (!signal.valid) {
    return buildMinimalPacket(rawQuery, year, subject, { signalNudge: signal.nudge });
  }

  // ── L2: Session load ──────────────────────────────────────────────────────
  let session = await loadSession(sessionId);
  if (!session) {
    session = await createSession(sessionId, userId, year);
  }

  // ── L3: Intent classification ─────────────────────────────────────────────
  const classification = await classifyIntent(rawQuery, year, requestId);
  const { intent, topicMatch, confidence } = classification;
  const complexity     = topicMatch?.complexity ?? 5;
  const cognitiveOp   = mapIntentToCognitiveOp(intent, complexity);
  const knowledgeCtx  = await getKnowledgeMapContext(sessionId);

  // If student is answering a pending probe
  if (probeAnswer && session.pending_probe_id) {
    const probeClass = await classifyProbeResponse(
      session.pending_probe_id,
      '',
      probeAnswer,
      session.last_topic_slug ?? topicMatch?.slug ?? '',
      session.disengage_count,
      requestId,
    );

    const engagementDelta = ENGAGEMENT_DELTAS[probeClass.state];
    const newScore        = await updateEngagementScore(sessionId, engagementDelta);
    const release         = determineRelease(probeClass.state, session.release_level, session.disengage_count);

    const newDisengageCount = probeClass.state === 'disengaged'
      ? session.disengage_count + 1
      : 0;

    await updateSession(sessionId, {
      pending_probe_id: null,
      release_level:    release.level,
      disengage_count:  newDisengageCount,
    });

    if (topicMatch?.slug) {
      await updateKnowledgeMap(sessionId, topicMatch.slug,
        probeClass.state === 'correct' ? 'correct' :
        probeClass.state === 'partial' ? 'partial' : 'gap'
      );
    }

    return buildFullPacket({
      rawQuery, year, subject, intent, cognitiveOp,
      topicMatch, session, complexity, knowledgeCtx,
      releaseLevel:    release.level,
      releaseInstruction: release.instruction,
      engagementScore: newScore,
    });
  }

  // Socratic probe decision
  const shouldProbe = (
    session.probe_count < 3 &&
    !['acknowledgement', 'follow_up', 'noise'].includes(intent) &&
    complexity >= 3
  );

  if (shouldProbe) {
    const prereq = (topicMatch?.prerequisites ?? [])[0] ?? '';
    const { probeText, probeId } = await generateProbe(
      intent, topicMatch?.topic ?? rawQuery.slice(0, 30),
      topicMatch?.slug ?? '', prereq,
      session.probe_count, sessionId, userId, requestId,
    );

    await updateSession(sessionId, {
      pending_probe_id: probeId || null,
      last_topic_slug:  topicMatch?.slug ?? null,
    });

    return {
      ...buildFullPacket({ rawQuery, year, subject, intent, cognitiveOp, topicMatch, session, complexity, knowledgeCtx, releaseLevel: session.release_level }),
      probe_pending: true,
      probe_template: probeText,
      probeToShow: probeText,
      probeId,
    };
  }

  return buildFullPacket({
    rawQuery, year, subject, intent, cognitiveOp,
    topicMatch, session, complexity, knowledgeCtx,
    releaseLevel: session.release_level,
  });
}

function buildFullPacket(args: {
  rawQuery:            string;
  year:                YearOfStudy;
  subject:             string;
  intent:              IntentType;
  cognitiveOp:         CognitiveOp;
  topicMatch:          ClassifyResult['topicMatch'];
  session:             SessionState;
  complexity:          number;
  knowledgeCtx:        string;
  releaseLevel?:       0|1|2|3|4;
  releaseInstruction?: string;
  engagementScore?:    number;
}): PromptPacket {
  const rl = (args.releaseLevel ?? args.session.release_level) as 0|1|2|3|4;
  return {
    student_year:         args.year,
    subject:              args.subject,
    topic_matched:        args.topicMatch?.topic ?? '',
    topic_slug:           args.topicMatch?.slug ?? '',
    prerequisites:        args.topicMatch?.prerequisites ?? [],
    complexity_score:     args.complexity,
    intent:               args.intent,
    cognitive_op:         args.cognitiveOp,
    has_image:            false,
    has_code_paste:       /```|void |int |float /.test(args.rawQuery),
    has_error_paste:      /error:|exception:|undefined|null/.test(args.rawQuery),
    socratic_stage:       'graduated_release',
    probe_pending:        false,
    probe_template:       null,
    engagement_score:     args.engagementScore ?? args.session.engagement_score,
    release_level:        rl,
    correct_concepts:     [],
    misconceptions:       [],
    prior_attempt:        null,
    probe_answer:         null,
    probe_answer_quality: 'none',
    recommended_model:    'groq_70b',
    fallback_models:      ['cerebras', 'gemini_p'],
    max_tokens:           2000,
    raw_query:            args.rawQuery,
    session_history:      args.knowledgeCtx,
  };
}

function buildMinimalPacket(
  rawQuery: string,
  year:     YearOfStudy,
  subject:  string,
  extra?:   { signalNudge?: string },
): PromptPacket & { signalNudge?: string } {
  return {
    student_year:         year,
    subject,
    topic_matched:        '',
    topic_slug:           '',
    prerequisites:        [],
    complexity_score:     3,
    intent:               'definition',
    cognitive_op:         'recall',
    has_image:            false,
    has_code_paste:       false,
    has_error_paste:      false,
    socratic_stage:       'initial_probe',
    probe_pending:        false,
    probe_template:       extra?.signalNudge ?? null,
    engagement_score:     50,
    release_level:        0,
    correct_concepts:     [],
    misconceptions:       [],
    prior_attempt:        null,
    probe_answer:         null,
    probe_answer_quality: 'none',
    recommended_model:    'groq_8b',
    fallback_models:      ['cerebras', 'gemini_lite'],
    max_tokens:           500,
    raw_query:            rawQuery,
    session_history:      '',
    signalNudge:          extra?.signalNudge,
  };
}
