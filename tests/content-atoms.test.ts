import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ATOM_DIR, ATOMS, configEnum, frontmatter, JOURNEY, read, section, TOPIC_DIR } from './helpers';

// inc7b — the atom corpus. `astro build` already gates each atom's own schema,
// but it cannot see two things: that a `topic:` names a topic file that exists
// (Zod validates a string, not a reference), and that the facet vocabularies the
// pages and a future deck query against are still the ones declared. Both are
// asserted here, over the source text — vitest has no Astro resolution, so the
// consts are regex-parsed out of the config exactly as ARTIFACT_KINDS is.

describe('atom corpus', () => {
  const topicSlugs = new Set(
    readdirSync(TOPIC_DIR)
      .filter((name) => name.endsWith('.md'))
      .map((name) => name.replace(/\.md$/, '')),
  );

  const chapterSlugs = new Set(
    readdirSync(JOURNEY)
      .filter((name) => name.endsWith('.md'))
      .map((name) => name.replace(/\.md$/, '')),
  );

  it('there are atoms, topics and chapters to check', () => {
    expect(ATOMS.length, `no atoms found under ${ATOM_DIR}`).toBeGreaterThan(0);
    expect(topicSlugs.size, `no topics found under ${TOPIC_DIR}`).toBeGreaterThan(0);
    expect(chapterSlugs.size, `no chapters found under ${JOURNEY}`).toBeGreaterThan(0);
  });

  // Referential integrity. This is the whole reason topics are files rather than
  // a free-text tag: a typo'd `topic:` is a broken link on the site and a dead
  // group in the corpus, and nothing else in the gate can see it.
  // Same shape, same reason: `source_chapter` is Stage 4's transclusion key, and
  // Zod validates a string, not a reference. A typo'd or renamed chapter makes an
  // atom transclude onto NOTHING while `astro build` stays green -- the atom still
  // renders at its own route, so nothing else in the gate can see the orphan. The
  // target is the chapter FILE, not the journey collection: `00-experiments` is
  // excluded from the collection on purpose (Stage 4 ruling 2), so an atom mined
  // for it legitimately transcludes nowhere and must still resolve here.
  it.each(ATOMS)('%s: `source_chapter` resolves to a chapter file', (path) => {
    const chapter = frontmatter(read(path), 'source_chapter');
    expect(chapter, `${path}: no \`source_chapter:\` in frontmatter`).toBeDefined();
    expect(
      [...chapterSlugs],
      `${path}: \`source_chapter: ${chapter}\` has no ${join(JOURNEY, `${chapter}.md`)}`,
    ).toContain(chapter);
  });

  it.each(ATOMS)('%s: `topic` resolves to a topic file', (path) => {
    const topic = frontmatter(read(path), 'topic');
    expect(topic, `${path}: no \`topic:\` in frontmatter`).toBeDefined();
    expect(
      [...topicSlugs],
      `${path}: \`topic: ${topic}\` has no ${join(TOPIC_DIR, `${topic}.md`)}`,
    ).toContain(topic);
  });

  // Mirror-totality pins. RUNG_META's precedent: a Record declared total over an
  // enum does not gate a ship, because `make check` runs `astro build`, never
  // `astro check`. These name the members instead, so dropping one reds here.
  it('the six rungs are the ladder the atoms are sorted by', () => {
    expect(configEnum('RUNGS')).toEqual([
      'asking',
      'suggesting',
      'delegating',
      'planning',
      'configuring',
      'governing',
    ]);
  });

  it('the three levels are what an atom does to a listener', () => {
    expect(configEnum('LEVELS')).toEqual(['orient', 'show', 'govern']);
  });

  it('the four evidence kinds are what a shown line can be', () => {
    expect(configEnum('EVIDENCE_KINDS')).toEqual(['defect', 'number', 'artifact', 'transcript']);
  });

  it('the four audiences are the cuts one corpus emits', () => {
    expect(configEnum('AUDIENCES')).toEqual(['university', 'rnd-engineers', 'meetup', 'linkedin']);
  });

  // Fidelity rule: paraphrase everywhere, exactly one verbatim line per atom, and
  // that line carries its date. A second quote block is the leak surface widening
  // one idea at a time, which is what the one-quote ceiling exists to hold.
  it.each(ATOMS)('%s: `## Evidence` carries exactly one dated quote', (path) => {
    const evidence = section(read(path), 'Evidence');
    expect(evidence, `${path}: no \`## Evidence\` section`).toBeDefined();
    const quotes = evidence!.split(/\n(?!>)/).filter((block) => block.trimStart().startsWith('>'));
    expect(quotes.length, `${path}: expected exactly one blockquote in \`## Evidence\``).toBe(1);
    expect(quotes[0], `${path}: the quoted line carries no bracketed date`).toMatch(
      /\[\d{4}-\d{2}(-\d{2})?(\.\.\d{4}-\d{2}(-\d{2})?)?\]/,
    );
  });
});
