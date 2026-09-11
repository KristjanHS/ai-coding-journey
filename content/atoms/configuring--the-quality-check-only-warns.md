---
title: The quality check warns, it does not block
topic: the-config-tree
rung: configuring
concern: quality
question: If a hook can stop a badly written instruction file, why let the write through?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 2
level: show
source_chapter: 12-claudeconf
slot: toolkit
quote_from: content/artifacts/hook-docs-bloat-gate.md
---

# The quality check warns, it does not block

A hook in the public config repo reads every `.md` write and flags padded or generic text. It used
to block on those signals. Now it warns once per signal per session, and only a hard size cap still
stops the write, because the warning itself has to stay cheap.

## Evidence

> [2026-07-09] "S2/S3/W1 are advisory: the write proceeds and a one-line nudge is fed back via PreToolUse additionalContext, throttled to once per signal per session so the nudge itself can't become a token drain."
