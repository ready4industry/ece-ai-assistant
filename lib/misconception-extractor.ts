// /lib/misconception-extractor.ts — B6: Constitutional AI misconception extraction
// Primary: Cerebras gpt-oss-120b (Y1-2) / SambaNova DeepSeek-V3.1 (Y3-4)
// Constitutional check: Groq llama-3.1-8b-instant

import Groq from 'groq-sdk';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import OpenAI from 'openai';
import { MODELS } from './ai-router';
import { supabase } from './supabase';
import { logger, persistError } from './logger';
import type { YearOfStudy } from './types';

interface ExtractionResult {
  misconception:  string | null;
  verified:       boolean;
  critique:       string;
  confidence:     number;
}

export async function extractAndVerifyMisconception(
  probeQuestion:   string,
  studentAnswer:   string,
  topicSlug:       string,
  topicName:       string,
  yearOfStudy:     YearOfStudy,
  userId:          string,
  requestId:       string,
): Promise<ExtractionResult> {
  logger.log({
    request_id: requestId,
    stage:      'misconception_extraction',
    status:     'success',
    details:    { step: 'starting', topic: topicSlug, year: yearOfStudy },
  });

  // ── Step 1: Extract misconception draft ───────────────────────────────────
  const extractionPrompt = `Analyze this student's response to a Socratic probe and identify any misconception.
Topic: ${topicName}
Probe question: "${probeQuestion}"
Student answer: "${studentAnswer}"

If the student has a specific identifiable misconception about this topic, state it in one concise sentence.
If there is no clear misconception (student is genuinely confused, or answer is irrelevant), return "none".
Return ONLY the misconception sentence or "none".`;

  let misconceptionDraft: string | null = null;

  try {
    if (yearOfStudy <= 2) {
      // Y1-2: Cerebras gpt-oss-120b
      const client = new Cerebras({ apiKey: process.env.CEREBRAS_API_KEY! });
      const res = await (client.chat.completions.create as Function)({
        model:       MODELS.cerebras,
        messages:    [{ role: 'user', content: extractionPrompt }],
        max_tokens:  100,
        temperature: 0.1,
      });
      misconceptionDraft = (res as { choices: { message: { content: string } }[] })
        .choices[0]?.message?.content?.trim() ?? null;
    } else {
      // Y3-4: SambaNova DeepSeek-V3.1
      const client = new OpenAI({
        baseURL: 'https://api.sambanova.ai/v1',
        apiKey:  process.env.SAMBANOVA_API_KEY!,
      });
      const res = await client.chat.completions.create({
        model:       MODELS.sn_research,
        messages:    [{ role: 'user', content: extractionPrompt }],
        max_tokens:  100,
        temperature: 0.1,
      });
      misconceptionDraft = res.choices[0]?.message?.content?.trim() ?? null;
    }

    logger.log({
      request_id: requestId,
      stage:      'misconception_extraction',
      status:     'success',
      details:    { step: 'draft_extracted', draft: misconceptionDraft, year: yearOfStudy },
    });
  } catch (err) {
    logger.failure(requestId, 'misconception_extraction', err, { step: 'extraction_failed' });
    return { misconception: null, verified: false, critique: 'extraction_failed', confidence: 0 };
  }

  if (!misconceptionDraft || misconceptionDraft.toLowerCase() === 'none') {
    return { misconception: null, verified: false, critique: 'no_misconception_found', confidence: 0 };
  }

  // ── Step 2: Constitutional AI verification ─────────────────────────────────
  const constitutionalPrompt = `You are a pedagogical fact-checker. Verify whether this claimed student misconception actually matches what the student said.

Probe question: "${probeQuestion}"
Student answer: "${studentAnswer}"
Claimed misconception: "${misconceptionDraft}"

Does this claimed misconception specifically and accurately describe what the student's answer reveals about their misunderstanding?
Answer in this JSON format exactly:
{"matches": true/false, "confidence": 0.0-1.0, "critique": "one sentence explanation"}

Rules:
- "matches" is true ONLY if the misconception is directly supported by the student's words
- "matches" is false if the misconception is a generic guess not grounded in the answer
- confidence < 0.6 means the claim should be rejected`;

  let constitutional: { matches: boolean; confidence: number; critique: string } | null = null;
  let critique = '';
  let confidence = 0;

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
    const res  = await groq.chat.completions.create({
      model:           MODELS.groq_8b,
      messages:        [{ role: 'user', content: constitutionalPrompt }],
      max_tokens:      120,
      temperature:     0,
      response_format: { type: 'json_object' },
    });

    const raw = res.choices[0]?.message?.content ?? '{}';
    constitutional = JSON.parse(raw);
    confidence  = constitutional?.confidence ?? 0;
    critique    = constitutional?.critique    ?? '';

    logger.log({
      request_id: requestId,
      stage:      'constitutional_check',
      status:     'success',
      details: {
        draft:      misconceptionDraft,
        matches:    constitutional?.matches,
        confidence,
        critique,
      },
    });
  } catch (err) {
    logger.failure(requestId, 'constitutional_check', err, { draft: misconceptionDraft });
    await persistError({
      request_id: requestId,
      stage:      'constitutional_check',
      status:     'failure',
      error_msg:  String(err),
    }, { misconceptionDraft });
    return { misconception: null, verified: false, critique: 'constitutional_check_failed', confidence: 0 };
  }

  const passed = constitutional?.matches === true && confidence >= 0.6;

  if (!passed) {
    logger.log({
      request_id: requestId,
      stage:      'constitutional_check',
      status:     'warn',
      details:    { reason: 'discarded_by_constitutional_check', draft: misconceptionDraft, critique },
    });
    return { misconception: null, verified: false, critique, confidence };
  }

  // ── Step 3: Persist to misconception_log ──────────────────────────────────
  const { error: dbErr } = await supabase.from('misconception_log').insert({
    user_id:                 userId || null,
    topic_slug:              topicSlug,
    misconception:           misconceptionDraft,
    verified:                true,
    constitutional_critique: critique,
  });

  if (dbErr) {
    logger.failure(requestId, 'db_write', dbErr, {
      table: 'misconception_log', topic_slug: topicSlug,
    });
  }

  return { misconception: misconceptionDraft, verified: true, critique, confidence };
}
