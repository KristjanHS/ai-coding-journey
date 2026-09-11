import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { RUNG_META } from '../src/lib/rungs';

// The `from`/`unit` ladder columns are single-sourced in `src/lib/rungs.ts`
// (`src/pages/journey/index.astro` maps over them) and hand-copied into two
// markdown ladder tables. This suite reds when either copy drifts: it parses the
// rung rows out of both files and asserts each cell equals `RUNG_META`, and that
// all six rungs are present in each. Prose is not checked here — only the table.
const FILES: Record<string, string> = {
  worksheet: join('content', 'course', 'worksheet.md'),
  atom: join('content', 'atoms', 'governing--the-ladder-on-one-page.md'),
};

const RUNGS = Object.keys(RUNG_META) as (keyof typeof RUNG_META)[];

/**
 * The ladder table's rung rows as `{ from, unit }`, keyed by rung. A row counts
 * only when its first cell is a known rung, so the header, the `---` separator
 * and the atom's `>`-prefixed Evidence line are all excluded structurally.
 */
function ladderRows(path: string): Record<string, { from: string; unit: string }> {
  const rows: Record<string, { from: string; unit: string }> = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trimStart().startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 3) continue;
    if (!(RUNGS as string[]).includes(cells[0])) continue;
    rows[cells[0]] = { from: cells[1], unit: cells[2] };
  }
  return rows;
}

describe('the markdown ladder tables mirror RUNG_META', () => {
  it('RUNG_META names all six rungs', () => {
    expect(RUNGS.length).toBe(6);
  });

  for (const [name, path] of Object.entries(FILES)) {
    describe(name, () => {
      const rows = ladderRows(path);

      it('parses exactly the six rung rows', () => {
        expect(Object.keys(rows).sort()).toEqual([...RUNGS].sort());
      });

      for (const rung of RUNGS) {
        it(`${rung}: from and unit cells equal RUNG_META`, () => {
          expect(rows[rung], `${path}: no table row for rung \`${rung}\``).toBeDefined();
          expect(rows[rung].from, `${path}: \`${rung}\` from cell drifted from RUNG_META`).toBe(
            RUNG_META[rung].from,
          );
          expect(rows[rung].unit, `${path}: \`${rung}\` unit cell drifted from RUNG_META`).toBe(
            RUNG_META[rung].unit,
          );
        });
      }
    });
  }
});
