// /lib/remedial-engine.ts — B13: Tree of Thoughts remedial plan generation
// 3 parallel branches via Groq gpt-oss-120b → Gemini 2.5-pro synthesis

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MODELS } from './ai-router';
import { supabase } from './supabase';
import { logger } from './logger';

interface RemedialBranch {
  strategy:    string;
  description: string;
  steps:       string[];
  timeline:    string;
}

interface RemedialPlan {
  student_id:      string;
  strategy_used:   string;
  weeks:           number;
  branches_tried:  RemedialBranch[];
  final_plan:      {
    week1: string[];
    week2: string[];
    week3: string[];
  };
  rationale:       string;
  ai_generated:    true;
  professor_editable: true;
}

export async function generateRemedialPlan(
  userId:          string,
  topicSlugs:      string[],
  misconceptions:  string[],
  progressionData: Record<string, number>,
  requestId:       string,
): Promise<RemedialPlan> {
  logger.log({
    request_id: requestId,
    stage:      'remedial_engine',
    status:     'success',
    details:    { step: 'starting', topic_count: topicSlugs.length, student_id: userId },
  });

  // Fetch prerequisite graph for weak topics
  const { data: topicRows } = await supabase
    .from('syllabus_topics')
    .select('topic, topic_slug, prerequisites, complexity')
    .in('topic_slug', topicSlugs);

  const topicContext = (topicRows ?? []).map(t =>
    `${t.topic} (complexity ${t.complexity}, prerequisites: ${(t.prerequisites ?? []).join(', ') || 'none'})`
  ).join('\n');

  const studentContext = `Student ID: ${userId}
Weak topics:
${topicContext}

Identified misconceptions:
${misconceptions.map(m => `- ${m}`).join('\n')}

Progression scores (0-100, where negative delta = regression):
${Object.entries(progressionData).map(([t, s]) => `${t}: ${s}`).join('\n')}`;

  // ── Branch prompts (Tree of Thoughts — 3 parallel) ─────────────────────
  const branchPrompts = [
    {
      strategy:    'fix_immediate_topic',
      systemMsg:   'You are an ECE remediation specialist. Design a 3-week plan that directly addresses the student\'s weakest topic first, building up through exercises.',
      constraint:  'Focus on the weakest topic directly. Provide specific exercises and resources.',
    },
    {
      strategy:    'fix_root_prerequisite',
      systemMsg:   'You are an ECE remediation specialist. Design a 3-week plan that identifies and fixes the root prerequisite gap causing the student\'s current struggles.',
      constraint:  'Start from the prerequisite chain. Identify which fundamental concept, when fixed, unblocks the most other topics.',
    },
    {
      strategy:    'fix_via_worked_examples',
      systemMsg:   'You are an ECE remediation specialist. Design a 3-week plan using progressively complex worked examples to build intuition before theory.',
      constraint:  'Lead with worked examples. Theory comes after the student sees patterns.',
    },
  ];

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const branches: RemedialBranch[] = [];

  // Run all 3 branches in parallel
  const branchResults = await Promise.allSettled(
    branchPrompts.map(async ({ strategy, systemMsg, constraint }) => {
      const res = await groq.chat.completions.create({
        model:       MODELS.groq_120b,
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user',   content: `Student context:\n${studentContext}\n\nConstraint: ${constraint}\n\nReturn a JSON object with fields: strategy, description, steps (array of 6 items), timeline.` },
        ],
        max_tokens:      500,
        temperature:     0.4,
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}');
      return { ...parsed, strategy } as RemedialBranch;
    })
  );

  for (const result of branchResults) {
    if (result.status === 'fulfilled') {
      branches.push(result.value);
      logger.log({
        request_id: requestId,
        stage:      'remedial_engine',
        status:     'success',
        details:    { step: 'branch_generated', strategy: result.value.strategy },
      });
    } else {
      logger.failure(requestId, 'remedial_engine', result.reason, { step: 'branch_failed' });
    }
  }

  if (branches.length === 0) {
    throw new Error('All remedial plan branches failed to generate');
  }

  // ── Synthesis: Gemini 2.5-pro evaluates branches against prerequisite graph ─
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const gemini = genAI.getGenerativeModel({
    model: MODELS.gemini_f, // gemini-2.5-flash as synthesis model
    generationConfig: { temperature: 0.2 },
  });

  const synthesisPrompt = `You are synthesizing three remediation strategies for an ECE student.
Evaluate each strategy against the prerequisite graph and select the best approach, then synthesize a final 3-week plan.

Student context:
${studentContext}

Three branches generated:
${branches.map((b, i) => `Branch ${i + 1} (${b.strategy}):\n${JSON.stringify(b, null, 2)}`).join('\n\n')}

Task:
1. Evaluate each branch — which is weakest for THIS specific student? Why?
2. Synthesize the best elements from all 3 into a final plan.
3. Return JSON with fields: week1 (array of 3 tasks), week2 (array of 3 tasks), week3 (array of 3 tasks), rationale (2 sentences).`;

  let finalPlan: RemedialPlan['final_plan'] = {
    week1: ['Review prerequisite concepts', 'Complete practice problems', 'Attempt original topic again'],
    week2: ['Deepen understanding with worked examples', 'Peer discussion', 'Timed exercise'],
    week3: ['Application to lab context', 'Self-assessment quiz', 'Verify with professor'],
  };
  let rationale = 'AI-generated plan based on misconception history and prerequisite analysis.';

  try {
    const result = await gemini.generateContent(synthesisPrompt);
    const text   = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      finalPlan = { week1: parsed.week1 ?? finalPlan.week1, week2: parsed.week2 ?? finalPlan.week2, week3: parsed.week3 ?? finalPlan.week3 };
      rationale = parsed.rationale ?? rationale;
    }
    logger.success(requestId, 'remedial_engine', { step: 'synthesis_complete' });
  } catch (err) {
    logger.failure(requestId, 'remedial_engine', err, { step: 'synthesis_failed_using_best_branch' });
    // Use best branch as fallback
    if (branches[0]?.steps?.length >= 6) {
      finalPlan = {
        week1: branches[0].steps.slice(0, 2),
        week2: branches[0].steps.slice(2, 4),
        week3: branches[0].steps.slice(4, 6),
      };
    }
  }

  const plan: RemedialPlan = {
    student_id:         userId,
    strategy_used:      branches.map(b => b.strategy).join('+'),
    weeks:              3,
    branches_tried:     branches,
    final_plan:         finalPlan,
    rationale,
    ai_generated:       true,
    professor_editable: true,
  };

  // Persist to remedial_plans
  const { error: dbErr } = await supabase.from('remedial_plans').insert({
    user_id:       userId,
    plan_json:     plan,
    strategy_used: plan.strategy_used,
  });

  if (dbErr) {
    logger.failure(requestId, 'db_write', dbErr, { table: 'remedial_plans', user_id: userId });
  } else {
    logger.success(requestId, 'db_write', { table: 'remedial_plans', user_id: userId });
  }

  return plan;
}
