// /lib/dynamic-router.ts — Allocation decision matrix
// Determines which AI provider to use based on intent, year, and content type.
// This is a pure lookup table — no side effects, no async.

import type { IntentType, YearOfStudy, AIProvider } from './types';

interface AllocationDecision {
  primary:   AIProvider;
  fallbacks: AIProvider[];
  max_tokens: number;
  reason:    string;
}

export function getAllocation(
  intent:    IntentType,
  year:      YearOfStudy,
  contextLength: number,   // total prompt characters
  hasImage:  boolean,
): AllocationDecision {
  // Image analysis always routes to Gemini Vision
  if (hasImage) {
    return {
      primary:    'gemini_p',
      fallbacks:  ['gemini_f'],
      max_tokens: 1500,
      reason:     'image_analysis_requires_vision_model',
    };
  }

  // Research queries → SambaNova DeepSeek for deep synthesis
  if (intent === 'research_help') {
    return {
      primary:    'sn_research',
      fallbacks:  ['groq_70b', 'gemini_p'],
      max_tokens: 3000,
      reason:     'research_synthesis_high_quality_primary',
    };
  }

  // Code generation for Y3-4 → higher-quality models
  if (intent === 'code_request' && year >= 3) {
    return {
      primary:    'groq_70b',
      fallbacks:  ['cerebras', 'gemini_f'],
      max_tokens: 2500,
      reason:     'y3_y4_code_requires_larger_model',
    };
  }

  // Code for Y1-2 → Cerebras is fast and sufficient
  if (intent === 'code_request') {
    return {
      primary:    'cerebras',
      fallbacks:  ['groq_70b', 'groq_27b'],
      max_tokens: 1500,
      reason:     'y1_y2_code_cerebras_sufficient',
    };
  }

  // Verilog review → always use 70b or better
  if (intent === 'verilog_review') {
    return {
      primary:    'groq_70b',
      fallbacks:  ['sn_research', 'gemini_p'],
      max_tokens: 2000,
      reason:     'verilog_rtl_requires_strong_reasoning',
    };
  }

  // Error analysis → Groq 70b fast and accurate
  if (intent === 'error_analysis') {
    return {
      primary:    'groq_70b',
      fallbacks:  ['cerebras', 'gemini_f'],
      max_tokens: 1500,
      reason:     'error_analysis_groq_70b_primary',
    };
  }

  // Project and design → Gemini 2.5 Pro for planning depth
  if (intent === 'project_help' || intent === 'design_request') {
    return {
      primary:    'gemini_p',
      fallbacks:  ['groq_70b', 'sn_research'],
      max_tokens: 3000,
      reason:     'project_planning_gemini_25_pro',
    };
  }

  // Long context (>6000 chars) — skip Cerebras (context window limit)
  if (contextLength > 6000) {
    return {
      primary:    'groq_70b',
      fallbacks:  ['gemini_f', 'sn_verilog'],
      max_tokens: 2000,
      reason:     'long_context_cerebras_skipped',
    };
  }

  // Y3-4 concept/derivation → 70b
  if (year >= 3 && (intent === 'derivation' || intent === 'concept_explanation')) {
    return {
      primary:    'groq_70b',
      fallbacks:  ['cerebras', 'gemini_f'],
      max_tokens: 2000,
      reason:     'y3_y4_concept_groq_70b',
    };
  }

  // Y1-2 concept/definition → Cerebras (fast, cheap)
  return {
    primary:    'cerebras',
    fallbacks:  ['groq_70b', 'groq_27b'],
    max_tokens: 1000,
    reason:     'default_y1_y2_concept_cerebras',
  };
}
