/**
 * validate-syllabus.ts
 * Runs the built-in validatePrerequisites() against SYLLABUS and prints results.
 * Run: npx tsx scripts/validate-syllabus.ts
 */

import { SYLLABUS, validatePrerequisites } from '../lib/syllabus-data';

const allSlugs = SYLLABUS.map(t => t.topic_slug).sort();

console.log(`\n── Syllabus inventory ──────────────────────────────────────────`);
console.log(`  Total topics : ${SYLLABUS.length}`);
console.log(`  Unique slugs : ${new Set(allSlugs).size}`);

// Detect duplicate slugs
const seen = new Set<string>();
const dupes: string[] = [];
for (const slug of allSlugs) {
  if (seen.has(slug)) dupes.push(slug);
  seen.add(slug);
}
if (dupes.length > 0) {
  console.log(`\n  ⚠  DUPLICATE SLUGS FOUND:`);
  dupes.forEach(d => console.log(`       "${d}"`));
} else {
  console.log(`  Duplicate slugs: none`);
}

// Count total prerequisite references
const totalPrereqs = SYLLABUS.reduce((n, t) => n + t.prerequisites.length, 0);
console.log(`  Total prerequisite references: ${totalPrereqs}`);

// Run the built-in validator
console.log(`\n── Prerequisite resolution check ───────────────────────────────`);
const errors = validatePrerequisites();

if (errors.length === 0) {
  console.log(`  ✓  All ${totalPrereqs} prerequisite references resolve correctly.\n`);
} else {
  console.log(`  ✗  ${errors.length} broken reference(s) found:\n`);
  errors.forEach(e => console.log(`     ${e}`));
  console.log('');
  process.exit(1);
}

// Per-topic breakdown
console.log(`── Per-topic prerequisite map ──────────────────────────────────`);
for (const topic of SYLLABUS) {
  const prereqList = topic.prerequisites.length === 0
    ? '(none)'
    : topic.prerequisites.join(', ');
  console.log(`  [Y${topic.year}S${topic.semester}] ${topic.topic_slug}`);
  console.log(`           prereqs: ${prereqList}`);
}
console.log('');
