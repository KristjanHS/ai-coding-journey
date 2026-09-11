---
title: The always-loaded file is paid for on every task
topic: the-governance-layer
rung: configuring
question: What belongs in the one instruction file an agent reads at the start of every session?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 2
level: show
source_chapter: 13-crash-dash
slot: toolkit
quote_from: content/case-study/crash-dash/governance-root.md
---

# The always-loaded file is paid for on every task

The governance root is the one file the agent always sees. Every line costs
tokens on every task, including tasks it has nothing to say about, so its
design problem is subtraction.

In the private app it stays around sixty lines: pointers to where the truth
lives, the list of files an agent may edit, a source map and four absolute rules. Anything
that matters only for certain files moves out to those files.

## Evidence

> [2026-09-07] "The governance root loads at the start of every session, whatever the work is."

The date is the sanitised copy's; the original is a private file.
