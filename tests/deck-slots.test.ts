// inc7c Stage 1 — the deck's running order is data, and three things about it
// have to stay true or the deck route silently drops content:
//   (1) every atom's `slot` is a declared slot, and the schema's SLOTS tuple
//       equals deck.json's slot ids IN ORDER (the route groups by that order);
//   (2) every `fallback` names a real `deck: true` chapter, or is null;
//   (3) the running order still sums to the lecture's 90 minutes.
// SLOTS and deck.json are deliberately two sources — z.enum needs a literal
// tuple — so this file is the only thing preventing them from drifting apart.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ATOMS, CHAPTERS, configEnum, frontmatter, read } from './helpers';

type Slot = { id: string; title: string; minutes: number; fallback: string | null };

const deck = JSON.parse(readFileSync(join('content', 'deck.json'), 'utf8')) as {
  slots: Slot[];
};

/** The ids of the chapters flagged `deck: true`, by filename stem (the Astro id). */
function deckChapterIds(): string[] {
  return CHAPTERS.filter((path) => frontmatter(read(path), 'deck') === 'true').map((path) =>
    path.split('/').pop()!.replace(/\.md$/, ''),
  );
}

describe('deck slots', () => {
  it('every atom sits in a declared slot, and SLOTS mirrors deck.json in order', () => {
    const declared = configEnum('SLOTS');
    expect(declared).toEqual(deck.slots.map((slot) => slot.id));

    for (const path of ATOMS) {
      const slot = frontmatter(read(path), 'slot');
      expect(declared, `${path}: slot '${slot}' is not a declared slot`).toContain(slot);
    }
  });

  it('slot ids are unique and every fallback is null or a deck chapter', () => {
    const ids = deck.slots.map((slot) => slot.id);
    expect(new Set(ids).size).toBe(ids.length);

    const deckChapters = deckChapterIds();
    expect(deckChapters.length, 'no deck: true chapters — the check cannot establish').toBeGreaterThan(0);
    for (const slot of deck.slots) {
      if (slot.fallback === null) continue;
      expect(deckChapters, `slot '${slot.id}': fallback '${slot.fallback}' is not a deck chapter`).toContain(
        slot.fallback,
      );
    }
  });

  it('the running order sums to 90 minutes', () => {
    expect(deck.slots.reduce((total, slot) => total + slot.minutes, 0)).toBe(90);
  });
});
