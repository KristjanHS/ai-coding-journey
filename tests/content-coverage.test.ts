import { describe, expect, it } from 'vitest';

import { ATOMS, configEnum, frontmatter, read } from './helpers';

// The corpus target (ruled 2026-09-11): ≥1 atom per rung × concern cell. An empty
// cell must be listed here with its reason; a listed cell that fills reds, so the
// list drains as atoms land. `queued` = not yet attempted by the chain's §S5.
const KNOWN_GAPS: Record<string, string> = {
  'asking/provenance': 'chat era: nothing versioned; Cursor .mdc rule lines are web-cited model answers, no chapter',
  'asking/cost': '00-copilot chat logged no token/cost field; no positive dated figure and no cost topic',
  'suggesting/control': 'Continue figures count all token events, chat included — no completion-only measurement',
  'suggesting/provenance': 'Continue cross-check & Cursor client-estimate fit no provenance topic in content/topics/',
  'suggesting/quality': 'no quality topic covers the Continue era; its two-store cross-check has no topic home',
  'suggesting/cost': 'eras.json withholds every cost figure; the 0.10% floor share is token volume, not cost',
  'delegating/control': 'Codex rollouts do not split agent from chat mode — the 30.3% injected-context share is not a task-unit figure',
  'delegating/provenance': 'Codex history.jsonl stub is a measurement note; no content/topics/ home for a measurement-seeded atom',
  'delegating/quality': "04's broken-tooling commit line never attributes the Makefile/hooks to an agent — delegation unproven",
  'delegating/cost': 'Codex token floor (37% of rollouts from 2025-09-23) counts every mode, chat included — not a task-unit cost',
  'planning/cost': 'no measured cost of writing or reading a plan; the plan-rule path-gating line is a configuring-unit file',
  'configuring/quality': 'queued',
  'governing/control': 'queued',
  'governing/provenance': 'queued',
  'governing/quality': 'queued',
};

const RUNGS = configEnum('RUNGS');
const CONCERNS = configEnum('CONCERNS');
const CELLS = RUNGS.flatMap((rung) => CONCERNS.map((concern) => `${rung}/${concern}`));

function filledCells(): Map<string, number> {
  const filled = new Map<string, number>();
  for (const path of ATOMS) {
    const cell = `${frontmatter(read(path), 'rung')}/${frontmatter(read(path), 'concern')}`;
    filled.set(cell, (filled.get(cell) ?? 0) + 1);
  }
  return filled;
}

describe('rung × concern coverage', () => {
  it('the grid is the declared enums, and every atom lands in one of its cells', () => {
    expect(RUNGS.length, 'RUNGS parsed empty').toBeGreaterThan(0);
    expect(CONCERNS.length, 'CONCERNS parsed empty').toBeGreaterThan(0);
    expect(ATOMS.length, 'no atoms — the grid cannot establish').toBeGreaterThan(0);
    for (const cell of filledCells().keys()) expect(CELLS, `atom cell '${cell}' is off the grid`).toContain(cell);
  });

  it('every KNOWN_GAPS key names a grid cell', () => {
    for (const [cell, why] of Object.entries(KNOWN_GAPS)) {
      expect(CELLS, `KNOWN_GAPS '${cell}' is not a cell`).toContain(cell);
      expect(why.trim(), `KNOWN_GAPS '${cell}' carries no reason`).not.toBe('');
    }
  });

  it('every cell holds an atom or a reasoned KNOWN_GAPS entry — never both', () => {
    const filled = filledCells();
    for (const cell of CELLS) {
      const has = filled.has(cell);
      const gap = cell in KNOWN_GAPS;
      expect(has || gap, `empty cell '${cell}' is not in KNOWN_GAPS`).toBe(true);
      expect(has && gap, `cell '${cell}' has an atom — delete its KNOWN_GAPS entry`).toBe(false);
    }
  });
});
