import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// inc5b: the slide-overflow budget. Each `##` section of a `deck: true` chapter is
// ONE rendered slide, so a section that outgrows a 1080p frame at projector-readable
// font is a layout bug the author cannot see in markdown. These three ceilings are
// this increment's AUTHORED DEFAULTS -- not a mirror of any other source -- derived
// from the 12 sections of the three written chapters: 10 of 12 already sit at <=24
// lines / <=1823 chars / <=2 fences, and the tightest passer (02 `What didn't work`,
// 24 lines / 1823 chars) has two lines of headroom. inc6's headless
// `scrollHeight <= clientHeight` check supersedes them; a section that passes here
// yet still overflows there is evidence a ceiling sat too high and must drop.
const MAX_LINES = 26;
const MAX_CHARS = 1900;
const MAX_FENCES = 4;

// The counting convention is load-bearing, not cosmetic: a section body is everything
// AFTER the `##` heading line up to the next `##`, frontmatter excluded, leading and
// trailing blank lines stripped. The heading itself is never counted. Counting the
// heading and the trailing blank instead adds 2 lines to every section and flips
// `02`'s `What didn't work` from passing to breaching -- so the numbers above only
// mean anything under this convention. Interior blanks ARE counted: they cost
// vertical space on a slide.
const JOURNEY = join(process.cwd(), 'content', 'journey');

// README.md is the generated index and 00-experiments.md the sub-5-commit round-up;
// neither carries frontmatter, matching the Zod loader's own exclusions.
const chapterFiles = readdirSync(JOURNEY)
  .filter((f) => /^\d\d-.+\.md$/.test(f) && f !== '00-experiments.md')
  .sort();

interface Section {
  file: string;
  heading: string;
  lines: number;
  chars: number;
  fences: number;
  /** Heading line + every raw body line, blanks unstripped — the LOOSE convention,
      carried only so the convention pin below can compute it instead of deriving it
      from an offset that would rot if the trailing-blank count changed. */
  looseLines: number;
}

const frontmatter = (text: string) => /^---\n([\s\S]*?\n)---\n/.exec(text);

const sections = (file: string): Section[] => {
  const text = readFileSync(join(JOURNEY, file), 'utf8');
  const fm = frontmatter(text);
  const body = fm ? text.slice(fm[0].length) : text;

  const out: Section[] = [];
  let heading: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (heading === null) return;
    // Strip leading/trailing blanks; keep interior ones.
    let a = 0;
    let b = buf.length;
    while (a < b && buf[a].trim() === '') a += 1;
    while (b > a && buf[b - 1].trim() === '') b -= 1;
    const kept = buf.slice(a, b);
    out.push({
      file,
      heading,
      lines: kept.length,
      chars: kept.join('\n').length,
      fences: kept.filter((l) => /^\s*```/.test(l)).length >> 1,
      looseLines: buf.length + 1,
    });
  };
  for (const line of body.split('\n')) {
    if (line.startsWith('## ')) {
      flush();
      heading = line.slice(3).trim();
      buf = [];
    } else if (heading !== null) {
      buf.push(line);
    }
  }
  flush();
  return out;
};

const isDeck = (file: string) => {
  const fm = frontmatter(readFileSync(join(JOURNEY, file), 'utf8'));
  return fm !== null && /^deck: *true *$/m.test(fm[1]);
};

const deckSections = chapterFiles.filter(isDeck).flatMap(sections);

// Anchored on the CORPUS the walker read, never on the deck population it measures:
// that population is empty at the stage this test ships and grows one chapter per
// slice, so `deckSections.length > 0` would red the gate before any chapter carries
// the flag. A broken walker or parser collapses these anchors instead.
describe('vacuity anchors', () => {
  it('walked every journey chapter file', () => {
    expect(chapterFiles.length).toBeGreaterThanOrEqual(13);
    expect(chapterFiles).toContain('01-hands-on-llm.md');
  });

  it('splits a known written chapter into its four canonical sections', () => {
    const found = sections('01-hands-on-llm.md');
    expect(found.map((s) => s.heading)).toEqual([
      'What I was trying to do',
      "What didn't work",
      'What I learned',
      'Artifact',
    ]);
    // A parser that returned empty bodies would satisfy the headings alone.
    expect(found.every((s) => s.lines > 0 && s.chars > 0)).toBe(true);
  });

  it('pins the counting convention against the loose one', () => {
    // Under this convention `02`'s tightest section is 24 lines, two under the
    // ceiling; counting the heading and its trailing blanks puts it at 27 — over.
    // So the two conventions genuinely disagree about the corpus, and asserting the
    // disagreement is what makes the ceilings above mean anything. `looseLines` is
    // computed, not offset by a hand-written +2: an offset would silently stop
    // discriminating if the section's trailing-blank count ever changed.
    const tightest = sections('02-kri-local-rag.md').find((s) => s.heading === "What didn't work");
    expect(tightest, 'the tightest passer moved or was renamed').toBeDefined();
    expect(tightest!.lines).toBeLessThanOrEqual(MAX_LINES);
    expect(tightest!.looseLines).toBeGreaterThan(MAX_LINES);
  });
});

describe('slide-overflow budget for deck chapters', () => {
  it('keeps every section within the line ceiling', () => {
    for (const s of deckSections) {
      expect(s.lines, `${s.file} § ${s.heading} is ${s.lines} lines`).toBeLessThanOrEqual(MAX_LINES);
    }
  });

  it('keeps every section within the character ceiling', () => {
    for (const s of deckSections) {
      expect(s.chars, `${s.file} § ${s.heading} is ${s.chars} chars`).toBeLessThanOrEqual(MAX_CHARS);
    }
  });

  it('keeps every section within the fenced-block ceiling', () => {
    for (const s of deckSections) {
      expect(s.fences, `${s.file} § ${s.heading} has ${s.fences} fenced blocks`).toBeLessThanOrEqual(
        MAX_FENCES,
      );
    }
  });
});
