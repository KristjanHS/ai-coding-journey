import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { artifactKinds, CONTENT, contentFiles, frontmatter, read, section } from './helpers';

// The artifacts collection stopped being "reusable prompts" in inc5f: a prompt
// is one of six kinds of context artifact, and the page only makes that claim
// if all six are actually on it. These four assertions are the executable form
// of that claim — the kind enum is parsed back out of `content.config.ts` so
// adding a sixth kind there without an example here reds instead of rotting.
const ARTIFACT_DIR = join(CONTENT, 'artifacts');
const CONTEXT_ARTIFACTS = contentFiles(ARTIFACT_DIR);

describe('context artifacts', () => {
  const KINDS = artifactKinds();

  it('there are artifacts to check, and six kinds to check them against', () => {
    expect(CONTEXT_ARTIFACTS.length, `no artifacts found under ${ARTIFACT_DIR}`).toBeGreaterThan(0);
    expect(KINDS.length, 'ARTIFACT_KINDS parsed empty').toBe(6);
  });

  it.each(CONTEXT_ARTIFACTS)('%s: declares a `kind` in the enum', (path) => {
    const kind = frontmatter(read(path), 'kind');
    expect(kind, `${path}: no \`kind:\` in frontmatter`).toBeDefined();
    expect(KINDS, `${path}: \`kind: ${kind}\` is not in ARTIFACT_KINDS`).toContain(kind);
  });

  // The reframe's whole claim. A page naming six kinds while shipping five is
  // the site contradicting itself, and nothing else in the gate would catch it.
  it('every kind has at least one example on the page', () => {
    const present = new Set(CONTEXT_ARTIFACTS.map((path) => frontmatter(read(path), 'kind')));
    expect([...present].sort()).toEqual([...KINDS].sort());
  });

  // Two provenance stories share one page (this repo vs. private/per-machine
  // trees), so every entry has to say which tree it came from and whether the
  // reader can verify it. Frontmatter `source:` is a label; this section is the
  // sentence that admits when there is no public address.
  it.each(CONTEXT_ARTIFACTS)('%s: carries a `## Where it came from` body', (path) => {
    const where = section(read(path), 'Where it came from');
    expect(where, `${path}: no \`## Where it came from\` section`).toBeDefined();
    expect(where!.length, `${path}: empty \`## Where it came from\``).toBeGreaterThan(0);
  });
});
