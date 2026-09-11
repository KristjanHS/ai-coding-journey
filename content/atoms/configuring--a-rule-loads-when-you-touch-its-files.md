---
title: A rule loads when you touch its files
topic: the-governance-layer
rung: configuring
concern: control
question: How do you give an agent a convention without paying for it on every task?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 2
level: show
source_chapter: 13-crash-dash
slot: toolkit
quote_from: content/case-study/crash-dash/path-gated-rule.md
---

# A rule loads when you touch its files

A path-gated rule carries a `paths:` glob in its frontmatter. It is not
loaded when the session starts; it loads when the agent opens a matching file.

The plan-writing conventions in the private app are gated on the docs tree. A
session that edits only source never sees them. A session that edits a plan
has them in view before its first line. That is *could see* as a mechanism:
not "the agent knows the house style", but this file, on these paths.

## Evidence

> [2026-09-07] "Gating the rule on `docs/**/*.md` means the agent is holding the convention at exactly the moment it could break it, and never paying for it otherwise."

The date is the sanitised copy's; the original is a private file.
