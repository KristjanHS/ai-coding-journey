import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { governance, governanceRows } from '../src/lib/measurements';
import { document } from './helpers';

// ── inc5e: the governance counts ──────────────────────────────────────────────
// Pinned by RULE, never by value. `memoryFiles` and `hookCommands` count live files on
// one workstation, so they move whenever a memory is written or a hook is wired — the
// plan's own "135 memory files" had drifted to 136 before it shipped. Pinning the
// numbers the way SHARE_TEXT pins shares would red this suite weekly for no defect, so
// these four assertions guard the shape, the redaction ceiling and the absence of a
// hand-copied literal in the markup instead.
describe('governance counts', () => {
  const PAGE = readFileSync(join(process.cwd(), 'src/pages/measurements/index.astro'), 'utf8');

  it('carries the block on the Claude Code era and on no other', () => {
    const carrying = document.eras.filter((e) => e.governance !== undefined).map((e) => e.id);
    expect(carrying).toEqual(['claude-code']);
  });

  it('counts positive integers under the redaction ceiling', () => {
    expect(governance).toBeDefined();
    const g = governance!;
    for (const [key, value] of Object.entries({
      hookEvents: g.hookEvents,
      hookCommands: g.hookCommands,
      memoryFiles: g.memoryFiles,
      memoryProjects: g.memoryProjects,
    })) {
      expect(Number.isInteger(value), `${key} is not an integer: ${value}`).toBe(true);
      expect(value, `${key} is not positive`).toBeGreaterThan(0);
      // The same ceiling `scripts/measurements-public.py` audit() enforces.
      expect(value, `${key} breaches the redaction ceiling`).toBeLessThan(10_000);
    }
    // A project dir counts only when it holds at least one file, so it can never
    // outnumber the files — the inversion a glob pointed at the wrong tree produces.
    expect(g.memoryProjects).toBeLessThanOrEqual(g.memoryFiles);
    expect(g.hookEvents).toBeLessThanOrEqual(g.hookCommands);
  });

  it('renders every row from the store, with a qualifier on each', () => {
    expect(governanceRows.length).toBe(4);
    for (const row of governanceRows) {
      expect(Number.isInteger(row.value), `${row.label}: non-integer value`).toBe(true);
      expect(row.qualifier.length, `${row.label}: no qualifier`).toBeGreaterThan(20);
    }
    const values = governanceRows.map((r) => r.value);
    expect(values).toContain(governance!.hookCommands);
    expect(values).toContain(governance!.memoryFiles);
  });

  it('types none of those counts into the page markup', () => {
    // The whole point of the generator: a literal here would survive a regen that moved
    // the number, and the page would then print a figure the store no longer holds.
    for (const value of [
      governance!.hookCommands,
      governance!.hookEvents,
      governance!.memoryFiles,
      governance!.memoryProjects,
    ]) {
      expect(
        new RegExp(`\\b${value}\\b`).test(PAGE),
        `src/pages/measurements/index.astro types the literal ${value}`,
      ).toBe(false);
    }
  });
});
