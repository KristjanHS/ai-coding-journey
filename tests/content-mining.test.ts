import { describe, expect, it } from 'vitest';

import { ATOMS, contentFiles, frontmatter, read, section, SIDECARS, TOPIC_DIR } from './helpers';

// inc7b Stage 3a -- the mining falsifiers. Falsifier (a), one dated quote per
// atom, shipped in Stage 1 above. (b), (c) and (d) are here, each reshaped where
// the spec's premise did not hold; the reasons are in the plan's Stage 3 addendum.

const TOPICS = contentFiles(TOPIC_DIR);

/** A quoted `## Evidence` line as one comparable string: no `>`, no bracketed
 *  date, no wrapping quotes, whitespace collapsed. */
function quotedLine(evidence: string): string {
  return evidence
    .split('\n')
    .filter((line) => /^\s*>/.test(line))
    .map((line) => line.replace(/^\s*>\s?/, ''))
    .join(' ')
    .replace(/\[\d{4}-\d{2}(-\d{2})?(\.\.\d{4}-\d{2}(-\d{2})?)?\]/, '')
    .replace(/^\s*["“]|["”]\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const collapse = (body: string) => body.replace(/\s+/g, ' ');

// (b) Evidence-verbatim. `source_chapter` is the chapter an atom was MINED FOR
// -- Stage 4's transclusion key -- not where its quote came from, so it cannot
// be the target here. `quote_from` names the public in-repo file the line is
// reproduced from; an atom without one was quoted from a private source, is
// verified against the private index at authoring time, and is SKIPPED by name
// rather than passed silently.
describe('evidence provenance', () => {
  // The skip is honest -- it keys on the ABSENCE of `quote_from`, per atom, not on
  // a hand-maintained name list. But a corpus of skips is a corpus with no gate:
  // drop `quote_from` from every atom and every case below skips, the describe
  // passes green, and nothing is verified. This floor reds on that. It anchors on
  // the atoms the gate CHECKS, which publishing more quotes grows -- never on the
  // violations it finds, which a fix would drain to zero.
  it('at least one atom is actually verbatim-checked', () => {
    const checked = ATOMS.filter((path) => frontmatter(read(path), 'quote_from'));
    expect(
      checked.length,
      'every atom skips: no `quote_from` anywhere, so this gate verifies nothing',
    ).toBeGreaterThan(0);
  });

  for (const path of ATOMS) {
    const from = frontmatter(read(path), 'quote_from');
    const label = from
      ? `${path}: the quoted line is verbatim in ${from}`
      : `${path}: quoted from a private source -- verified against the private index, not here`;

    it.skipIf(!from)(label, () => {
      const evidence = section(read(path), 'Evidence');
      expect(evidence, `${path}: no \`## Evidence\` section`).toBeDefined();
      const quote = quotedLine(evidence!);
      expect(quote.length, `${path}: the quote is empty once the date is stripped`).toBeGreaterThan(
        20,
      );
      expect(
        collapse(read(from!)),
        `${path}: \`quote_from: ${from}\` does not contain the quoted line`,
      ).toContain(quote);
    });
  }
});

// (c) Mined material is translated, never pasted. Scoped to the corpus, not to
// all of content/**: `content/artifacts/agent-loop.md` reproduces Estonian
// prompt lines beside their glosses on purpose and says so in its own body, and
// an allowlist would be where every later exception went quietly.
describe('the mined corpus is in English', () => {
  const CORPUS = [...ATOMS, ...SIDECARS, ...TOPICS];
  // Estonian function words with no English reading, plus the four vowels that
  // exist in no English word. Two markers on one line, or one diacritic, is the
  // threshold -- a single shared token is not evidence of a language.
  const MARKERS = [
    'ja', 'ning', 'kui', 'siis', 'peale', 'teises', 'uus', 'mitte', 'kõik',
    'või', 'aga', 'oli', 'olen', 'teha', 'vaja', 'kopeerida', 'poolset',
  ];
  const marker = new RegExp(`(?<![A-Za-zÀ-ÿ])(${MARKERS.join('|')})(?![A-Za-zÀ-ÿ])`, 'gi');

  it('there is a corpus to sweep, and markers to sweep it with', () => {
    expect(CORPUS.length, 'no atoms, sidecars or topics found').toBeGreaterThan(0);
    expect(MARKERS.length).toBeGreaterThan(4);
  });

  it.each(CORPUS)('%s: carries no Estonian line', (path) => {
    const hits: string[] = [];
    read(path)
      .split('\n')
      .forEach((line, i) => {
        const distinct = new Set([...line.matchAll(marker)].map((m) => m[1].toLowerCase()));
        if (distinct.size >= 2 || /[õäöü]/i.test(line)) hits.push(`${i + 1}: ${[...distinct]}`);
      });
    expect(hits, `${path}: Estonian on line(s) ${hits.join('; ')}`).toEqual([]);
  });
});

// (d) The lecture is 90 minutes. The spec's 82..90 band is a corpus-COMPLETENESS
// property and cannot pass while the corpus is being built, so only the ceiling
// ships now; the >= 82 floor arms at the inc6b content freeze. The audience must
// be non-empty first, or the sum is trivially under any ceiling.
describe('the university cut fits the lecture', () => {
  const MINUTES_CEILING = 90;
  const cut = ATOMS.filter((path) => /\buniversity\b/.test(frontmatter(read(path), 'audience') ?? ''));

  it('the university audience is non-empty', () => {
    expect(cut.length, 'no atom carries `audience: [... university ...]`').toBeGreaterThan(0);
  });

  it(`the university cut runs at most ${MINUTES_CEILING} minutes`, () => {
    const total = cut.reduce((sum, path) => sum + Number(frontmatter(read(path), 'minutes')), 0);
    expect(Number.isFinite(total), 'an atom in the cut has a non-numeric `minutes`').toBe(true);
    expect(total, `the university cut sums to ${total} minutes`).toBeLessThanOrEqual(MINUTES_CEILING);
  });
});
