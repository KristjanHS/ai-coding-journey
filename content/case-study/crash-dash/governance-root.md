---
title: "Governance root: the always-loaded instructions"
summary: "The one file an agent reads at the start of every session — and the discipline of keeping almost nothing in it."
origin: "CLAUDE.md"
date: 2026-09-07
---

The governance root loads at the start of every session, whatever the work is. That makes it the most
expensive file in the repo: every line costs tokens on every task, including the tasks it has nothing to
say about. Its design problem is therefore subtraction, not coverage.

In this repo it stays around sixty lines, and it earns them in four sections.

## What it keeps

- **Mission and canonical pointers.** One paragraph on what the system does, then the names of the design
  docs that are the source of truth. The root does not restate them; it says where the truth lives so a
  session never invents a second answer.
- **The writable set.** An explicit list of which `.md` files an agent may edit, with a pointer to the
  path-gated rule that carries an admission row per target. Everything not listed is read-only. This is
  the highest-value line in the file: without it, an agent asked to "update the docs" edits whichever
  document it happens to have open.
- **A source map.** File-to-role inventory, so the agent finds the right seam instead of grepping. This is
  the section most specific to one repo, and the first thing to drop when copying the shape elsewhere.
- **Four workflow non-negotiables.** Deliberately few, deliberately absolute.

## The four non-negotiables

1. **A user-visible wrong number is a bug, never a known limitation.** Anything that reaches the output —
   a wrong figure, a misfiring notification — is fixed, not filed behind a "documented, intentionally
   conservative" label. The rule exists because that label is exactly what a capable agent reaches for
   when a fix looks hard.
2. **Operations go through the wrapper, never the bare command.** The repo's `make` targets are the
   interface; invoking the underlying CLI directly skips the checks the wrapper exists to run.
3. **Bulk reading runs out-of-line.** Large surveys go to a sub-agent that returns a brief; only the brief
   enters the session, because a file read into context is re-billed on every later turn.
4. **Strategy docs stay strategic.** Implementation detail lives in its own plan doc with a back-pointer,
   so the strategy doc does not grow into a build log nobody re-reads.

## What it refuses to keep

Tech-stack conventions — import shape, file structure, test patterns — are pushed into `.claude/rules/`
files that auto-load from a `paths:` glob when the agent touches the matching files. Domain protocols live
in reference docs read section-scoped, never whole. Even the verification command is not restated here: the
root points at the path-gated workflow rule that owns it, so there is exactly one copy to keep correct.

The pattern is the same each time. If a convention only matters when you are touching certain files, it
belongs with those files, not in the file that loads unconditionally.

## What didn't work

The first version tried to be complete — a section per subsystem, the gate command inline, the constants
and their rationale in place. It drifted within weeks: the inline gate command outlived the Makefile that
defined it, and nobody noticed, because a restatement has no test. Moving each of those into the file that
owns it did not make the root better organised; it made the root *falsifiable*, because every remaining
line now points at something a grep can check.
