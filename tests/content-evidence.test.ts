import { describe, expect, it } from 'vitest';

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { CHAPTERS, frontmatter, read, section } from './helpers';

describe('evidence rule', () => {
  // (a) The frontmatter enum and the prose must agree. `present` claims an
  // artifact block, so the section body must carry one; `pending` is the stub
  // state timeline-from-git.py emits — heading, nothing under it. Checking only
  // that the heading exists would be vacuous (every chapter has one).
  it.each(CHAPTERS)('%s: artifact frontmatter matches the Artifact body', (path) => {
    const body = read(path);
    const declared = frontmatter(body, 'artifact');
    // The enum is also the Zod schema's, and `astro build` runs before vitest in
    // `make check` — but assert it here too so `make test` stands on its own and
    // a typo cannot fall through to the `pending` branch below.
    expect([`present`, `pending`], `${path}: \`artifact: ${declared}\``).toContain(declared);

    const artifact = section(body, 'Artifact');
    expect(artifact, `${path}: no \`## Artifact\` heading`).toBeDefined();

    if (declared === 'present') {
      expect(artifact, `${path}: \`artifact: present\` but the section is empty`).not.toBe('');
    } else {
      expect(artifact, `${path}: \`artifact: ${declared}\` but the section has a body`).toBe('');
    }
  });
});

// The context ledger (2026-09-08 reframe, plan §9 item 1). Five enumerated
// fields per chapter; `astro build` already rejects a value outside its Zod
// enum, so what is left to assert is the tie between a ledger CLAIM and the
// evidence the chapter shows for it.
//
// inc5g reinstates the STRICT reading, which decision §5 had deliberately
// rejected so the stub chapters could get their ledger before their prose. That
// concession expired the day the `/journey/` comparison table shipped: the table
// is the reframe's proof, and 7 of its 13 rows were drawing five enumerated
// claims from 53-word stubs with an empty `## Artifact`. The seven stubs gave up
// their ledger keys instead (inc5g); a chapter earns them back by writing the
// artifact first, which is the drafting order this gate now enforces.
//
// The chain is three links, and each one is a separate way to fail:
//   1. a ledger key is filled            -- the chapter makes a claim
//   2. the `## Artifact` body is non-empty -- it offers evidence for it
//   3. that body links an atom whose `## Evidence` carries the dated quote -- the
//      evidence is SHOWN once, in `content/atoms/`, never re-fenced in the chapter
// Link 3 is what stops a paragraph *about* an artifact from passing as one.
const LEDGER_KEYS = ['could_see', 'retrieved', 'versioned', 'verified_by', 'cost_to_look'];

/** A fenced block or a blockquote in the chapter: evidence authored twice (chapter + atom), which link 3 refuses. */
const SHOWS_ARTIFACT = /^(?:```|>)/m;

// Link 3 (arm A): `## Artifact` = one framing sentence + a relative link to the atom whose
// `## Evidence` carries the dated blockquote; the gate follows the link and refuses inline evidence.
const ATOM_LINK = /\]\((\.\.\/atoms\/[^)\s]+\.md)\)/g;
const DATED_QUOTE = /^>.*\[\d{4}-\d{2}(-\d{2})?(\.\.\d{4}-\d{2}(-\d{2})?)?\]/m;

/** The `content/atoms/` files a chapter's Artifact section links, chapter-relative. */
function linkedAtoms(chapterPath: string, artifact: string): string[] {
  return [...artifact.matchAll(ATOM_LINK)].map((m) => join(dirname(chapterPath), m[1]));
}

describe('context ledger', () => {
  it.each(CHAPTERS)('%s: a chapter carrying a ledger shows its artifact', (path) => {
    const body = read(path);
    const filled = LEDGER_KEYS.filter((key) => frontmatter(body, key) !== undefined);
    // A chapter with no repo to read a ledger off can still CLAIM an artifact in
    // frontmatter (90, 91); `artifact: present` is the same claim link 3 exists to
    // check, so it enters the block on the same footing as a filled ledger key.
    const claim =
      filled.length > 0 ? `ledger keys ${filled.join(', ')}` : '`artifact: present`';
    if (filled.length === 0 && frontmatter(body, 'artifact') !== 'present') return;

    const artifact = section(body, 'Artifact');
    expect(
      artifact,
      `${path}: ${claim} claimed, but the Artifact section is empty`,
    ).not.toBe('');

    expect(
      artifact,
      `${path}: the Artifact section fences or quotes evidence inline -- author it once, in the atom it links`,
    ).not.toMatch(SHOWS_ARTIFACT);

    const atoms = linkedAtoms(path, artifact!);
    expect(
      atoms,
      `${path}: ${claim} claimed, but the Artifact section only ` +
        `describes the evidence -- it must link the atom that shows it`,
    ).not.toEqual([]);
    for (const atom of atoms) {
      expect(existsSync(atom), `${path}: Artifact links ${atom}, which does not exist`).toBe(true);
      const evidence = section(read(atom), 'Evidence');
      expect(
        evidence,
        `${path}: Artifact links ${atom}, whose \`## Evidence\` has no dated blockquote`,
      ).toMatch(DATED_QUOTE);
    }
  });

  // Vacuity anchor. A chapter with neither a filled ledger key nor `artifact:
  // present` returns before asserting anything, so a frontmatter parser that
  // silently stopped matching would drain the population on BOTH entry
  // conditions and leave the block above green over a row of no-ops. Anchor
  // on both sides of the count the drafting order moves: a collapse to zero is a
  // broken parser, and a ledger on every repo-backed chapter means the stubs got
  // theirs back without the artifact that is supposed to buy it.
  //
  // The upper bound is a SUBSET relation, deliberately not `carrying <
  // repoBacked`. A strict count inequality anchors on the population the work
  // drains -- the anti-pattern `testing-project.md` names -- so it would red the
  // day all 13 chapters legitimately carry a ledger WITH the artifact that buys
  // it, conflating a finished corpus with a stub sneaking its keys back. The
  // stub case is already link 2's job, per-chapter and with a better message.
  // What is left for the anchor is the containment link 2 cannot see: a ledger
  // on a chapter that has no repo to read one off.
  it('the ledger population is a subset of the repo-backed chapters', () => {
    const carries = (path: string) =>
      LEDGER_KEYS.some((key) => frontmatter(read(path), key) !== undefined);
    const carrying = CHAPTERS.filter(carries);
    const strays = CHAPTERS.filter(
      (path) => carries(path) && frontmatter(read(path), 'repo') === undefined,
    );

    expect(carrying.length, 'no chapter carries a ledger -- the parser is broken').toBeGreaterThan(0);
    expect(
      strays,
      'a chapter with no repo carries a ledger -- there is nothing to have read it off',
    ).toEqual([]);
  });
});
