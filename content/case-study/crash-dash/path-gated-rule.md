---
title: "Path-gated rule: plan and doc hygiene"
summary: "A convention file that loads only when the agent touches docs/ — plan lifecycle, citation form, and how a claim gets verified."
origin: ".claude/rules/plan-hygiene.md"
date: 2026-09-07
---

A path-gated rule is a convention file with a `paths:` glob in its frontmatter. It is not loaded at the
start of a session; it loads when the agent opens a file the glob matches. This one is gated on
`docs/**/*.md`, so plan-writing conventions cost nothing on a session that only touches source.

## What it enforces

- **Archiving at ship.** A plan doc moves into an archive directory when its work ships. Anything still
  owed by a person moves out into the doc that tracks those, so the archive holds no live obligations.
- **Staged moves.** Uncommitted edits to a doc are staged *before* the move, and both halves of the
  rename are named explicitly in the commit — otherwise the same content exists at two paths in one
  commit.
- **Cite by stem.** A plan is referenced as `<name>.md (docs/plans/)`, never by full path. Archiving then
  never breaks a citation, because the citation never carried the directory.
- **Section anchors carry their stem.** A `§section` reference names the document it lives in, so it
  resolves when the same heading exists in three files.
- **Deleting a heading owes a repo-wide grep** for the bare stem — anchor-shaped searches miss the
  implicit references, and those are the ones that rot silently.

## The claims block

The longest section is about *claims*, and it is the transferable part. A sentence in a plan doc asserting
a fact is treated as a check that can be wrong:

- A coverage claim ships with the grep that establishes it, run in both the matching and non-matching
  form — a search that cannot return nothing proves nothing.
- A commit reference is verified to be an ancestor of the main branch before it is cited; line-number
  citations are assumed to have rotted.
- Moving a paragraph re-asserts every claim in it, so the greps are re-run at the destination.
- Closing a decision means deleting its entry after grepping for every copy — not marking it done in one
  place while two stale copies stay open.

## Why it is a rule and not a habit

The failure it prevents is not carelessness, it is scale. Once a repo has enough plan docs that no one
holds them all in mind, a citation by full path and a claim without its grep are indistinguishable from
correct ones by reading. Gating the rule on `docs/**/*.md` means the agent is holding the convention at
exactly the moment it could break it, and never paying for it otherwise.

## What didn't transfer

The original names specific action-tracking docs, test file locations, and an internal backlog structure.
Those are project furniture. The lifecycle, the citation form, and the claims block are the parts that
move to another repo unchanged.
