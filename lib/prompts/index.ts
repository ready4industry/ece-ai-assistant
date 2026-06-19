// /lib/prompts/index.ts — GapFix Gap 06: single dispatcher for all prompt builders
// Routes based on body.mode to the correct typed prompt function.

import type { PromptPacket } from '../types';
import { buildCodePrompt }     from './code';
import { buildErrorPrompt }    from './error';
import { buildConceptPrompt }  from './concept';
import { buildScanPrompt }     from './scan';
import { buildVerilogPrompt }  from './verilog';
import { buildProjectPrompt }  from './project';
import { buildResearchPrompt } from './research';

export type PromptMode =
  | 'code'
  | 'error'
  | 'concept'
  | 'scan'
  | 'verilog'
  | 'project'
  | 'research';

export interface PromptResult {
  system: string;
  user:   string;
}

export function getPrompt(mode: PromptMode, packet: PromptPacket, rawQuery: string): PromptResult {
  switch (mode) {
    case 'code':     return buildCodePrompt(packet, rawQuery);
    case 'error':    return buildErrorPrompt(packet, rawQuery);
    case 'concept':  return buildConceptPrompt(packet, rawQuery);
    case 'scan':     return buildScanPrompt(packet, rawQuery);
    case 'verilog':  return buildVerilogPrompt(packet, rawQuery);
    case 'project':  return buildProjectPrompt(packet, rawQuery);
    case 'research': return buildResearchPrompt(packet, rawQuery);
    default: {
      const exhaustiveCheck: never = mode;
      return buildConceptPrompt(packet, rawQuery);
    }
  }
}
