---
title: Day one opened with an instruction file
topic: the-governance-layer
rung: configuring
concern: quality
question: What did governance look like on the first day of the tool built to measure it?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 2
level: govern
source_chapter: 10-token-monitor
slot: toolkit
quote_from: content/artifacts/memory-day-one-rules.md
---

# Day one opened with an instruction file

The token-monitor repo's first commit carries a 55-line `CLAUDE.md` with three numbered rules,
rewritten thirty-one minutes later into a two-level disclosure scheme. The third rule is the
checkable one — defensive parsing of a log format the tool does not own. Opening on the rung did not
spare the repo its first-hour defects: the suite rule 2 mandates was green while the core lookup was
broken, because no test exercised the slug computation.

## Evidence

> [2026-04-04] "**JSONL log format is not ours to control** — be defensive about missing fields, never crash on unexpected data."
