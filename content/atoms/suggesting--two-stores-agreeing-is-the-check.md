---
title: Two stores agreeing is the check you can actually run
topic: two-store-cross-check
rung: suggesting
concern: quality
question: A tool reports its own usage — how would you find out whether the number is trustworthy?
audience: [university, rnd-engineers, meetup]
evidence: number
minutes: 2
level: show
source_chapter: 02-kri-local-rag
slot: toolkit
quote_from: content/measurements/01-continue.md
---

# Two stores agreeing is the check you can actually run

A tool that reports its own token usage is the only witness to it, so the number
arrives unverified by default. Continue is the one era on this ladder where a
second witness existed: the same events were written to an append-only JSONL log
and to a SQLite mirror, independently, so the two could be subtracted.

They came out identical — zero delta on events, prompt tokens and generated
tokens alike. That is not proof the counter is right; both stores could be wrong
in the same way. It is proof the record is internally consistent, which is the
strongest claim a self-reported figure can carry without an external meter, and
it is the only clean agreement anywhere in the ladder. Every other era's two
records disagree, and those figures are published as floors because of it.

## Evidence

> [2025-07..2025-08] "they agree exactly: zero delta on events, prompt tokens and generated tokens alike"
