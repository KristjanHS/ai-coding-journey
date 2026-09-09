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

  it('absolutises in-content site links instead of leaving them root-relative', () => {
    // `91-the-close.md` links `/course/skeleton/`; on a USB stick that path is dead,
    // so `Slides.astro` rewrites it against `site`. If the chapter ever stops linking
    // out, this assertion establishes nothing -- so it asserts the rewrite TARGET
    // exists, which only a real rewrite can produce.
    expect(built ?? '').toContain('href="https://ai-coding-journey-five.vercel.app/course/skeleton/"');
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
    const print = /@media print\s*\{([\s\S]*?)\n      \}/.exec(built ?? '');
    expect(print, 'no @media print block in the deck stylesheet').not.toBeNull();
    expect(print?.[1]).toMatch(/page-break-after:\s*always/);
    expect(print?.[1]).toMatch(/\.deck-nav\s*\{\s*display:\s*none/);
  });

  it('emits one slide per `##` plus a title slide per chapter', () => {
    const slides = [...(built ?? '').matchAll(/<section class="slide[^"]*"/g)].length;
    const titles = [...(built ?? '').matchAll(/<section class="slide slide-title"/g)].length;
    // Seven `deck: true` chapters today; each contributes its title slide plus at
    // least one `##` section, so slides must exceed titles or the split silently
    // collapsed to title cards.
    expect(titles).toBeGreaterThanOrEqual(7);
    expect(slides).toBeGreaterThan(titles);
  });
});
