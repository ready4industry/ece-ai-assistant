// /lib/prompts/code.ts — Prompt builder for code_request intent
import type { PromptPacket } from '../types';
import type { PromptResult } from './index';

const RELEASE_INSTRUCTIONS: Record<0|1|2|3|4, string> = {
  0: 'Provide complete, correct, commented code with explanation of each section.',
  1: 'Provide the code structure with key sections identified, but fill in one critical section as a worked example. Student must complete the rest.',
  2: 'Provide pseudocode with deliberate gaps marked as TODO comments. Do NOT write working code.',
  3: 'Provide only the algorithm in plain English. No code. No pseudocode.',
  4: 'Ask the student to articulate what they would try first before providing any guidance.',
};

export function buildCodePrompt(packet: PromptPacket, rawQuery: string): PromptResult {
  const releaseInstr = RELEASE_INSTRUCTIONS[packet.release_level];
  const topicLine   = packet.topic_matched
    ? `Topic: ${packet.topic_matched} (complexity ${packet.complexity_score}/10).`
    : '';

  const prereqLine = packet.prerequisites.length > 0
    ? `Expected prerequisite knowledge: ${packet.prerequisites.join(', ')}.`
    : '';

  const memoryLine = packet.session_history
    ? `\n\nStudent's knowledge gaps from prior conversation:\n${packet.session_history}`
    : '';

  const system = `You are ECE Lab Pro, an embedded-systems and electronics tutor for Year ${packet.student_year} engineering students.
You support four platforms: Arduino (C/C++), ESP32 (ESP-IDF or Arduino-ESP32), STM32 (HAL/LL or CubeIDE), PIC (XC8/MPLAB).
${topicLine} ${prereqLine}

RELEASE LEVEL ${packet.release_level}/4 — ${releaseInstr}

Formatting rules:
- Code blocks use the correct language tag: \`\`\`c, \`\`\`cpp, \`\`\`python, \`\`\`verilog
- Follow HAL driver names exactly (e.g. HAL_GPIO_WritePin, not digitalWrite)
- Include hardware register references where relevant (e.g. TIMx→ARR)
- Never expose security credentials or hard-code passwords
- If the student is Year 1-2, prefer Arduino/pseudocode; Year 3-4 prefer STM32 HAL or ESP-IDF
${memoryLine}`;

  const user = packet.probe_answer
    ? `The student previously attempted this question and said: "${packet.probe_answer}"\n\nNow they ask: ${rawQuery}`
    : rawQuery;

  return { system, user };
}
