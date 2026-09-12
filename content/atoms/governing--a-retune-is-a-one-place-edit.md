---
title: A retune is a one-place edit
topic: the-governance-layer
rung: governing
concern: provenance
question: How do you write a rule an agent can actually comply with?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 2
level: govern
source_chapter: 13-crash-dash
slot: toolkit
quote_from: content/artifacts/rule-retune-one-place.md
---

# A retune is a one-place edit

Tuning values lived in the registry that owns them and in docblocks, test fixtures, mock levels
and plan prose; every retune became a grep-and-replace sweep, and the missed copies were found by
review rather than by anything failing. The rule that ended it is a prohibition with a named
mechanism: it names the one file that may hold a value and forbids every restatement, including
the friendly ones.

An agent can comply with "never restate a cut's value". It cannot meaningfully comply with "keep
configuration DRY" — which is why the rule is written as the first and not the second.

## Evidence

> [2026-07-28] "A retune is a ONE-place edit — never restate a cut's value. registry.ts is the single source for an indicator's cuts."
