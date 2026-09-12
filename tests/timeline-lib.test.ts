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
  chapters,
  experiments,
  isChapter,
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
    expect(COMMIT_DOMAIN).toEqual([11, 5185]);
  });

  it('pins the time domain to the current corpus', () => {
    expect(TIME_DOMAIN[0]).toBe('2025-06-19');
    expect(TIME_DOMAIN[1]).toBe('2026-09-12');
  });

  it('reads the full 14-row corpus', () => {
    expect(rows).toHaveLength(14);
  });
});

describe('experiments', () => {
  it('holds exactly the rows that earn no chapter, oldest first', () => {
    expect(experiments.length).toBeGreaterThan(0);
    expect(experiments.every((row) => !isChapter(row))).toBe(true);
    expect(rows.filter((row) => !isChapter(row))).toHaveLength(experiments.length);

    const dates = experiments.map((row) => row.first_commit);
    expect([...dates].sort()).toEqual(dates);
  });

  // The inc-era-labels ruling: a repo whose first and last commit fall on the
  // same date is a spike, not a project -- it gets a line, never a chapter and
  // never a bar. Pinned by NAME as well as by the predicate, so a regen that
  // quietly re-promoted one (or a predicate rewritten to `>=` on the dates)
  // reds with the repo in the message.
  it('demotes every one-day repo, whatever its commit count', () => {
    const oneDay = rows.filter((row) => row.last_commit === row.first_commit);
    expect(oneDay.map((row) => row.repo)).toEqual([
      'docs-generator',
      'xls-analyser',
      'gitlab-standup',
    ]);
    for (const row of oneDay) {
      expect(isChapter(row), `${row.repo} lived one day and still claims a chapter`).toBe(false);
      expect(chapters.map((c) => c.repo)).not.toContain(row.repo);
      expect(experiments.map((c) => c.repo)).toContain(row.repo);
    }
    // Vacuity anchor: two of the three clear MIN_COMMITS, so the assertion above
    // is carried by the span test and not by the commit floor that predates it.
    expect(oneDay.filter((row) => row.commits >= MIN_COMMITS)).toHaveLength(2);
  });

  it('splits every row into exactly one of chapters or experiments', () => {
    expect(chapters.length + experiments.length).toBe(rows.length);
    expect(chapters.length).toBeGreaterThan(0);
  });

  // The predicate has TWO readers -- this lib and scripts/timeline-from-git.py.
  // A hand-copied Python rule that drifts is the failure this catches: the
  // generator's own admission test is parsed out and pinned to name both halves.
  it('the generator carries the same admission rule', () => {
    const script = readFileSync(join(process.cwd(), 'scripts', 'timeline-from-git.py'), 'utf8');
    const body = script.match(/^def is_chapter\(row: dict\) -> bool:[\s\S]*?\n    return ([^\n]+)/m);
    expect(body, 'no is_chapter() in timeline-from-git.py').not.toBeNull();
    expect(body![1]).toContain('row["commits"] >= MIN_COMMITS');
    expect(body![1]).toContain('row["last_commit"] > row["first_commit"]');
    // And it is the rule main() actually splits on, not a dead helper.
    expect(script).toMatch(/big = \[r for r in rows if is_chapter\(r\)\]/);
    expect(script).toMatch(/small = \[r for r in rows if not is_chapter\(r\)\]/);
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
    // The positive match anchors on the READ, not any mention (a comment names
    // the file too); the negative one admits the annotated `MIN_COMMITS: int = 5`.
    expect(script).toMatch(/^MIN_COMMITS[^=\n]*=\s*json\.loads\([^\n]*timeline-config\.json/m);
    expect(script).not.toMatch(/^MIN_COMMITS(\s*:\s*\w+)?\s*=\s*\d/m);
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
