import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// inc7 Stage 4 falsifier. A chapter page inlines the atoms mined for it
// (`source_chapter`), so the same markdown reaches two surfaces: GitHub follows
// the `## Atoms` relative `.md` links, the site renders the atom bodies in place.
// Two ways that goes wrong and neither shows in a green build — the body renders
// TWICE (the link list plus the transclusion both expanding), or the filter is
// dropped and every chapter transcludes every atom. Both are counted here.
//
// `make check` runs `astro build` before vitest, so a missing file is a real
// failure and not a reason to skip — a skipped falsifier is a green gate that
// checked nothing.
const page = (slug: string) => join(process.cwd(), 'dist', 'journey', slug, 'index.html');
const read = (slug: string) => (existsSync(page(slug)) ? readFileSync(page(slug), 'utf8') : null);

// `02-kri-local-rag` owns two atoms; `03-dewpoint` owns none. The pair is what
// makes the filter falsifiable: an unfiltered query passes every assertion about
// the first chapter and only ever reds on the second.
const WITH_ATOMS = read('02-kri-local-rag');
const WITHOUT_ATOMS = read('03-dewpoint');

// A sentence that exists in exactly one file in `content/` (the atom itself), so
// counting it in the built chapter counts transclusions and nothing else.
const ATOM_SENTENCE = 'only the enumeration moved';
const occurrences = (haystack: string, needle: string) => haystack.split(needle).length - 1;

describe('a chapter transcludes the atoms mined for it', () => {
  it('built both chapter pages', () => {
    expect(WITH_ATOMS, `no built page at ${page('02-kri-local-rag')} — run \`make build\``,
    ).not.toBeNull();
    expect(WITHOUT_ATOMS, `no built page at ${page('03-dewpoint')} — run \`make build\``,
    ).not.toBeNull();
  });

  it('renders the atom body exactly once', () => {
    expect(occurrences(WITH_ATOMS ?? '', ATOM_SENTENCE)).toBe(1);
  });

  it('renders both of the chapter’s atoms, in rung order', () => {
    // Measured INSIDE the transcluded section, never over the whole page: the
    // chapter's own `## Atoms` link list carries both slugs earlier in the
    // document and in the same order, so a page-wide `indexOf` reports the list's
    // order and passes no matter how the transclusion is sorted. Reversing the
    // sort left that version green — this slice is what makes it red.
    const start = (WITH_ATOMS ?? '').indexOf('class="atoms');
    expect(start, 'no transcluded section on the page').toBeGreaterThan(-1);
    const section = (WITH_ATOMS ?? '').slice(start);
    const asking = section.indexOf('/atoms/asking--which-stack-gets-a-catalogue/');
    const planning = section.indexOf('/atoms/planning--proposals-not-edits/');
    expect(asking, 'the asking-rung atom is not transcluded').toBeGreaterThan(-1);
    expect(planning, 'the planning-rung atom is not transcluded').toBeGreaterThan(-1);
    // `asking` precedes `planning` in RUNGS; alphabetical file order agrees here,
    // so the discriminating mutation is reversing the comparator, not removing it.
    expect(asking).toBeLessThan(planning);
  });

  it('transcludes nothing into a chapter that owns no atom', () => {
    // The filter's only falsifier: drop `source_chapter` from the query and this
    // is the assertion that reds.
    expect(WITHOUT_ATOMS ?? '').not.toContain(ATOM_SENTENCE);
    expect(WITHOUT_ATOMS ?? '').not.toContain('class="atoms');
  });

  it('rewrites the chapter’s own `## Atoms` links to site routes', () => {
    // The GitHub form is `../atoms/<slug>.md`; md-links must have turned it into a
    // route by build time, or the site ships a link to a raw markdown path.
    expect(WITH_ATOMS ?? '').not.toContain('../atoms/');
    expect(WITH_ATOMS ?? '').toContain('href="/atoms/planning--proposals-not-edits/"');
  });
});
