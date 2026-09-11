---
title: A skill costs every session, not just the job it was for
topic: the-config-tree
rung: configuring
concern: cost
question: What does adding one more skill to the config tree actually cost?
audience: [university, rnd-engineers]
evidence: defect
minutes: 2
level: govern
source_chapter: 11-dotfiles
slot: climb
quote_from: content/journey/11-dotfiles.md
---

# A skill costs every session, not just the job it was for

Two cleanup skills went into the config tree for one pass over a private app,
and came out again once the job landed. The cost of a skill is its description,
which loads in every later session whether or not that job ever comes back.
One-off tooling belongs in a sub-agent that ends with the task.

## Evidence

> [2026-06-30] "no longer needed locally"

The rationale recorded in the revert commit, `938206a`.
