import { describe, expect, it } from 'vitest';

import eras from '../content/measurements/data/eras.json';

// Hermetic over the COMMITTED eras.json — this suite never shells out to git. The
// generator (`make measurements`) is what talks to the config repo; these assertions
// pin what it produced, so the gate stays runnable on a machine that does not have
// ~/projects/kri-local-rag at all.
//
// Two kinds of assertion, split the same way tests/timeline-lib.test.ts splits them:
//   (1) SHAPE — the era list's contract. These red when a parser or a schema change
//       collapses the list, drops an era, or flattens a typed field.
//   (2) DATA PINS — the four config-dir commit counts, recomputed by the generator
//       from git before they were pinned here. These red when the config repo moves.

const EXPECTED_IDS = ['copilot', 'continue', 'codex', 'cursor', 'claude-code'] as const;

// inc5a decision D4: cost is a typed state, never a nullable number. The four states
// are distinct findings — near-zero-by-construction is NOT the same claim as
// unknown-server-side, and the page must not render them alike.
const COST_STATES = ['derived', 'near-zero-local', 'unknown-server-side', 'absent'];
const TOKEN_STATES = ['yes', 'floor', 'none'];

// inc5a decision D5: `group` is a visual layer only. The list stays five rows.
const GROUPS = ['vscode-plugin', 'cursor', 'claude-code'];

describe('eras.json shape', () => {
  it('is a list of exactly the five eras, in spec order', () => {
    expect(Array.isArray(eras.eras)).toBe(true);
    expect(eras.eras.map((e) => e.id)).toEqual([...EXPECTED_IDS]);
  });

  it('carries a typed availability matrix on every era', () => {
    for (const era of eras.eras) {
      expect(COST_STATES, `${era.id} cost`).toContain(era.availability.cost);
      expect(TOKEN_STATES, `${era.id} tokens`).toContain(era.availability.tokens);
      expect(GROUPS, `${era.id} group`).toContain(era.group);
    }
  });

  it('leaves the skills row empty for every era before Claude Code', () => {
    const withSkills = eras.eras.filter((e) => e.availability.skills === 'yes');
    expect(withSkills.map((e) => e.id)).toEqual(['claude-code']);
  });

  it('never lets a group stand in for the five separate eras', () => {
    // D5's falsifier: grouping three VS Code plugins into one band would leave three
    // distinct groups where the page is required to show five overlapping rows.
    expect(new Set(eras.eras.map((e) => e.group)).size).toBeLessThan(eras.eras.length);
    expect(eras.eras).toHaveLength(5);
  });
});

describe('git-derived spine', () => {
  it('orders every era range forwards in time', () => {
    for (const era of eras.eras) {
      if (era.gitStart === null) continue;
      expect(era.gitStart! <= era.gitEnd!, `${era.id} ${era.gitStart}..${era.gitEnd}`).toBe(true);
    }
  });

  it('gives every era with a config dir a positive commit count, and only those', () => {
    for (const era of eras.eras) {
      if (era.configDir === null) {
        expect(era.gitCommits, `${era.id}`).toBeNull();
        expect(era.gitStart, `${era.id}`).toBeNull();
      } else {
        expect(era.gitCommits, `${era.id}`).toBeGreaterThan(0);
      }
    }
  });

  // Recomputed fixtures: the generator derived these from `git log -- <dir>` in
  // ~/projects/kri-local-rag before they were written here. Copilot Chat stores nothing
  // in a project tree, so it has no config dir and no git range — a genuine absence.
  it('pins the four config-dir commit counts', () => {
    const commits = Object.fromEntries(eras.eras.map((e) => [e.id, e.gitCommits]));
    expect(commits).toEqual({
      copilot: null,
      continue: 2,
      codex: 9,
      cursor: 41,
      'claude-code': 15,
    });
  });

  it('pins the config-dir date ranges', () => {
    const spans = Object.fromEntries(
      eras.eras.filter((e) => e.gitStart !== null).map((e) => [e.id, [e.gitStart, e.gitEnd]]),
    );
    expect(spans).toEqual({
      continue: ['2025-07-13', '2025-08-16'],
      codex: ['2025-08-28', '2025-09-09'],
      cursor: ['2025-07-31', '2026-06-23'],
      'claude-code': ['2026-06-23', '2026-09-06'],
    });
  });

  it('shows the eras overlap rather than succeed one another', () => {
    // The structural finding the page must encode: Cursor's range spans Codex's
    // entirely and touches Claude Code's start. A generator that emitted consecutive
    // non-overlapping bands would red here.
    const by = Object.fromEntries(eras.eras.map((e) => [e.id, e]));
    expect(by.cursor!.gitStart! < by.codex!.gitStart!).toBe(true);
    expect(by.cursor!.gitEnd! > by.codex!.gitEnd!).toBe(true);
    expect(by.cursor!.gitEnd! >= by['claude-code']!.gitStart!).toBe(true);
  });
});
