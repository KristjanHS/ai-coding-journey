import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import history from '../content/measurements/data/instruction-history.json';
import { readMeas } from './helpers';

// S5b, live HEAD (ruled 2026-09-11): a regen that moves a figure reds here until the
// narrative and every atom quoting it carry the value the JSON derives.
const NARRATIVE = '06-instruction-history.md';
const ATOM = (slug: string) => join('content', 'atoms', `${slug}.md`);
const collapse = (body: string) => body.replace(/\s+/g, ' ');

const series = history.globalClaudeMd.series;
const [first, last] = [series[0], series[series.length - 1]];
const peak = series.reduce((a, b) => (b.lines > a.lines ? b : a));
const cls = (name: string) => history.classes.find((c) => c.class === name)!;
const [cursor, claude] = [cls('.cursor/rules/'), cls('CLAUDE.md')];
const sweep = history.fleetSweeps.days.reduce((a, b) => (b.repos > a.repos ? b : a));

const CURVE = `The global CLAUDE.md measured ${first.lines} lines on ${first.date}, peaked at ${peak.lines} lines on ${peak.date}, and was cut back to ${last.lines} lines by ${last.date}.`;
const FIRSTS = `The first \`.cursor/rules/\` file was committed on ${cursor.first} in ${cursor.repo}; the first \`CLAUDE.md\` followed on ${claude.first} in ${claude.repo}.`;
const SWEEP = `On ${sweep.date}, instruction files changed in ${sweep.repos} of the ${history.repos} repos on the same day.`;

const PINS: [string, string][] = [
  [NARRATIVE, CURVE],
  [NARRATIVE, FIRSTS],
  [NARRATIVE, SWEEP],
  [NARRATIVE, `${history.classes.length} classes of instruction file appear across the ${history.repos} repos.`],
  [NARRATIVE, `Days reaching the ${history.fleetSweeps.minRepos}-repo threshold: ${history.fleetSweeps.days.length}.`],
  [ATOM('governing--the-global-file-was-cut-back'), CURVE],
  [ATOM('governing--one-control-reached-the-fleet-in-a-day'), SWEEP],
  [ATOM('configuring--rules-were-versioned-before-claude-code'), FIRSTS],
];

const body = (file: string) => collapse(file === NARRATIVE ? readMeas(file) : readFileSync(file, 'utf8'));

describe('instruction-history narrative + atoms ↔ JSON mirror', () => {
  it.each(PINS)('%s prints the figure exactly as the JSON derives it', (file, text) => {
    expect(body(file), `${file}: missing derived text: ${text}`).toContain(text);
  });

  it('says "cut back" only while the latest count is below the peak', () => {
    expect(last.lines).toBeLessThan(peak.lines);
  });

  it('says CLAUDE.md "followed" only while the first Cursor rule is older', () => {
    expect(cursor.first < claude.first).toBe(true);
  });
});
