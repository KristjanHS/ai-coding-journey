import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { configEnum, frontmatter, read, SIDECAR_DIR, SIDECARS, TOPIC_DIR } from './helpers';

// inc7b Stage 2 -- the sidecar corpus. Three guards, and what each one exists
// for is recorded in `docs/plans/2026-09-09-inc7-mine-spec.md` §Stage 2 rulings.

describe('sidecar corpus', () => {
  const topicSlugs = new Set(
    readdirSync(TOPIC_DIR)
      .filter((name) => name.endsWith('.md'))
      .map((name) => name.replace(/\.md$/, '')),
  );

  it('there are sidecars to check', () => {
    expect(SIDECARS.length, `no sidecars found under ${SIDECAR_DIR}`).toBeGreaterThan(0);
  });

  // (a) Totality, in BOTH directions. A literal `length === 8` cannot see a
  // ninth directory, which is this stage's own stated falsifier -- so the enum
  // is compared as a SET against the directory listing instead. The consequence
  // is deliberate: every declared type owes a directory on disk, empty or not.
  it('the eight sidecar types are exactly the directories on disk', () => {
    const declared = configEnum('SIDECAR_TYPES');
    const onDisk = readdirSync(SIDECAR_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    expect(declared.length, 'SIDECAR_TYPES is not eight members').toBe(8);
    expect([...declared].sort(), 'SIDECAR_TYPES and content/sidecars/ have diverged').toEqual(
      [...onDisk].sort(),
    );
  });

  // (b) The fidelity guard, and the reason the schema has no quote field: the
  // public tier DESCRIBES what a source showed. A blockquote is the shape
  // pasted transcript material arrives in, so blockquote lines are the thing
  // rejected -- not every `"..."` span, which false-positives on honest prose
  // quoting (the existing atoms quote a constraint inline and are right to).
  // Accepted, known miss: a quote pasted with no `>` prefix passes this gate.
  // That is a review concern. Do not widen the regex to close it.
  it.each(SIDECARS)('%s: carries no blockquote line', (path) => {
    const lines = read(path).split('\n');
    let fenced = false;
    const quoted: number[] = [];
    lines.forEach((line, i) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      else if (!fenced && /^\s*>/.test(line)) quoted.push(i + 1);
    });
    expect(quoted, `${path}: blockquote line(s) at ${quoted.join(', ')}`).toEqual([]);
  });

  // (c) Referential integrity, same argument as the atoms': Zod validates that
  // `topic` is a string, never that it names a file.
  it.each(SIDECARS)('%s: `topic` resolves to a topic file', (path) => {
    const topic = frontmatter(read(path), 'topic');
    expect(topic, `${path}: no \`topic:\` in frontmatter`).toBeDefined();
    expect(
      [...topicSlugs],
      `${path}: \`topic: ${topic}\` has no ${join(TOPIC_DIR, `${topic}.md`)}`,
    ).toContain(topic);
  });
});
