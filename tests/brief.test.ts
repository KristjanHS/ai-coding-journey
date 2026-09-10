import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// The falsifier for `make brief` (remediation spec Stage 1). The orientation
// block is only worth one tool call if it is COMPLETE -- a block silently
// missing its `plan` or `gate` line reads like an answer and isn't one.
//
// The spec's first draft proposed `make brief | grep -q 'increment'`. That
// cannot fail in any interesting way: the word appears in prose, in a heading,
// in the plan filename. This asserts each of the five section labels
// INDIVIDUALLY, so deleting one emit line reds naming that section.
const SECTIONS = ['branch', 'log', 'plan', 'next', 'gate'];

const brief = () =>
  execFileSync('make', ['--no-print-directory', 'brief'], {
    encoding: 'utf8',
    cwd: process.cwd(),
  });

describe('make brief', () => {
  const out = brief();

  it.each(SECTIONS)('emits the `%s` section', (label) => {
    // Anchored at line start: `plan` also occurs inside the plan filename and
    // inside stage headings, so an unanchored search passes on a missing label.
    const re = new RegExp(`^${label} \\.*\\s`, 'm');
    expect(out, `no line starts with "${label}"`).toMatch(re);
  });

  it('never prints a plan it cannot source from the pointer', () => {
    // The one thing brief must never do is guess. Either it names a file that
    // exists under docs/plans/, or it says so.
    const line = out.split('\n').find((l) => l.startsWith('plan '));
    expect(line).toBeDefined();
    expect(line).toMatch(/(unknown \(no pointer\)|\.md$)/);
  });
});
