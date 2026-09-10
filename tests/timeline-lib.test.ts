import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
    expect(COMMIT_DOMAIN).toEqual([2, 5035]);
  });

  it('pins the time domain to the current corpus', () => {
    expect(TIME_DOMAIN[0]).toBe('2025-06-19');
    expect(TIME_DOMAIN[1]).toBe('2026-09-08');
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

  // `MIN_COMMITS` has ONE source, `scripts/timeline-config.json`, read by this
  // lib and by the Python generator. The two assertions prove each reader
  // actually reads it: the lib's export equals the file's value (a re-hardcoded
  // `= 5` in timeline.ts reds), and the generator names the file and carries
  // no `MIN_COMMITS = <digits>` literal of its own (a re-hardcoded copy reds).
  it('MIN_COMMITS is read from scripts/timeline-config.json by both readers', () => {
    const root = process.cwd();
    const config = JSON.parse(readFileSync(join(root, 'scripts', 'timeline-config.json'), 'utf8'));
    expect(config.minCommits).toBeGreaterThan(0);
    expect(MIN_COMMITS).toBe(config.minCommits);

    const script = readFileSync(join(root, 'scripts', 'timeline-from-git.py'), 'utf8');
    expect(script).toMatch(/timeline-config\.json/);
    expect(script).not.toMatch(/^MIN_COMMITS\s*=\s*\d/m);
  });
});

// The GENERATOR's config, not the site's: `scripts/repos.json` is the explicit
// allowlist that replaced the `~/projects` directory scan, so it -- not whatever
// happens to sit in that directory -- decides which repos reach the spine. These
// assert the two ways that file can be wrong: a row in `timeline.json` no repo
// in the list can account for (the list and the generated spine disagree), and a
// duplicated entry (two dirs, one row, silently). `REPO_GROUPS` is parsed out of
// the generator with a regex: vitest has no Python resolution, and a hand-copied
// mirror is the drift this repo keeps deleting.
describe('generator allowlist (scripts/repos.json)', () => {
  const root = process.cwd();
  const allow: string[] = JSON.parse(
    readFileSync(join(root, 'scripts', 'repos.json'), 'utf8'),
  ).repos;
  const script = readFileSync(join(root, 'scripts', 'timeline-from-git.py'), 'utf8');

  // `REPO_GROUPS = { "dewpoint": ["dewpoint-app", "dewpoint-ts"] }` -> row name => member dirs.
  const groupsBlock = script.match(/^REPO_GROUPS = \{([\s\S]*?)^\}/m);
  const groups = new Map<string, string[]>();
  for (const line of (groupsBlock?.[1] ?? '').split('\n')) {
    const m = line.match(/^\s*"([^"]+)":\s*\[([^\]]*)\]/);
    if (m) groups.set(m[1]!, [...m[2]!.matchAll(/"([^"]+)"/g)].map((x) => x[1]!));
  }

  it('parses REPO_GROUPS out of the generator', () => {
    expect(groupsBlock, 'no REPO_GROUPS block in timeline-from-git.py').not.toBeNull();
    expect(groups.get('dewpoint')).toEqual(['dewpoint-app', 'dewpoint-ts']);
  });

  it('lists a directory for every row in timeline.json', () => {
    const listed = new Set(allow);
    for (const row of rows) {
      const dirs = groups.get(row.repo) ?? [row.repo];
      for (const dir of dirs) {
        expect(listed.has(dir), `${dir} (row ${row.repo}) missing from scripts/repos.json`).toBe(true);
      }
    }
  });

  it('names each directory exactly once', () => {
    expect([...new Set(allow)]).toHaveLength(allow.length);
  });
});
