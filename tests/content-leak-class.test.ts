import { describe, expect, it } from 'vitest';

import { CONTENT_FILES, read } from './helpers';

// inc5c Stage 3a -- the corpus leak class. The ChatGPT exports under sources/
// are gitignored, but their contents reach content/ by hand, and three kinds of
// string must never make that trip: a live thread URL (a `chatgpt.com/c/<uuid>`
// address, plus the `/g/g-p-<id>/` segment that project-folder threads carry),
// a machine or account fingerprint, and a credential shape.
//
// Kept deliberately OUT of `BANNED` (src/lib/content-rules.ts). That list is checked against
// `.claude/rules/content-writing.md` §Anti-hype by the drift guard, so folding
// these in would (a) couple a leak guard to a vocabulary rule and (b) publish
// each pattern in the same breath as `10x` and `magic`. Separate assertion,
// separate failure message.
//
// The literals below (`DESKTOP-26A9125`, the `/home/kristjans` path, the GCP
// project id) are already in this public repo -- `docs/sources-chatgpt-
// conversations2.md` §Sanitisation names all three as the fingerprints it found
// -- so restating them here discloses nothing new. Every other sample is
// fabricated.
//
// The 32 GB VRAM row is a wider bar than "fingerprint": the user ruled that box
// employer-side hardware, so publishing a second ceiling with no personal-
// hardware explanation is itself the disclosure. The 8 GB home ceiling is
// published and stays -- these patterns must not touch it.
const LEAKS: { name: string; pattern: RegExp; sample: string }[] = [
  {
    name: 'live ChatGPT thread URL',
    pattern: /chatgpt\.com\/c\/[0-9a-f]{8}/i,
    sample: 'https://chatgpt.com/c/0badc0de-1111-2222-3333-444455556666',
  },
  {
    name: 'ChatGPT project id',
    pattern: /\/g\/g-p-[0-9a-z]{8}/i,
    sample: 'https://chatgpt.com/g/g-p-0badc0de1111/project',
  },
  {
    name: 'Windows hostname',
    pattern: /DESKTOP-[0-9A-Z]{7}\b/,
    sample: 'DESKTOP-26A9125',
  },
  {
    name: 'WSL home path',
    pattern: /\/home\/kristjans(\/|\b)/i,
    sample: '/home/kristjans/projects/ai-coding-journey',
  },
  {
    name: 'Windows user path',
    pattern: /C:\\Users\\Kristjan/i,
    sample: 'C:\\Users\\Kristjan\\Downloads',
  },
  {
    name: 'GCP project id',
    pattern: /speech2text-\d{6}/i,
    sample: 'speech2text-218910',
  },
  {
    name: 'Hugging Face token',
    pattern: /\bhf_[A-Za-z0-9]{16,}/,
    sample: 'hf_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  {
    name: 'OpenAI-style key',
    pattern: /\bsk-[A-Za-z0-9]{20,}/,
    sample: 'sk-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  {
    name: 'GitHub token',
    pattern: /\bghp_[A-Za-z0-9]{20,}/,
    sample: 'ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  {
    name: 'AWS access key id',
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
    sample: 'AKIAAAAAAAAAAAAAAAAA',
  },
  {
    name: 'office-server VRAM ceiling',
    pattern: /\b32\s*GB\b[^.\n]{0,40}\bVRAM\b/i,
    sample: 'the 32 GB VRAM box',
  },
  {
    name: 'office-server VRAM ceiling (reversed)',
    pattern: /\bVRAM\b[^.\n]{0,40}\b32\s*GB\b/i,
    sample: 'VRAM ceiling of 32 GB',
  },
];

describe('corpus leak class', () => {
  // Premise guard. A leak pattern that cannot match anything passes over every
  // content file forever and reads as proof. Each entry carries a sample of the
  // exact shape it exists to catch; a pattern that stops matching its own sample
  // reds HERE, loudly, instead of going quietly unenforced.
  it.each(LEAKS)('$name: the pattern matches its own sample', ({ pattern, sample }) => {
    expect(pattern.test(sample)).toBe(true);
  });

  // ...and the published 8 GB home ceiling must survive both VRAM patterns --
  // a guard that reds on the figure the journey is built around is unshippable.
  it('the published 8 GB home ceiling is not a leak', () => {
    const published = 'The 8 GB VRAM ceiling capped the model shortlist; VRAM was 8 GB.';
    const hits = LEAKS.filter((leak) => leak.pattern.test(published)).map((leak) => leak.name);
    expect(hits).toEqual([]);
  });

  it.each(CONTENT_FILES)('%s: leaks nothing from the corpus', (path) => {
    const body = read(path);
    const hits = LEAKS.filter((leak) => leak.pattern.test(body)).map((leak) => leak.name);
    expect(hits, `${path}: corpus leak`).toEqual([]);
  });
});
