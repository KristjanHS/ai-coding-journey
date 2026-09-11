---
title: A budget check has to fail open
topic: the-config-tree
rung: configuring
question: When the agent's own configuration watches its spend, what must that check never be able to do?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 3
level: show
source_chapter: 12-claudeconf
slot: climb
quote_from: content/journey/12-claudeconf.md
---

# A budget check has to fail open

Configuration can also watch the agent. This hook sums the exact context size
out of the session transcript after every tool call and speaks up at 130k. It
replaced an estimate built from message lengths, which drifted with nobody
comparing it to the real figure.

The design decision that matters is below. A check that can block work is a
second thing that can break the session. An error in this hook lets the tool
call through, so the worst it can do is stay silent.

## Evidence

> [2026-06..2026-07] "fails open — an error here never blocks the tool call"

The date is the repo's active span, not a day: the line is quoted from the
chapter's summary of the hook, not from a dated commit.
