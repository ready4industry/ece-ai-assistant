// Professor-approved Socratic probe templates
// Organized by intent type and attempt count (0=default, 1=no_attempt, 2=repeat)
// Tone: encouraging, never condescending. "Tell me" not "do you know".

import type { IntentType } from './types';

export const PROBE_TEMPLATES: Partial<Record<IntentType, Record<string, string>>> = {
  code_request: {
    default:    'Before I write this, tell me — what part of {{topic}} are you unsure about and what have you already tried?',
    no_attempt: 'What is your understanding of how {{topic}} works? Even a rough idea helps me calibrate.',
    repeat:     'Let me ask differently — if this code had a bug, where would you look first?',
  },
  image_analysis: {
    default:    'I can see the image. Before I analyse it, what do you think this {{topic}} is doing and which component are you most uncertain about?',
    no_attempt: 'Looking at this circuit — what components do you recognise and what do you think the output should be?',
    repeat:     'Focus on just one component in the image — what do you think its role is?',
  },
  error_analysis: {
    default:    'Walk me through what you think is causing this error and what you have already tried to fix it.',
    no_attempt: 'What does this error message tell you about where in the code the problem might be?',
    repeat:     'Which line do you think is responsible for this error and why?',
  },
  verilog_review: {
    default:    'Before I review this, tell me — what behaviour are you expecting and where do you think it is going wrong?',
    no_attempt: 'What does this module need to do and what signal are you having trouble with?',
    repeat:     'Focus on the always block — are you using blocking or non-blocking assignments and do you know the difference?',
  },
  definition: {
    default:    'What do you already know about {{topic}}? Even a partial understanding helps me give a better explanation.',
    no_attempt: 'Have you come across {{topic}} in your notes or textbook? What did you take away from it?',
    repeat:     'Let\'s approach this differently — can you tell me what {{topic}} is NOT, based on what you\'ve seen?',
  },
  concept_explanation: {
    default:    'Tell me what you currently understand about {{topic}} — even partial knowledge is a great starting point.',
    no_attempt: 'What comes to mind when you hear "{{topic}}"? Any related terms or concepts you\'ve encountered?',
    repeat:     'Think about where {{topic}} is used in real circuits — what problem do you think it solves?',
  },
  derivation: {
    default:    'Before we derive this, what is your current understanding of {{prerequisite}}? That is where the derivation starts.',
    no_attempt: 'What equation or concept do you think forms the foundation of this derivation?',
    repeat:     'Which of the fundamental laws (KVL, KCL, Ohm\'s law, Maxwell\'s equations) do you think applies here?',
  },
  design_request: {
    default:    'Tell me the constraints you are working with — what must this design achieve and what are your resource limits?',
    no_attempt: 'What is the input and expected output of the system you want to design?',
    repeat:     'What block diagrams or system components have you already thought of for this design?',
  },
  project_help: {
    default:    'Tell me what stage your project is at and where specifically you are stuck.',
    no_attempt: 'What is the goal of your project and what approach were you planning to take?',
    repeat:     'Break it down for me — which single component or module is blocking you right now?',
  },
  research_help: {
    default:    'Tell me what you have already found in your literature search and what gap you are trying to fill.',
    no_attempt: 'What keywords have you used to search and what was the closest relevant paper you found?',
    repeat:     'What question does your research aim to answer, and what existing work comes closest to addressing it?',
  },
};

// Disengagement responses (no model call needed)
export const DISENGAGE_RESPONSES: Record<number, string> = {
  0: 'No problem — take your time. Just share what part you are working on and I can help narrow it down.',
  1: 'I understand. Let me try a different angle — {{topic}} is something we can build up from scratch. What do you remember about the basics?',
  2: 'Let me show you a worked example on a similar problem first, then we can come back to yours.',
};

// Response for honest confusion — always validate before scaffolding down
export const CONFUSION_PREFIX = 'No problem — let\'s build up from here. ';

export function selectProbeTemplate(
  intent:       IntentType,
  topic:        string,
  prerequisite: string,
  attemptCount: number,
): string {
  const templates = PROBE_TEMPLATES[intent] ?? PROBE_TEMPLATES.definition!;
  const key = attemptCount === 0 ? 'default' : attemptCount === 1 ? 'no_attempt' : 'repeat';
  return ((templates[key] ?? templates['default'])
    .replace('{{topic}}', topic)
    .replace('{{prerequisite}}', prerequisite || topic));
}
