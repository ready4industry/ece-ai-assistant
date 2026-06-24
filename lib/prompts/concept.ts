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

  // Acknowledgement block — tells the AI exactly how to open the response
  // based on what the student said to the Socratic probe.
  const acknowledgementInstruction = packet.probe_answer
    ? (() => {
        const q = packet.probe_answer_quality;
        if (q === 'correct') {
          return `\nSTUDENT PROBE RESPONSE HANDLING (CRITICAL — follow this first):
The student has demonstrated correct understanding in their probe answer.
Open your response by specifically affirming what they said (quote or closely paraphrase their words).
Then extend to the next level of the concept — don't just repeat what they already know.`;
        }
        if (q === 'partial' || q === 'surface') {
          return `\nSTUDENT PROBE RESPONSE HANDLING (CRITICAL — follow this first):
The student gave a partial answer to your probe question.
Open your response by:
1. Specifically acknowledging what they got RIGHT (name it explicitly, e.g. "You're right that a diode is involved").
2. Gently identifying the specific gap (e.g. "The part about how it blocks current is where we need to go deeper").
3. Then explain ONLY that gap — do not re-explain what they already demonstrated they know.
Do NOT open with a generic introduction to the topic. Start with their answer.`;
        }
        // honest_confusion or none
        return `\nSTUDENT PROBE RESPONSE HANDLING (CRITICAL — follow this first):
The student indicated they are not sure or don't know.
Open your response by validating this warmly (e.g. "That's completely fine — this one trips up a lot of students").
Then start from the most fundamental prerequisite concept and build up step by step.
Keep sentences short. Use an analogy before any formula.`;
      })()
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
${acknowledgementInstruction}${misconceptionNote}${memoryLine}`;

  const user = packet.probe_answer
    ? `Student's prior attempt: "${packet.probe_answer}"\n\nStudent's question: ${rawQuery}`
    : rawQuery;

  return { system, user };
}
