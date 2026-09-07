import { describe, expect, it } from 'vitest';

import {
  COMMIT_DOMAIN,
  MAX_PX,
  MIN_COMMITS,
  MIN_PX,
  TIME_DOMAIN,
  commitThickness,
  dateFraction,
  experiments,
  rows,
} from '../src/lib/timeline';

// Two kinds of assertion live here, split on purpose:
//
//   (1) the PURE CORE, called with a FIXED domain. These can only red if the
//       maths changed -- swap the log scale for a linear one and the midpoint
//       check below fails while the endpoints stay green.
//   (2) the DATA PINS, asserting the domains DERIVED from content/timeline.json.
//       These red when the corpus moves (a repo gains commits, a new repo
//       lands), and the failure names the data rather than the formula.
//
// Keeping them apart is why the scale functions take a domain argument at all.
const FIXED: readonly [number, number] = [2, 4980];

describe('commitThickness (pure core, fixed domain)', () => {
  it('maps the domain floor and ceiling to MIN_PX and MAX_PX', () => {
    expect(commitThickness(2, FIXED)).toBe(MIN_PX);
    expect(commitThickness(4980, FIXED)).toBe(MAX_PX);
  });

  it('increases monotonically across the domain', () => {
    const samples = [2, 5, 20, 106, 741, 4980];
    const thicknesses = samples.map((n) => commitThickness(n, FIXED));
    for (let i = 1; i < thicknesses.length; i += 1) {
      expect(thicknesses[i]).toBeGreaterThan(thicknesses[i - 1]!);
    }
  });

  // The discriminating check. A LINEAR map puts 50 commits at
  // (50-2)/(4980-2) = ~1% of the range -- essentially MIN_PX. The LOG map puts
  // it at ~41%. This is the assertion that reds if someone drops the log.
  it('places a mid-magnitude count on the LOG curve, not the linear one', () => {
    const actual = commitThickness(50, FIXED);
    const linear = MIN_PX + ((50 - 2) / (4980 - 2)) * (MAX_PX - MIN_PX);
    const log = MIN_PX + ((Math.log10(50) - Math.log10(2)) / (Math.log10(4980) - Math.log10(2))) * (MAX_PX - MIN_PX);

    expect(Math.abs(actual - log)).toBeLessThan(Math.abs(actual - linear));
    expect(actual).toBeGreaterThan(linear + 1);
  });

  it('clamps outside the domain instead of running off the scale', () => {
    expect(commitThickness(1, FIXED)).toBe(MIN_PX);
    expect(commitThickness(10_000, FIXED)).toBe(MAX_PX);
  });
});

describe('dateFraction (pure core, fixed domain)', () => {
  const SPAN: readonly [string, string] = ['2025-06-19', '2026-09-06'];

  it('maps the domain endpoints to 0 and 1', () => {
    expect(dateFraction('2025-06-19', SPAN)).toBe(0);
    expect(dateFraction('2026-09-06', SPAN)).toBe(1);
  });

  it('places an interior date strictly between them', () => {
    const mid = dateFraction('2026-01-01', SPAN);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
});

describe('domains derived from content/timeline.json (data pins)', () => {
  it('pins the commit domain to the current corpus', () => {
    expect(COMMIT_DOMAIN).toEqual([2, 4980]);
  });

  it('pins the time domain to the current corpus', () => {
    expect(TIME_DOMAIN[0]).toBe('2025-06-19');
    expect(TIME_DOMAIN[1]).toBe('2026-09-06');
  });

  it('reads the full 14-row corpus', () => {
    expect(rows).toHaveLength(14);
  });
});

describe('experiments', () => {
  it('holds exactly the sub-MIN_COMMITS repos, oldest first', () => {
    expect(experiments.length).toBeGreaterThan(0);
    expect(experiments.every((row) => row.commits < MIN_COMMITS)).toBe(true);
    expect(rows.filter((row) => row.commits < MIN_COMMITS)).toHaveLength(experiments.length);

    const dates = experiments.map((row) => row.first_commit);
    expect([...dates].sort()).toEqual(dates);
  });
});
