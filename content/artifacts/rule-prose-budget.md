---
title: A rule that caps prose, and the place it sends the overflow
source: a private dotfiles repo — `claude/.claude/rules/prose-budget.md`, not published in `KristjanHS/claudeconf`
kind: rule
captured: "2026-08-09"
---

# Rule · a cap only holds if the extra text has somewhere to go

This is the most-cited rule in the tree, and it governs text rather than code. It fires on every
surface a session writes without being asked to: docs, plans, auto-memory, instruction files,
docblocks, inline comments, test names. The unit it measures is small, and the ceiling is two lines.

```md
## The unit and its ceiling

A **unit** is one bullet, one `##` section body, one comment block, one docblock, one test name. **A unit
is at most two lines.**

This is a shape check on the text about to be written, never on a file. Nothing measures, opens or trims
an existing file (`~/.claude/references/memory-system.md` §No size caps still binds everywhere else), and
**no hook blocks the write** — a refused write costs more than the prose it refuses.

**An Edit that absorbs a near-duplicate into an existing bullet writes that WHOLE bullet** — the merged
result is the unit, and it clears the two lines, or the absorb doesn't happen and the two bullets stand
(`instruction-file-discipline.md` §anti-pattern 2). Absorption is the one way a unit grows past the ceiling
without any single write breaching it.

Overflow does not become a third line, a nested bullet, a sibling unit, or a new doc that inherits the
paragraph. It goes to the **commit message**: durable, greppable, attached to the diff, free to every
future reader.
```

## Why the last paragraph is the rule

The first two paragraphs are the cap. On their own they ask the model to throw information away, and
it argues: the detail it wants to keep is usually real, so the cheapest way to obey is to obey
somewhere else — a nested bullet, a sibling unit, a fresh doc that inherits the paragraph. The last
paragraph closes all four exits at once and names a destination that costs nothing per turn.

That destination is the point. A commit message is durable, greppable and attached to the diff, and
it is read by whoever is looking at that change rather than by every session that loads the file.
Moving the overflow there is not deletion; it is a change of address, which is why the cap survives
being inconvenient.

## What didn't work

Typing the same correction in chat. It held for the rest of a session and nothing carried into the
next one. The same sentence in a path-gated file is in the window before the first token is written,
in every project the path matches — the difference is not the wording, it is that a file loads
itself.

Raising the ceiling also failed. Three lines per unit read as permission rather than a cap, and the
units that mattered grew to fill it. Two lines is short enough that the overflow clause is reached
often, which is what keeps the commit-message habit alive.

## Where it came from

`claude/.claude/rules/prose-budget.md` in a private dotfiles repository — 68 lines, of which the
passage above is quoted verbatim and cut for length; the excerpt is the rule as it stood on
2026-08-09, the date the overflow paragraph was written. The file is per-machine configuration and is
**not** in the public `KristjanHS/claudeconf` mirror, so a reader cannot diff this one against a
published copy and has to take it as quoted.

Ledger field it evidences: **versioned**.
