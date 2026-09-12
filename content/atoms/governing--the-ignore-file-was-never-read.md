---
title: The ignore file was never read
topic: the-governance-layer
rung: governing
concern: control
question: How do you know a control you wrote down is actually being enforced?
audience: [university, rnd-engineers, meetup, linkedin]
evidence: artifact
minutes: 2
level: govern
source_chapter: 02-kri-local-rag
slot: toolkit
quote_from: content/artifacts/settings-deny-list.md
---

# The ignore file was never read

A file listing what the agent should not open sat in the repo, and the tool never read it.
The fix was a deny list that the harness enforces, pushed to several repos under the same commit
on the same day.

## Evidence

> [2026-09-06] ".claudeignore was never implemented by Claude Code (anthropics/claude-code#4160), so its patterns were inert."
