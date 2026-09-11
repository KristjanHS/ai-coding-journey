import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// inc6 Stage 1 falsifier. The deck ships on a USB stick: `dist/deck/index.html` is
// opened by double-click, so every `/…`-rooted asset reference resolves to FILESYSTEM
// ROOT and silently vanishes -- the deck paints unstyled on a projector with no error
// anywhere. Astro emits exactly that for a bundled component <style>, so this file is
// the only thing standing between `src/layouts/Deck.astro` and an unstyled lecture.
//
// Red demo (2026-09-09): dropping `is:inline` from `Deck.astro` alone does NOT red this
// -- Astro's `build.inlineStylesheets: 'auto'' inlines a stylesheet under ~4 kB anyway,
// so a small deck stylesheet passes for the wrong reason. Padding the block past that
// threshold with a plain `<style>` emitted `href="/_astro/index.<hash>.css"` and red
// two assertions here; restoring `is:inline` at the SAME padded size kept it inline and
// green. That is the demonstration: the guarantee lives in `is:inline`, and this file
// catches the day someone removes it.
const DECK = join(process.cwd(), 'dist', 'deck', 'index.html');

const built = existsSync(DECK) ? readFileSync(DECK, 'utf8') : null;

// `make check` runs `astro build` before vitest, so a missing file is a real failure
// and not a reason to skip -- a skipped falsifier is a green lecture gate that
// checked nothing.
describe('the deck is self-contained under file://', () => {
  it('is built at all', () => {
    expect(built, `no built deck at ${DECK} — run \`make build\``).not.toBeNull();
  });

  it('references no root-absolute asset', () => {
    // `href="/journey/"` would break too, but only as a dead link, not an unstyled
    // deck; the assertion is deliberately over EVERY root-absolute reference so a
    // future nav link cannot quietly ship a URL the USB stick cannot resolve.
    const absolute = [...(built ?? '').matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]);
    expect(absolute).toEqual([]);
  });

  it('carries its stylesheet inline', () => {
    expect(built ?? '').toMatch(/<style[^>]*>/);
  });

  it('inlines a content/media image as a data URI, not an /_astro asset', () => {
    // The `live` slot's atom embeds `content/media/statusline.gif`. Astro would
    // rewrite that relative image to `/_astro/…`, which is root-absolute and dies
    // under `file://` (the assertion above would red on it). `src/md-links.mjs`
    // inlines it as a data URI instead; this reds the day that image reference is
    // dropped from the deck or the inlining regresses to an emitted asset.
    expect(built ?? '').toContain('src="data:image/gif;base64,');
  });

  it('absolutises in-content site links instead of leaving them root-relative', () => {
    // `91-the-close.md` links `/course/skeleton/`; on a USB stick that path is dead,
    // so `Slides.astro` rewrites it against `site`. If the chapter ever stops linking
    // out, this assertion establishes nothing -- so it asserts the rewrite TARGET
    // exists, which only a real rewrite can produce.
    expect(built ?? '').toContain('href="https://ai-coding-journey-five.vercel.app/course/skeleton/"');
  });

  it('gives each title slide exactly one h1', () => {
    // Every deck chapter opens with its own `# NN · title` heading, which lands in
    // the preamble alongside the frontmatter title Slides.astro emits -- two 4.2vw
    // headings stacked on all seven title cards. Measured 2026-09-09: dropping the
    // strip in Slides.astro takes this from 7 to 14.
    const h1s = [...(built ?? '').matchAll(/<h1\b/g)].length;
    const titles = [...(built ?? '').matchAll(/<section class="slide slide-title"/g)].length;
    expect(h1s).toBe(titles);
  });

  it('carries the keyboard nav inline rather than as a bundled module', () => {
    // A bundled `<script>` is emitted as `/_astro/*.js`; the absolute-reference test
    // above already reds on that, but only once Astro decides to bundle. This asserts
    // the handler itself survived into the document, so the deck cannot ship with the
    // chrome present and the keys dead.
    expect(built ?? '').toMatch(/addEventListener\('keydown'/);
    expect(built ?? '').toContain("'ArrowRight'");
    expect(built ?? '').toContain("'ArrowLeft'");
  });

  it('prints every slide, not just the current one', () => {
    // The handout and the misbehaving-browser fallback are the same artifact. Without
    // the print block the deck prints ONE page -- `.slide { display: none }` hides the
    // rest -- which is a silent failure discovered in the room.
    // Keyed on the block's CONTENT, never on its indentation: `is:inline` preserves
    // the source stylesheet verbatim, so a brace-matching regex would red on a pure
    // reformat of Deck.astro -- a failure for the wrong reason.
    const at = (built ?? '').indexOf('@media print');
    expect(at, 'no @media print block in the deck stylesheet').toBeGreaterThan(-1);
    const after = (built ?? '').slice(at);
    expect(after).toMatch(/page-break-after:\s*always/);
    expect(after).toMatch(/\.deck-nav\s*\{\s*display:\s*none/);
  });

  it('emits one slide per `##` plus a title slide per chapter', () => {
    const titles = [...(built ?? '').matchAll(/<section class="slide slide-title"/g)].length;
    expect(titles).toBeGreaterThanOrEqual(7);
    // Per chapter, not in aggregate: `slides > titles` passes while six of seven
    // chapters collapse to a bare title card, as long as one still splits. Cutting
    // the document at each title slide and requiring a body slide in every chunk
    // reds the moment ANY chapter stops splitting.
    const [, ...chapters] = (built ?? '').split('<section class="slide slide-title"');
    expect(chapters.length).toBe(titles);
    chapters.forEach((chunk, n) => {
      const bodies = [...chunk.matchAll(/<section class="slide"/g)].length;
      expect(bodies, `chapter ${n + 1} of ${titles} emitted no \`##\` slide`).toBeGreaterThan(0);
    });
  });
});
