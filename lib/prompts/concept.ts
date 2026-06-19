// /lib/prompts/concept.ts — Prompt builder for concept_explanation, definition, derivation
import type { PromptPacket } from '../types';
import type { PromptResult } from './index';

const COGNITIVE_OP_INSTRUCTIONS: Record<string, string> = {
  recall:         'Give a direct, concise definition with one concrete example.',
  classification: 'Explain what category this concept belongs to and contrast it with closely related concepts.',
  application:    'Explain the concept and show how it applies to a real ECE scenario.',
  analysis:       'Break down the concept into its components. Explain each, then show how they interact.',
  synthesis:      'Explain how this concept combines with others to form a larger system. Use a design example.',
  evaluation:     'Compare trade-offs. When would you use this over alternatives? What are the failure modes?',
};

export function buildConceptPrompt(packet: PromptPacket, rawQuery: string): PromptResult {
  const cogInstruction = COGNITIVE_OP_INSTRUCTIONS[packet.cognitive_op] ?? COGNITIVE_OP_INSTRUCTIONS.recall;
  const prereqLine     = packet.prerequisites.length > 0
    ? `Prerequisite concepts: ${packet.prerequisites.join(', ')}.`
    : '';

  const confusionPrefix = packet.probe_answer_quality === 'none' && !packet.probe_answer
    ? 'No problem — let\'s build up from here. '
    : '';

  const misconceptionNote = packet.misconceptions.length > 0
    ? `\nKnown misconceptions this student holds about this topic:\n${packet.misconceptions.map(m => `- ${m}`).join('\n')}\nAddress these directly without making the student feel singled out.`
    : '';

  const memoryLine = packet.session_history
    ? `\nStudent knowledge map:\n${packet.session_history}`
    : '';

  const system = `${confusionPrefix}You are ECE Lab Pro, a concept tutor for Year ${packet.student_year} engineering students.
${packet.topic_matched ? `Topic: ${packet.topic_matched} (complexity ${packet.complexity_score}/10).` : ''}
${prereqLine}

Cognitive operation required: ${packet.cognitive_op.toUpperCase()}.
Instruction: ${cogInstruction}

Rules:
- Use SI units consistently. Never mix imperial.
- Use subscript notation for variables where possible: V_in, I_out, R_eq
- Diagrams: describe them clearly in text using ASCII boxes or arrow notation if needed
- For derivations: show every step, including the algebraic manipulation
- Year 1-2 students: avoid complex math notation, prefer intuition and analogies
- Year 3-4 students: prefer rigorous mathematical treatment
- Release level ${packet.release_level}/4: ${packet.release_level >= 2 ? 'Explain concept but withhold complete solution — ask guiding question at end.' : 'Full explanation appropriate.'}
${misconceptionNote}${memoryLine}`;

  const user = packet.probe_answer
    ? `Student's prior attempt: "${packet.probe_answer}"\n\nStudent's question: ${rawQuery}`
    : rawQuery;

  return { system, user };
}
