import { describe, expect, it } from 'vitest';

import { configEnum } from './helpers';
import { RUNG_META } from '../src/lib/rungs';
import { RUNG_PERIODS, livedThrough } from '../src/lib/rung-periods';

const RUNGS = configEnum('RUNGS');

// `RUNG_PERIODS` derives four of its six boundaries from the generated eras
// data, so a `make measurements` regen can silently move a lane. These pins
// carry the literals the timeline was designed against: a regen that shifts one
// reds HERE, with the rung named, instead of quietly redrawing the chart.
const PINNED: Record<string, { start: string; end: string | null }> = {
  asking: { start: '2025-06-14', end: '2025-07-06' },
  suggesting: { start: '2025-06-20', end: '2025-12-08' },
  delegating: { start: '2025-07-31', end: '2026-05-18' },
  planning: { start: '2026-02-28', end: null },
  configuring: { start: '2026-04-05', end: null },
  governing: { start: '2026-07-09', end: null },
};

describe('the six rungs as periods', () => {
  it('covers every rung in ladder order', () => {
    expect(RUNG_PERIODS.map((p) => p.rung)).toEqual(RUNGS);
  });

  it.each(RUNG_PERIODS)('$rung: start and end match the pinned literals', (period) => {
    expect(period.start).toBe(PINNED[period.rung].start);
    expect(period.end).toBe(PINNED[period.rung].end);
  });

  it.each(RUNG_PERIODS)('$rung: names a source for both boundaries', (period) => {
    expect(period.startSource).not.toHaveLength(0);
    expect(period.endSource).not.toHaveLength(0);
  });

  it.each(RUNG_PERIODS)('$rung: names at least one tool by its display name', (period) => {
    expect(period.tools.length).toBeGreaterThan(0);
    for (const tool of period.tools) expect(tool).toMatch(/^[A-Z]/);
  });

  // Ruled 2026-09-12: the rung opens on a git-dated seam, not on the first log
  // line of a tool that never ran an agent mode (Continue, 2025-07-04).
  it('delegating opens on the first .cursor/ commit, not on a log', () => {
    const period = RUNG_PERIODS.find((p) => p.rung === 'delegating')!;
    expect(period.startSource).toMatch(/gitStart/);
    expect(period.tools).toContain('Cursor');
  });

  // The overlap is the whole point of the strip: rungs are not a partition of
  // the timeline, they bleed into each other. Copilot kept logging for five
  // months after `delegating` opened, and that is data, not taste.
  it.each(RUNG_PERIODS.filter((p) => p.end !== null))(
    '$rung: its measured end falls after the NEXT rung started',
    (period) => {
      const next = RUNG_PERIODS[RUNG_PERIODS.indexOf(period) + 1];
      expect(next, `${period.rung} has no successor`).toBeDefined();
      expect(period.end! > next.start).toBe(true);
    },
  );

  // `RUNG_META.from` feeds the /journey/ rung table and both markdown ladder
  // copies. It is hand-written; these starts are derived. They must agree to
  // the month, or the page and the chart tell the reader two different stories.
  it.each(RUNG_PERIODS)('$rung: RUNG_META.from agrees to the month', (period) => {
    expect(RUNG_META[period.rung].from).toBe(period.start.slice(0, 7));
  });
});

describe('livedThrough', () => {
  it('returns the overlapping rungs in ladder order', () => {
    // `delegating` belongs here: cursor logged until 2026-05-18, inside the span.
    expect(livedThrough('2026-04-05', '2026-09-01')).toEqual([
      'delegating',
      'planning',
      'configuring',
      'governing',
    ]);
  });

  it('an open-ended period overlaps everything after its start', () => {
    expect(livedThrough('2026-08-01', '2026-08-02')).toContain('planning');
  });

  it('excludes a period that closed before the span opened', () => {
    expect(livedThrough('2026-06-01', '2026-09-01')).not.toContain('suggesting');
  });
});
