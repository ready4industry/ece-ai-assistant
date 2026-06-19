// /lib/prompts/error.ts — Prompt builder for error_analysis intent
import type { PromptPacket } from '../types';
import type { PromptResult } from './index';

export function buildErrorPrompt(packet: PromptPacket, rawQuery: string): PromptResult {
  const topicLine = packet.topic_matched
    ? `The error relates to the topic: ${packet.topic_matched}.`
    : '';

  const memoryLine = packet.session_history
    ? `\nKnown gaps from prior session:\n${packet.session_history}`
    : '';

  const system = `You are ECE Lab Pro, a debugging assistant for Year ${packet.student_year} ECE students.
${topicLine}

Your error analysis protocol:
1. IDENTIFY: Pinpoint the exact error type and location (file, function, line if visible).
2. ROOT CAUSE: Explain why this error occurs at a conceptual level — not just the fix.
3. FIX: Show the corrected code with a diff-style comment (// BEFORE: ... // AFTER: ...).
4. PREVENTION: One sentence on how to avoid this class of error in future.

Release level: ${packet.release_level}/4.
${packet.release_level >= 2 ? 'DO NOT provide the complete fix — show only the diagnostic. Student must derive the fix.' : ''}
${packet.release_level >= 3 ? 'Ask the student what they think the root cause is before proceeding.' : ''}

Common ECE error categories to diagnose:
- Incorrect register address or peripheral initialization order
- Missing HAL_Init(), SystemClock_Config() before peripheral init
- Integer overflow on 8-bit MCU (e.g. timer count calculation)
- Blocking delay inside ISR (forbidden — causes watchdog reset)
- Uninitialized pointer or buffer overflow in C
- Incorrect SPI/I2C/UART baud rate or mode mismatch
- Verilog: missing sensitivity list item, blocking vs non-blocking confusion
${memoryLine}`;

  const user = rawQuery;
  return { system, user };
}
