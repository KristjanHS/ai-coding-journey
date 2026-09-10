import { describe, expect, it } from 'vitest';

import { overlappingPairs } from '../src/lib/measurements';
import { byId, document, SPEC_ORDER } from './helpers';

const TOKEN_STATES = new Set(['yes', 'floor', 'none']);
const GROUPS = new Set(['chat', 'vscode-plugin', 'cursor', 'gemini', 'claude-code']);

// ── (2) Shape ─────────────────────────────────────────────────────────────────
describe('eras.json shape', () => {
  it('is a list of exactly the named eras, in spec order', () => {
    expect(document.eras.map((e) => e.id)).toEqual(SPEC_ORDER);
  });

  it('carries the chat era, which no generator can ever fill', () => {
    // Seeded in scripts/measurements-git.py's ERAS rather than by a scanner: no scanner
    // could find it, because the tool wrote nothing to this machine. If a regeneration
    // ever drops it, the ladder loses the era chapter 01 is about.
    const era = byId('chat');
    expect(era.logStart, 'a log range would mean the era left a record').toBeNull();
    expect(era.gitStart, 'a git range would mean it had a config dir').toBeNull();
    expect(era.share, 'no token field, so no share — and never a zero').toBeNull();
  });

  it('says of every era how its dates were arrived at, and only calls one an estimate', () => {
    // The badge on /measurements/ reads this field. A bracket rendering like a measured
    // range is the worst failure this page has, so the distinction lives in the data.
    for (const era of document.eras) {
      expect(['estimated', 'measured'], `${era.id}`).toContain(era.dateMethod);
      const bracketed = era.dateLow !== null;
      expect(bracketed, `${era.id}: a bracket is exactly what "estimated" means`).toBe(
        era.dateMethod === 'estimated',
      );
      if (bracketed) expect(era.dateLow <= era.dateHigh, `${era.id}`).toBe(true);
    }
    expect(document.eras.filter((e) => e.dateMethod === 'estimated').map((e) => e.id)).toEqual([
      'chat',
    ]);
  });

  it('publishes the chat era hardware ceiling and no count of how much it was used', () => {
    // Reading A of the inc5c usage-volume ruling: a VRAM ceiling is a fact about the
    // machine; a thread, file or message count is a fact about how much one person used
    // a chatbot, and belongs in the private store with the token totals.
    const coverage = byId('chat').coverage;
    expect(coverage.vramCeilingGiB).toBe(8);
    expect(Object.keys(coverage)).toEqual(['vramCeilingGiB']);
  });

  it('carries a typed availability matrix on every era', () => {
    for (const era of document.eras) {
      expect(TOKEN_STATES.has(era.availability.tokens), `${era.id} tokens`).toBe(true);
      expect(['yes', 'none']).toContain(era.availability.skills);
      expect(typeof era.availability.counts).toBe('string');
    }
  });

  it('leaves the skills row empty for every era before Claude Code', () => {
    for (const era of document.eras) {
      expect(Boolean(era.skills), `${era.id} skills block`).toBe(era.id === 'claude-code');
    }
  });

  it('never lets a group stand in for the five separate eras', () => {
    // D5: `group` is a colour tag. Fewer groups than eras — if a refactor ever
    // collapses the list to its groups, this reds.
    expect(new Set(document.eras.map((e) => e.group)).size).toBeLessThan(document.eras.length);
    for (const era of document.eras) expect(GROUPS.has(era.group)).toBe(true);
  });

  it('gives every token-bearing era a share and every other era none', () => {
    for (const era of document.eras) {
      const bearing = era.availability.tokens !== 'none';
      expect(typeof era.share === 'number', `${era.id} share`).toBe(bearing);
      if (bearing) {
        expect(era.share).toBeGreaterThan(0);
        expect(era.share).toBeLessThanOrEqual(1);
      } else {
        // null, never 0 — an absence must not render as a measured zero.
        expect(era.share).toBeNull();
      }
    }
  });

  it('has the four bearing shares account for the whole floor', () => {
    const total = document.eras.reduce((sum, e) => sum + (e.share ?? 0), 0);
    expect(total).toBeGreaterThan(0.999);
    expect(total).toBeLessThan(1.001);
  });
});

// ── (3) Data pins: the git spine ──────────────────────────────────────────────
describe('git-derived spine', () => {
  it('orders every era range forwards in time', () => {
    for (const era of document.eras) {
      if (era.gitStart) expect(era.gitStart <= era.gitEnd).toBe(true);
      // Null for an era that kept no log — an absence to skip, not a range to order.
      if (era.logStart) expect(era.logStart <= era.logEnd).toBe(true);
    }
  });

  it('gives every era with a config dir a positive commit count, and only those', () => {
    for (const era of document.eras) {
      if (era.configDir === null) {
        expect(era.gitCommits, `${era.id}`).toBeNull();
      } else {
        expect(era.gitCommits, `${era.id}`).toBeGreaterThan(0);
      }
    }
  });

  it('pins the four config-dir commit counts', () => {
    expect(byId('continue').gitCommits).toBe(2);
    expect(byId('codex').gitCommits).toBe(9);
    expect(byId('cursor').gitCommits).toBe(41);
    expect(byId('claude-code').gitCommits).toBe(15);
    expect(byId('copilot').gitCommits).toBeNull();
  });

  it('pins the config-dir date ranges', () => {
    expect([byId('continue').gitStart, byId('continue').gitEnd]).toEqual(['2025-07-13', '2025-08-16']);
    expect([byId('codex').gitStart, byId('codex').gitEnd]).toEqual(['2025-08-28', '2025-09-09']);
    expect([byId('cursor').gitStart, byId('cursor').gitEnd]).toEqual(['2025-07-31', '2026-06-23']);
    expect([byId('claude-code').gitStart, byId('claude-code').gitEnd]).toEqual(['2026-06-23', '2026-09-06']);
  });

  it('shows the eras overlap rather than succeed one another', () => {
    // The load-bearing structural claim of the whole page: a tidy succession would be
    // a false story, and the data must be able to refute it.
    expect(overlappingPairs.length).toBeGreaterThanOrEqual(4);
  });
});
