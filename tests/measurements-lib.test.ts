import { describe, expect, it } from 'vitest';

import {
  allCaveatLines,
  availabilityMatrix,
  caveats,
  TIME_DOMAIN,
  eraSpans,
  overlaps,
  overlappingPairs,
  tokenShape,
} from '../src/lib/measurements';
import { byId, SPEC_ORDER } from './helpers';

// ── The derived LIB views (D8 — pin the lib, NOT built dist/) ─────────────────
describe('measurements lib — the shared time axis', () => {
  it('spans from the earliest era bound to the latest, both derived from the data', () => {
    // Pinned because every band's position is a fraction of THIS domain: a domain that
    // silently stopped covering an era would push that band off the axis rather than
    // fail. The start is the chat era's bracket low — the ladder's earliest date, and
    // earlier than any record-derived range.
    expect(TIME_DOMAIN[0]).toBe('2025-06-14');
    expect(TIME_DOMAIN[0]).toBe(byId('chat').dateLow);
    for (const span of eraSpans) {
      expect(span.start >= TIME_DOMAIN[0], `${span.id} starts left of the axis`).toBe(true);
      expect(span.end <= TIME_DOMAIN[1], `${span.id} ends right of the axis`).toBe(true);
    }
  });

  it('gives the recordless era a span at all, from its bracket alone', () => {
    // eraSpans used to union git ∪ log only; an era with neither produced no span and
    // never rendered. The bracket is the third source.
    const span = eraSpans.find((s) => s.id === 'chat')!;
    expect([span.start, span.end]).toEqual([byId('chat').dateLow, byId('chat').dateHigh]);
    expect(span.dateMethod).toBe('estimated');
  });
});

describe('measurements lib — overlap view (D8: derived, not dist/)', () => {
  it('has at least two era spans that intersect in time', () => {
    const intersecting = eraSpans.some((a, i) => eraSpans.slice(i + 1).some((b) => overlaps(a, b)));
    expect(intersecting).toBe(true);
  });

  it('names the Cursor∩Codex overlap in the derived pairs list', () => {
    const pair = overlappingPairs.find(
      (p) => (p.a === 'codex' && p.b === 'cursor') || (p.a === 'cursor' && p.b === 'codex'),
    );
    expect(pair, 'the two concurrent plugin eras stopped overlapping').toBeDefined();
    expect(pair!.start <= pair!.end).toBe(true);
  });
});

describe('measurements lib — token shape replaces the absolute headline', () => {
  it('gives a row per era, with a share for the four bearing tools only', () => {
    expect(tokenShape.rows.map((r) => r.id)).toEqual(SPEC_ORDER);
    expect(tokenShape.bearingRows.length).toBe(4);
    expect(tokenShape.bearingCount).toBe(4);
    // Seven eras, four that log a token at all. The chat era, Copilot and the Gemini CLI
    // are the three absences, and they are absences of different kinds: one tool logged
    // and left the field out, one never wrote a file, one ran a CLI agent that logged no
    // tokens locally.
    expect(tokenShape.totalTools).toBe(7);
  });

  it('sums the bearing shares to the whole floor', () => {
    expect(tokenShape.shareTotal).toBeCloseTo(1, 2);
  });

  it('exposes no absolute anywhere in the view', () => {
    // The lib is where a breach would surface as a rendered figure. Nothing it emits may
    // be a quantity: every number is a fraction or a bar width.
    for (const row of tokenShape.rows) {
      if (row.share !== null) {
        expect(row.share).toBeGreaterThan(0);
        expect(row.share).toBeLessThanOrEqual(1);
      }
      expect(row.logWidth).toBeGreaterThanOrEqual(0);
      expect(row.logWidth).toBeLessThanOrEqual(1);
    }
  });

  it('keeps the smallest share visible on the log-scaled bar', () => {
    // The whole reason the bar is log-scaled: Continue is three decades below Claude
    // Code, and on a linear bar it would render as nothing at all.
    const continueRow = tokenShape.rows.find((r) => r.id === 'continue')!;
    const claudeRow = tokenShape.rows.find((r) => r.id === 'claude-code')!;
    expect(continueRow.share! * 100).toBeLessThan(claudeRow.share!);
    expect(continueRow.logWidth).toBeGreaterThan(0.05);
    expect(continueRow.logWidth).toBeLessThan(claudeRow.logWidth);
  });

  it('renders a non-bearing tool as an absence, never as a zero share', () => {
    const copilot = tokenShape.rows.find((r) => r.id === 'copilot')!;
    expect(copilot.share).toBeNull();
    expect(copilot.logWidth).toBe(0);
    expect(copilot.qualifier).toMatch(/absence|not a zero/i);
  });

  it('carries a qualifier on every row, so no share can be read bare', () => {
    for (const row of tokenShape.rows) expect(row.qualifier.length).toBeGreaterThan(20);
  });
});

describe('measurements lib — caveats never silently drop (D8)', () => {
  it('carries the Cursor floor and client-side-estimate caveats', () => {
    const cursor = caveats.find((c) => c.id === 'cursor')!;
    expect(cursor.lines.some((l) => /floor/i.test(l))).toBe(true);
    expect(cursor.lines.some((l) => /client-side|estimate/i.test(l))).toBe(true);
  });

  it('carries the Copilot absence as a caveat of its own', () => {
    const copilot = caveats.find((c) => c.id === 'copilot')!;
    expect(copilot.lines.some((l) => /no token field/i.test(l))).toBe(true);
  });

  it('states every caveat as prose a reader can act on', () => {
    expect(allCaveatLines.length).toBeGreaterThanOrEqual(4);
    for (const line of allCaveatLines) expect(line.length).toBeGreaterThan(20);
  });
});

describe('measurements lib — availability matrix (D5/D6)', () => {
  it('names every era in spec order', () => {
    expect(availabilityMatrix.map((r) => r.id)).toEqual(SPEC_ORDER);
  });

  it('renders the skills row empty for eras 0–3 and populated only for Claude Code', () => {
    for (const row of availabilityMatrix) {
      expect(row.skills === null, `${row.id}`).toBe(row.id !== 'claude-code');
    }
  });

  it('carries no cost field into the matrix at all', () => {
    for (const row of availabilityMatrix) expect(Object.keys(row)).not.toContain('cost');
  });
});
