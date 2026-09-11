// The six-rung ladder's per-rung metadata: the git-dated `from` boundary and the
// `unit` of instruction handed over at that rung. Single source for three
// readers — `src/pages/journey/index.astro` maps it into the rung table, and the
// same values are hand-copied into the markdown ladder tables in
// `content/course/worksheet.md` and `content/atoms/governing--the-ladder-on-one-page.md`;
// `tests/content-ladder.test.ts` reds when either markdown copy drifts from here.
//
// `RUNGS` is imported for the totality typing only (used in a `typeof` type
// query, so the import is erased at build time) — the enum's order and vocabulary
// still live in `src/content.config.ts`; this file adds only the two columns.
import type { RUNGS } from '../content.config';

export const RUNG_META: Record<(typeof RUNGS)[number], { from: string; unit: string }> = {
  asking: { from: '2025-06', unit: 'a question' },
  suggesting: { from: '2025-06', unit: 'a snippet' },
  delegating: { from: '2025-07', unit: 'a task' },
  planning: { from: '2026-02', unit: 'a plan' },
  configuring: { from: '2026-04', unit: 'a policy' },
  governing: { from: '2026-07', unit: 'a process' },
};
