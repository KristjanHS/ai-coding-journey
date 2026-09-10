import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// ─── Standing ruling: NO deck-reachability test belongs in this file ───────────
// It is the one place a later session would naturally add "assert every atom is
// reachable from a deck", so the must-not is recorded where that session will
// read it. Do not add such a check. An atom is reachable through facets that are
// queried at render time, and a negative — "no atom is stranded" — is not
// falsifiable by a suite: it can only be satisfied by enumerating the very query
// it claims to be independent of, which pins the query against itself. Reach is
// a live-confirm item (walk the routes), never an assertion. There is deliberately
// no test implementing this paragraph.
// ──────────────────────────────────────────────────────────────────────────────

// inc7 Stage 4: the slide-overflow budget, REPOINTED from `deck: true` chapter
// `##` sections onto atom FILES. An atom is the unit of instruction and the unit
// of a slide, so its whole body is one rendered frame — which is what the three
// ceilings measure now. They are unchanged from inc5b, where they were derived
// from the twelve sections of the three written chapters; the atom corpus sits
// well inside them (the tightest passer at the time of the repoint is 22 lines /
// 1231 chars, four lines of headroom). Known and accepted cost of the repoint:
// the seven `deck: true` chapters that `/deck` still renders carry no
// slide-overflow guard until 7c repoints the deck route onto a facet query.
// inc6's headless `scrollHeight <= clientHeight` check supersedes these numbers;
// a file that passes here yet still overflows there is evidence a ceiling sat too
// high and must drop.
const MAX_LINES = 26;
const MAX_CHARS = 1900;
const MAX_FENCES = 4;

// The counting convention is load-bearing, not cosmetic: an atom's body is
// everything AFTER the frontmatter, leading and trailing blank lines stripped.
// Interior blanks ARE counted — they cost vertical space on a slide. The
// frontmatter is never counted: it is eight to ten lines of facets that render as
// a meta block, not as slide body. Counting it instead puts every atom in the
// corpus over the line ceiling, which is what the convention pin below asserts.
const ATOMS = join(process.cwd(), 'content', 'atoms');

const atomFiles = readdirSync(ATOMS)
  .filter((f) => f.endsWith('.md'))
  .sort();

interface Atom {
  file: string;
  lines: number;
  chars: number;
  fences: number;
  /** Every line of the raw file, frontmatter included and blanks unstripped — the
      LOOSE convention, carried so the convention pin can compute it rather than
      offset it by a hand-written constant that would rot as frontmatter grows. */
  looseLines: number;
}

const frontmatter = (text: string) => /^---\n([\s\S]*?\n)---\n/.exec(text);

const measure = (file: string): Atom => {
  const text = readFileSync(join(ATOMS, file), 'utf8');
  const fm = frontmatter(text);
  const lines = (fm ? text.slice(fm[0].length) : text).split('\n');
  let a = 0;
  let b = lines.length;
  while (a < b && lines[a].trim() === '') a += 1;
  while (b > a && lines[b - 1].trim() === '') b -= 1;
  const kept = lines.slice(a, b);
  return {
    file,
    lines: kept.length,
    chars: kept.join('\n').length,
    fences: kept.filter((l) => /^\s*```/.test(l)).length >> 1,
    looseLines: text.split('\n').length,
  };
};

const atoms = atomFiles.map(measure);

// Anchored on the CORPUS the walker read and on the PARSER's output, never on the
// population the ceilings reject: that population is empty whenever the budget is
// being honoured, so asserting it non-empty would red the gate exactly when the
// content is correct.
describe('vacuity anchors', () => {
  it('walked every atom file', () => {
    expect(atomFiles.length).toBeGreaterThanOrEqual(6);
    expect(atomFiles).toContain('planning--proposals-not-edits.md');
  });

  it('strips frontmatter and keeps the atom body', () => {
    const text = readFileSync(join(ATOMS, 'planning--proposals-not-edits.md'), 'utf8');
    const fm = frontmatter(text);
    expect(fm, 'the known atom lost its frontmatter').not.toBeNull();
    const body = text.slice(fm![0].length);
    // A parser that returned the whole file would satisfy the headings alone, so
    // the discriminating assertion is that a frontmatter KEY is gone from the body.
    expect(body).toContain('# Ask for proposals, not edits');
    expect(body).toContain('## Evidence');
    expect(body).not.toContain('source_chapter:');
    expect(atoms.every((s) => s.lines > 0 && s.chars > 0)).toBe(true);
  });

  it('pins the counting convention against the loose one', () => {
    // Under this convention the corpus's tightest passer sits under the ceiling;
    // counting the frontmatter and the trailing blank puts every atom over it. So
    // the two conventions genuinely disagree about the corpus, and asserting the
    // disagreement is what makes the ceilings above mean anything. `looseLines` is
    // computed, not offset by a hand-written constant: an offset would silently
    // stop discriminating as the frontmatter grew or shrank.
    const tightest = atoms.reduce((a, b) => (b.lines > a.lines ? b : a));
    expect(tightest.lines).toBeLessThanOrEqual(MAX_LINES);
    expect(tightest.looseLines).toBeGreaterThan(MAX_LINES);
  });
});

describe('slide-overflow budget for atoms', () => {
  it('keeps every atom within the line ceiling', () => {
    for (const s of atoms) {
      expect(s.lines, `${s.file} is ${s.lines} lines`).toBeLessThanOrEqual(MAX_LINES);
    }
  });

  it('keeps every atom within the character ceiling', () => {
    for (const s of atoms) {
      expect(s.chars, `${s.file} is ${s.chars} chars`).toBeLessThanOrEqual(MAX_CHARS);
    }
  });

  it('keeps every atom within the fenced-block ceiling', () => {
    for (const s of atoms) {
      expect(s.fences, `${s.file} has ${s.fences} fenced blocks`).toBeLessThanOrEqual(MAX_FENCES);
    }
  });
});
