---
title: "Test discipline: an assertion must be shown to fail"
summary: "The rule that a new check owes a demonstration it can go red — and the ways a check quietly stops being able to."
origin: ".claude/rules/testing-project.md"
date: 2026-09-07
---

A path-gated rule loaded whenever a test file is opened. It is not about coverage. Every convention in it
answers one question: *can this check still fail?*

That question has to be asked out loud because a check that cannot fail looks exactly like a check that
keeps passing, and the second one is what everybody wants to see.

## The red demo

**Every new or changed assertion owes a mutate-and-confirm-red demonstration before the work counts as
verified.** Break the exact line the assertion guards, watch it go red, then restore it by re-typing.

The mechanics are part of the rule, not decoration:

- Mutate the *specific* line under guard, not something adjacent that happens to break the suite.
- Restore by re-typing, never by discarding working-tree changes wholesale — that throws away uncommitted
  work alongside the mutation.
- **Never commit the mutated state.** A deliberately broken revision on the main branch is a landmine for
  anyone bisecting later. The demo lives in the working tree; the failing output goes in the commit
  message.
- A data-only change — retuning a value, flipping a mode, moving a window — that leaves the assertion text
  untouched owes no new demo. The assertion already had one.

## The ways a check goes hollow

The rest of the rule is a catalogue of how a check stops being able to fail without anyone editing it:

- **A prose spec with no fixture.** The document says what the behaviour is, the suite asserts nothing, and
  deleting the logic leaves everything green.
- **A vacuity anchor that certifies itself.** A guard checking "this pattern does not appear anywhere"
  matches its own file, so it reports a violation of itself and reads as working. Every such anchor must
  exclude the guard's own file.
- **An anchor pinned to a population that shrinks.** Count-based anchors pass by construction once the
  population empties. Pin to the value that *moves when the fix lands*, not to a total.
- **A fixture derived from a constant.** Building a case as "one below the threshold" is fine until the
  threshold retires to zero — then the case is meaningless and still green. Such a fixture owes a premise
  guard that reds when its constant goes away, and retiring any gate constant owes a repo-wide search for
  the offsets derived from it.
- **A mock that silently no-ops.** With per-file isolation disabled, declaring a module mock does not
  error if an earlier file in the same worker already imported the real module — the mock simply does not
  apply, and the test reaches the live seam while reporting a pass. A standing guard test isolates the
  seams where that can happen.

## What didn't work

The rule began as a single line — new assertions get a red demo. It did not hold, because most hollow
checks in the repo were never *new*: they went vacuous later, when a constant retired or a population
emptied under them. The demo requirement catches the check that was born broken. The catalogue above
exists because the more common case is a check that was born fine and died quietly, and only a named
failure mode gets looked for.
