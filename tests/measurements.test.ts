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

// ── Era 4: Claude Code ────────────────────────────────────────────────────────
// The one era with tokens, money and sessions all derivable. Pins here are
// RECOMPUTED fixtures: `make measurements` derived them from the live log tree, and a
// regeneration is EXPECTED to move them — the corpus grows daily and old transcripts
// age out. A red here after a regen means "update the pin with the new measurement",
// which is the point: the narrative in content/measurements/*.md is mirrored against
// these, so a figure can never drift silently.

const cc = eras.eras.find((e) => e.id === 'claude-code')!;
const CLASSES = ['input', 'cacheCreation', 'cacheRead', 'output'] as const;

describe('claude-code era metrics', () => {
  it('pins the session and transcript counts', () => {
    expect(cc.metrics.main.sessions).toBe(723);
    expect(cc.metrics.main.files).toBe(749);
    // 898 subagent transcripts, spread across 346 of the main sessions — the subagent
    // side's distinct sessionId count is the PARENT count, not a subagent count.
    expect(cc.metrics.subagent.files).toBe(898);
    expect(cc.metrics.subagent.parentSessions).toBe(346);
  });

  it('keeps the parent and subagent sides distinct and both non-empty (D1)', () => {
    // The D1 ruling prints both figures side by side, so neither side may be zero by
    // construction. This is the falsifier for the sidechain filter: every assistant
    // record in a subagent transcript carries isSidechain: true, so a filter applied
    // with the same sense to both sides zeroes this one.
    for (const klass of CLASSES) {
      expect(cc.metrics.main.tokens[klass], `main ${klass}`).toBeGreaterThan(0);
      expect(cc.metrics.subagent.tokens[klass], `subagent ${klass}`).toBeGreaterThan(0);
    }
  });

  it('reconciles per-model token sums against each side total', () => {
    for (const side of ['main', 'subagent'] as const) {
      const models = Object.values(cc.metrics[side].perModel);
      for (const klass of CLASSES) {
        const summed = models.reduce((total, m) => total + m[klass], 0);
        expect(summed, `${side} ${klass}`).toBe(cc.metrics[side].tokens[klass]);
      }
    }
  });

  it('keeps the four token classes separate, cache_read never folded in', () => {
    // D2's cache-class ruling lives in the DATA here: the headline (input +
    // cacheCreation + output) must be reconstructible, which it only is while
    // cacheRead is its own field. cacheRead dominates — that is exactly why.
    const t = cc.metrics.main.tokens;
    const headline = t.input + t.cacheCreation + t.output;
    expect(t.cacheRead).toBeGreaterThan(headline);
    expect(headline).toBeGreaterThan(0);
  });

  it('reconciles per-model cost against the session cost total', () => {
    const summed = Object.values(cc.metrics.cost.perModelUSD).reduce((a, b) => a + b, 0);
    expect(Math.abs(summed - cc.metrics.cost.totalUSD)).toBeLessThan(0.01);
    expect(cc.metrics.cost.hasUnknownModelCost).toBe(false);
  });

  it('pins the derived cost and marks the era cost-derivable', () => {
    expect(cc.metrics.cost.totalUSD).toBeCloseTo(<redacted>, 3);
    expect(cc.metrics.cost.sessionsWithCostState).toBe(293);
    expect(cc.availability.cost).toBe('derived');
  });

  it('dates the log range forwards and records that it starts after the git range', () => {
    expect(cc.logStart! <= cc.logEnd!).toBe(true);
    // A real cross-check disagreement, shown rather than smoothed away: the .claude/
    // config dir dates the era from 2026-06-23, but the oldest surviving transcript is
    // later — Claude Code prunes its own logs, so the log range is a floor on the era,
    // not its start.
    expect(cc.logStart! > cc.gitStart!).toBe(true);
  });
});
