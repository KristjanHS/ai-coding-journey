import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { JOURNEY, read } from './helpers';
import { RUNG_META } from '../src/lib/rungs';

// The six rungs render on /journey/ from `RUNGS` itself, so the NAMES cannot
// drift. What can drift is the metadata beside them: `RUNG_META` (in
// `src/lib/rungs.ts` since the single-sourcing move) is a hand-written Record,
// and `astro build` does not typecheck, so a seventh rung added to the enum
// reaches the build as an opaque "Cannot read properties of undefined" at render
// time. This is the legible half of that gate — it names the enum rung that has
// no RUNG_META row.
describe('the rung ladder reaches /journey/', () => {
  const rungs = (() => {
    const config = read(join('src', 'content.config.ts'));
    const decl = config.match(/^export const RUNGS = \[([^\]]*)\]/m);
    expect(decl, 'no RUNGS in src/content.config.ts').not.toBeNull();
    return [...decl![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  })();

  const page = read(join('src', 'pages', 'journey', 'index.astro'));

  it('there are rungs to check, and metadata to check them against', () => {
    expect(rungs.length).toBeGreaterThan(1);
    expect(Object.keys(RUNG_META).length).toBeGreaterThan(1);
  });

  it.each(rungs)('%s: has a date and a unit handed over', (rung) => {
    const row = (RUNG_META as Record<string, { from: string; unit: string }>)[rung];
    expect(row, `${rung} is in RUNGS with no RUNG_META row`).toBeDefined();
    expect(row.from, `${rung}: no from: date`).toMatch(/^\d{4}-\d{2}$/);
    expect(row.unit, `${rung}: no unit handed over`).toMatch(/\S/);
  });

  it('the table renders from the enum, sourcing RUNG_META from the shared lib', () => {
    expect(page, '/journey/ does not import RUNGS').toMatch(
      /import \{ RUNGS \} from '\.\.\/\.\.\/content\.config'/,
    );
    expect(page, '/journey/ does not import RUNG_META from src/lib/rungs').toMatch(
      /import \{ RUNG_META \} from '\.\.\/\.\.\/lib\/rungs'/,
    );
    expect(page, '/journey/ does not map its table over RUNGS').toMatch(/RUNGS\.map\(/);
  });
});

const WRONG_CHAPTER = join(JOURNEY, '90-what-i-got-wrong.md');

// A regression guard, not a correctness check: correctness is the verified read
// against `sources/`, and this only reds when a later edit drops or alters one.
const DATED_SPINE = [
  { date: '2025-12-05', what: 'the shell wrapper failed on every command', mark: /`exit -1`[\s\S]*`pid: -1`/ },
  { date: '2025-12-05', what: 'edits reported success on an untouched file', mark: /CVE-2025-59944/ },
  { date: '2025-12-05', what: 'a shown diff was absent from disk until applied', mark: /`\+380`-line diff/ },
  { date: '2025-12-05', what: 'agent plans lived outside the repo', mark: /internal application data/ },
  { date: '2026-02-08', what: 'the subagent limitation that ended the era', mark: /same conversation context/ },
  { date: '2026-02-07', what: 'the free alternatives that priced the switch', mark: /OpenCode, Cline and Aider/ },
];

describe('the dated spine of 90-what-i-got-wrong', () => {
  const body = read(WRONG_CHAPTER);

  it('there is a spine to check', () => {
    expect(DATED_SPINE.length).toBe(6);
    expect(DATED_SPINE.filter((row) => row.date === '2025-12-05')).toHaveLength(4);
  });

  it.each(DATED_SPINE)('$date: $what', ({ date, mark }) => {
    expect(body, `${date} no longer appears in the chapter`).toContain(date);
    expect(body, `the ${date} evidence no longer matches ${mark}`).toMatch(mark);
  });
});
