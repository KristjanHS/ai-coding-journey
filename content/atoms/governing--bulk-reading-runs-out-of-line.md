---
title: The session reads the brief, not the files
topic: the-governance-layer
rung: governing
concern: control
question: When an agent needs to survey a large part of a repo, what should end up in its context?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 2
level: govern
source_chapter: 13-crash-dash
slot: toolkit
quote_from: content/case-study/crash-dash/governance-root.md
---

# The session reads the brief, not the files

*Retrieved* is the ledger field for what the agent fetched that it did not
already hold. In the private app the answer is a process, written into the
always-loaded file as a rule: a large survey is handed to a sub-agent, and only
its condensed brief comes back into the session.

The reason is cost as much as focus. A file read into the session stays in the
context and is billed again on every later turn.

## Evidence

> [2026-09-07] "Large surveys go to a sub-agent that returns a brief; only the brief enters the session, because a file read into context is re-billed on every later turn."

The date is the sanitised copy's; the original is a private file.
