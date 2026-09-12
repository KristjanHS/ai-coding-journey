---
title: Ask how quality is measured first
topic: evaluating-code-models
rung: asking
concern: quality
question: When you cannot yet judge the answer, what is the first thing worth asking a model?
audience: [university, rnd-engineers, meetup]
evidence: artifact
minutes: 2
level: orient
source_chapter: 00-experiments
slot: open
---

# Ask how quality is measured first

The asking rung is where you do not yet know enough to judge the answer. Before
choosing an autocomplete tool, the useful move is not "which one is best" but
"how would I measure best at all". The prompt below asks for the measuring
apparatus — the datasets and the metrics — rather than a recommendation.

What came back was a map, not a verdict: unit-test-style benchmarks scored by
pass@k, fill-in-the-blank corpora scored by token accuracy, and full-program
challenges scored by tests passed. All of it was the vocabulary you need before
a verdict could mean anything.

## Evidence

> [2025-05..2025-08] "Search the web for Python examples for evaluating the quality of a coding model's autocomplete features."

The date is a bracketed span: this thread is undated in the export and placed by
its thread family. The line is quoted from a private source, so the verbatim
gate skips this atom by name rather than checking it against a public file.
