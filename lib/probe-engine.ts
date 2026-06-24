// /lib/probe-engine.ts — implements B1, B2, B3 from Table B Architecture
// Self-Ask probe generation + response classification

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MODELS } from './ai-router';
import { selectProbeTemplate, CONFUSION_PREFIX, DISENGAGE_RESPONSES } from './probe-templates';
import { supabase } from './supabase';
import { logger } from './logger';
import type { IntentType, EngagementState, SessionState, YearOfStudy } from './types';

// ── Shannon entropy for disengagement detection ────────────────────────────
function shannonEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const c of str) freq[c] = (freq[c] || 0) + 1;
  return -Object.values(freq).reduce((s, f) => {
    const p = f / str.length;
    return s + p * Math.log2(p);
  }, 0);
}

// ── B2: Generate probe via Self-Ask (qwen3.6-27b primary) ─────────────────
export async function generateProbe(
  intent:       IntentType,
  topic:        string,
  topicSlug:    string,
  prerequisite: string,
  attemptCount: number,
  sessionId:    string,
  userId:       string,
  requestId:    string,
  imageContext?: boolean,
  dbUserId?:    string | null,
): Promise<{ probeText: string; templateUsed: string | null; probeId: string }> {
  let probeText:    string;
  let templateUsed: string | null = null;

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
    const systemPrompt = `You are a Socratic pedagogy engine for ECE students.
Task: Generate ONE probe question using Self-Ask decomposition.
Break this into: "What single sub-question, if answered correctly, would reveal whether the student understands {{topic}}?"
Constraints:
- Encouraging tone. Never say "do you know" or imply they should already know.
- Use "tell me" framing.
- Maximum 2 sentences.
- Topic: ${topic}
- Intent: ${intent}
- Prerequisite if confusion detected: ${prerequisite || 'none'}
Return only the probe question, no preamble.`;

    const userMsg = `Generate a Socratic probe for: ${intent.replace('_', ' ')} about ${topic}. Attempt #${attemptCount}.`;

    const res = await groq.chat.completions.create({
      model:       MODELS.groq_27b,
      messages:    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
      max_tokens:  100,
      temperature: 0.3,
    });
    const raw = res.choices[0]?.message?.content ?? '';
    // Qwen3 models emit <think>...</think> chain-of-thought before the answer.
    // Two-pass strip:
    // Pass 1 — remove properly closed <think>...</think> blocks.
    // Pass 2 — remove any remaining unclosed <think> block that runs to end of string.
    probeText = raw
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/<think>[\s\S]*/g, '')
      .trim();

    if (!probeText) throw new Error('Empty response from probe generator');
    logger.success(requestId, 'probe_generation', { method: 'groq_qwen27b', topic });
  } catch (err) {
    // Fallback: static template (zero cost)
    probeText    = selectProbeTemplate(intent, topic, prerequisite, attemptCount);
    templateUsed = `${intent}_${attemptCount === 0 ? 'default' : attemptCount === 1 ? 'no_attempt' : 'repeat'}`;
    logger.fallback(requestId, 'probe_generation', 'groq_27b', String(err), 'static_template');
  }

  // Write probe to DB
  const { data: probeRow, error: probeErr } = await supabase
    .from('probes')
    .insert({
      session_id:     sessionId,
      user_id:        dbUserId || null,
      topic_slug:     topicSlug,
      template_used:  templateUsed,
      generated_text: probeText,
      attempt_number: attemptCount,
    })
    .select('id')
    .single();

  if (probeErr || !probeRow) {
    // Log the actual Supabase error message, not the raw object
    const errMsg = probeErr
      ? (typeof probeErr === 'object' && 'message' in probeErr
          ? (probeErr as { message: string }).message
          : JSON.stringify(probeErr))
      : 'null probeRow';
    logger.failure(requestId, 'db_write', new Error(errMsg), {
      table: 'probes', payload: { session_id: sessionId, topic_slug: topicSlug },
    });
    // Return a generated UUID so session.pending_probe_id is non-null.
    // Without this, the probe answer classify path never fires and the
    // engine issues another probe on every reply — infinite loop.
    return { probeText, templateUsed, probeId: crypto.randomUUID() };
  }

  return { probeText, templateUsed, probeId: probeRow.id };
}

// ── B3: Classify probe response ────────────────────────────────────────────
export async function classifyProbeResponse(
  probeId:       string,
  probeQuestion: string,
  studentAnswer: string,
  topic:         string,
  disengageCount: number,
  requestId:     string,
): Promise<{
  state:         EngagementState;
  relevanceScore: number;
  overlapRatio:   number;
  wordCount:      number;
  entropy:        number;
}> {
  const answer  = studentAnswer.trim().toLowerCase();
  const words   = answer.split(/\s+/).filter(Boolean);
  const entropy = shannonEntropy(answer || 'x');

  logger.log({
    request_id: requestId,
    stage:      'probe_classification',
    status:     'success',
    details: {
      word_count: words.length,
      entropy,
      answer_preview: answer.slice(0, 50),
    },
  });

  // Explicit confusion
  const confusionMarkers = [
    'idk', "i don't know", 'i dont know', 'no idea', 'not sure',
    'i have no idea', "i don't understand", 'i dont understand', 'confused', 'no clue',
    "i'm not sure", 'im not sure', 'not really sure', 'have no idea', 'no clue at all',
    "i don't know what", 'i dont know what', "i'm confused", 'im confused',
    'completely lost', 'have no clue', 'not sure what', "don't know how", 'dont know how',
  ];
  if (words.length <= 10 && confusionMarkers.some(m => answer.includes(m))) {
    await writeProbeResponse(probeId, studentAnswer, 'honest_confusion', 0, 0, requestId);
    return { state: 'honest_confusion', relevanceScore: 0, overlapRatio: 0, wordCount: words.length, entropy };
  }

  // Disengagement markers
  const disengageMarkers = ['just give', 'give me the', 'skip', "don't care", 'dont care',
    'whatever', 'just tell me', 'stop asking'];
  if (disengageMarkers.some(m => answer.includes(m))) {
    await writeProbeResponse(probeId, studentAnswer, 'disengaged', 0, 0, requestId);
    return { state: 'disengaged', relevanceScore: 0, overlapRatio: 0, wordCount: words.length, entropy };
  }

  // Empty / noise
  if (words.length === 0 || (entropy > 4.5 && words.length < 3)) {
    const state: EngagementState = disengageCount >= 1 ? 'disengaged' : 'honest_confusion';
    await writeProbeResponse(probeId, studentAnswer, state, 0, 0, requestId);
    return { state, relevanceScore: 0, overlapRatio: 0, wordCount: words.length, entropy };
  }

  // Keyword echo — student reflected question back
  const questionTokens = new Set(probeQuestion.toLowerCase().split(/\s+/));
  const answerTokens   = answer.split(/\s+/);
  const overlapRatio   = answerTokens.filter(t => questionTokens.has(t)).length / Math.max(answerTokens.length, 1);

  if (overlapRatio > 0.7 && words.length < 8) {
    await writeProbeResponse(probeId, studentAnswer, 'surface_answer', 0, overlapRatio, requestId);
    return { state: 'surface_answer', relevanceScore: 0, overlapRatio, wordCount: words.length, entropy };
  }

  // ECE relevance check against topic keywords from Supabase
  const { data: topicData } = await supabase
    .from('syllabus_topics')
    .select('keywords')
    .eq('topic_slug', topic)
    .single();

  const topicKeywords   = new Set<string>((topicData?.keywords ?? []).map((k: string) => k.toLowerCase()));
  const relevanceScore  = answerTokens.filter(t => topicKeywords.has(t)).length;

  // Hedging language signals the student is attempting but uncertain — treat as partial
  const hedgingMarkers = ["i think", "i believe", "maybe", "perhaps", "i guess",
    "probably", "i'm not sure but", 'im not sure but', 'could be', 'might be',
    'i think it', "i'm guessing", 'im guessing'];
  const hasHedging = hedgingMarkers.some(m => answer.includes(m));

  let state: EngagementState;
  if (relevanceScore > 0 || hasHedging) {
    state = words.length >= 5 ? 'partial' : 'surface_answer';
  } else if (relevanceScore === 0 && words.length > 3) {
    state = 'irrelevant_genuine';
    // Groq 8b generates one-sentence acknowledge+redirect for irrelevant_genuine
    await handleIrrelevantGenuine(studentAnswer, topic, requestId);
  } else {
    state = words.length < 4 ? 'surface_answer' : 'partial';
  }

  await writeProbeResponse(probeId, studentAnswer, state, relevanceScore, overlapRatio, requestId);
  return { state, relevanceScore, overlapRatio, wordCount: words.length, entropy };
}

async function handleIrrelevantGenuine(
  answer:    string,
  topic:     string,
  requestId: string,
): Promise<void> {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
    await groq.chat.completions.create({
      model:       MODELS.groq_8b,
      messages: [{
        role:    'user',
        content: `Student answer to ECE probe: "${answer}". Topic: ${topic}. Write ONE encouraging sentence that acknowledges what they said and redirects to the topic. Max 20 words.`,
      }],
      max_tokens:  80,
      temperature: 0.2,
    });
    logger.success(requestId, 'probe_classification', { sub_step: 'irrelevant_redirect_generated' });
  } catch {
    // Non-critical — swallow
  }
}

async function writeProbeResponse(
  probeId:       string,
  answerText:    string,
  classification: EngagementState,
  relevanceScore: number,
  overlapRatio:   number,
  requestId:     string,
): Promise<void> {
  if (!probeId) return;
  const { error } = await supabase.from('probe_responses').insert({
    probe_id:       probeId,
    answer_text:    answerText,
    classification,
    relevance_score: relevanceScore,
    overlap_ratio:   overlapRatio,
    word_count:      answerText.trim().split(/\s+/).filter(Boolean).length,
    entropy_score:   shannonEntropy(answerText || 'x'),
  });
  if (error) {
    logger.failure(requestId, 'db_write', error, {
      table: 'probe_responses', probe_id: probeId,
    });
  }
}

// ── B4: Determine release level (pure rules engine, zero model calls) ──────
export function determineRelease(
  state:          EngagementState,
  releaseLevel:   number,
  disengageCount: number,
): { level: 0 | 1 | 2 | 3 | 4; instruction: string; flag: boolean } {
  switch (state) {
    case 'correct':
      return { level: 0, instruction: 'Full calibrated response. Student demonstrated understanding.', flag: false };
    case 'partial':
      return { level: 0, instruction: 'Acknowledge correct part. Probe the specific gap only.', flag: false };
    case 'honest_confusion':
      return { level: 1, instruction: CONFUSION_PREFIX + 'Drop to prerequisite. Give 3-sentence micro-explanation of foundation concept. Then simpler probe.', flag: false };
    case 'irrelevant_genuine':
      return { level: 0, instruction: 'Acknowledge what student said. Redirect to specific gap.', flag: false };
    case 'surface_answer':
      return {
        level:       Math.min(releaseLevel + 1, 2) as 0 | 1 | 2 | 3 | 4,
        instruction: releaseLevel === 0
          ? 'Concept only response. No code. No direct solution.'
          : 'Pseudocode with deliberate gaps marked as comments.',
        flag: false,
      };
    case 'disengaged': {
      if (disengageCount === 0)
        return { level: releaseLevel as 0|1|2|3|4, instruction: DISENGAGE_RESPONSES[0], flag: false };
      if (disengageCount === 1)
        return { level: 2, instruction: DISENGAGE_RESPONSES[1], flag: false };
      if (disengageCount === 2)
        return { level: 3, instruction: DISENGAGE_RESPONSES[2], flag: true };
      return {
        level:       4,
        instruction: 'Full answer. Append viva question. Log full session. Flag faculty.',
        flag:        true,
      };
    }
  }
}

// ── Engagement score deltas per classification ─────────────────────────────
export const ENGAGEMENT_DELTAS: Record<EngagementState, number> = {
  correct:            +15,
  partial:             +5,
  honest_confusion:     0,
  surface_answer:      -5,
  disengaged:         -15,
  irrelevant_genuine:   0,
};
