import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { CONTENT_FILES, read } from './helpers';

// --- Protected terms -------------------------------------------------------
//
// Names that must never appear in `content/`: they resolve the journey to a
// specific employer and specific colleagues. The words are NOT in this repo --
// only the `sha256` of each, taken after the normalisation below.
//
// This is an ACCIDENTAL-INCLUSION check, not a secrecy mechanism. The digests
// are unsalted sha256 of short, low-entropy strings and the normaliser is
// public in this same file, so anyone with a wordlist can confirm a guess. A
// salt would break the mirror -- the producer and consumer sides must agree --
// so the hole is accepted, not closed. The guarantee therefore extends beyond
// `content/`: **never name a protected term in a commit message, a plan doc, a
// test name or a failure string either.** The digest set is the only place a
// term is allowed to appear, and it appears there as a digest.
//
// Kept separate from `BANNED` (mirrored against `.claude/rules/content-
// writing.md` by the drift guard) and from `LEAKS` (regex shapes, samples in
// the clear). A term here has no publishable sample, so this block gets its own
// premise guard built from a fabricated canary instead.
//
// Normalisation, applied identically to a supplied term and to every content
// n-gram -- the two sides are a mirror, and `the normaliser collapses
// inflections` below is the test that keeps them one:
//   strip diacritics (NFD) -> lowercase -> hyphens to spaces -> `[a-z0-9]+`
//   tokens -> join with one space -> strip a trailing `es` or `s` -> sha256
// so a plural, a possessive, a hyphenated spelling, or an accent dropped from a
// name reds on the same digest. The accent fold is load-bearing, not cosmetic:
// without it a `[a-z0-9]+` split would tear a name like `Jarnvarr` in half at
// the accented letter and hash two fragments that match nothing. (That example
// is fabricated, per the block header: no protected term appears here.)
const PROTECTED_SHA256 = new Set([
  '7036c80e90945cfeb26b20592541d830d83c82f9546eeacbb97a0d48988ed2d4',
  'ec4f2dbb3b140095550c9afbbb69b5d6fd9e814b9da82fad0b34e9fcbe56f1cb',
  '6976fb4b3e420a41e2b45f781beddbde2abb4aecf07bf87d0e73e70a63e22a8f',
  '4d5e87c342601bae11c1fd06bfd92277f9b67c22ebcf7e6bf480e682bcf29c07',
  '5d77db2a2906aed32e92acd7c2fa458c9e2185c836146259418733795ca83de8',
  'bb37067afeb4ee16d668eef073ca6eea4f3b4a1fc6c68e3c0b1fd01a5fb7f5ad',
  '0d2c690e7dd5f94780383e9dfa1f4def044319104ad16ab15e45eeb2a8dfc81b',
  '020df7a901fc42f7543c6bf63dd9874a3aa390a33bf6d8570ff8dc078ebf94d9',
]);

/**
 * The n-gram width the scan emits. A stored term LONGER than this can never be
 * produced on the consumer side, so it would pass over every content file
 * forever and read as proof -- and nothing can assert otherwise, because the
 * terms are not in this repo to be counted. Adding a digest for a term of more
 * than this many tokens REQUIRES bumping this constant in the same edit; the
 * cost is one extra gram per token per position, nothing more.
 */
const PROTECTED_MAX_TOKENS = 3;

const normalise = (gram: string) => gram.replace(/(es|s)$/, '');

/** Diacritics stripped, lowercased, hyphens opened out -- shared by both sides. */
const fold = (value: string) =>
  value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/-/g, ' ');

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/** Digest of `term` as a supplied phrase -- the producer side of the mirror. */
function termDigest(term: string): string {
  const tokens = fold(term).match(/[a-z0-9]+/g) ?? [];
  return sha256(normalise(tokens.join(' ')));
}

/** Every 1..3-gram digest in `body` -- the consumer side of the mirror. */
function gramDigests(body: string): Set<string> {
  const tokens = fold(body).match(/[a-z0-9]+/g) ?? [];
  const out = new Set<string>();
  for (let i = 0; i < tokens.length; i += 1) {
    for (let n = 1; n <= PROTECTED_MAX_TOKENS && i + n <= tokens.length; n += 1) {
      out.add(sha256(normalise(tokens.slice(i, i + n).join(' '))));
    }
  }
  return out;
}

describe('protected terms', () => {
  // Premise guards. A digest list that is empty, malformed, or scanned by a
  // walker that never produces a matching gram passes over every content file
  // forever and reads as proof. None of the three can be checked against a real
  // term without publishing it, so they are checked against a fabricated
  // canary that behaves exactly like one.
  const CANARY = 'Zqxil Flumbernaut';

  it('the digest list is non-empty and well-formed', () => {
    expect(PROTECTED_SHA256.size).toBeGreaterThan(0);
    for (const digest of PROTECTED_SHA256) expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it('the scanner finds a protected term embedded in prose', () => {
    const body = `# A chapter\n\nThe work was done at ${CANARY} over two years.\n`;
    expect(gramDigests(body).has(termDigest(CANARY))).toBe(true);
  });

  it('the normaliser collapses inflections onto one digest', () => {
    // Plural, possessive, hyphenated and accented spellings must all red on the
    // digest of the base term -- otherwise the guard is a spelling test, not a
    // name test.
    const accented = CANARY.replace('u', 'ü');
    for (const variant of [`${CANARY}s`, `${CANARY}'s`, CANARY.replace(' ', '-'), accented]) {
      const body = `A line naming ${variant} in passing.\n`;
      expect(gramDigests(body).has(termDigest(CANARY)), variant).toBe(true);
    }
  });

  it('the scanner does not flag unrelated prose', () => {
    const body = 'A paragraph about agents, prompts, reviews and measured token counts.\n';
    const hits = [...gramDigests(body)].filter((digest) => PROTECTED_SHA256.has(digest));
    expect(hits).toEqual([]);
  });

  it.each(CONTENT_FILES)('%s: names no protected term', (path) => {
    const hits = [...gramDigests(read(path))].filter((digest) => PROTECTED_SHA256.has(digest));
    // The digest is not echoed: a failure message is copied into issues and chat
    // far more casually than a source file, and the digest confirms a guess.
    expect(hits.length, `${path}: names a protected term`).toBe(0);
  });
});
