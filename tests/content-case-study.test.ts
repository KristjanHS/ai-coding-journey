import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CONTENT, contentFiles, frontmatter, read } from './helpers';

// (d) Provenance: every case-study artifact names the relative path or commit it
// was rewritten from. This is the executable form of the `content/case-study/
// crash-dash/**` admission row ("each with its origin path and date"). It lives
// here rather than in the Zod schema because `index.md` is the landing body, not
// an artifact, and carries no origin -- an always-required schema key would red
// on it. The population assertion is not decoration: without it a rename of the
// directory would empty ARTIFACTS and the guard would pass over nothing.
const CASE_STUDY = join(CONTENT, 'case-study', 'crash-dash');

// The landing body, excluded by exact path rather than by filename: a nested
// `<sub>/index.md` would still be a real artifact with its own route, and an
// `endsWith('index.md')` test would drop it from the check while the route
// shipped it.
const LANDING = join(CASE_STUDY, 'index.md');
const ARTIFACTS = contentFiles(CASE_STUDY).filter((path) => path !== LANDING);

// The admission row says "each with its origin path AND date", so both halves
// are asserted -- an `origin`-only guard leaves a missing `date` green in every
// gate (Zod has it optional so index.md can omit it).
describe('case-study provenance', () => {
  it('there are artifacts to check', () => {
    expect(ARTIFACTS.length, `no artifacts found under ${CASE_STUDY}`).toBeGreaterThan(0);
  });

  it.each(ARTIFACTS)('%s: carries `origin` and `date` frontmatter', (path) => {
    const body = read(path);

    const origin = frontmatter(body, 'origin');
    expect(origin, `${path}: no \`origin:\` in frontmatter`).toBeDefined();
    expect(origin, `${path}: empty \`origin:\``).not.toBe('');

    const date = frontmatter(body, 'date');
    expect(date, `${path}: no \`date:\` in frontmatter`).toBeDefined();
    expect(date, `${path}: \`date:\` is not an ISO day`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
