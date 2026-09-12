---
title: The rule names what was dropped
topic: the-governance-layer
rung: configuring
concern: quality
question: What makes a project rule checkable rather than merely persuasive?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 2
level: govern
source_chapter: 02-kri-local-rag
slot: toolkit
quote_from: content/artifacts/rule-langchain-contained.md
---

# The rule names what was dropped

The RAG repo's LangChain rule does not say "prefer fewer dependencies". It names the packages that were
dropped and what replaced each one, so the rule can be held against the lockfile instead of being
interpreted. The three generic lines that follow it (keys in `.env`, wrap external calls, log the
interaction) have no such check, and that is the difference between a rule and a wish.

## Evidence

> [2026-06-23] "deps: `langchain-core`/`-text-splitters`, NOT `langchain-community` (dropped — PDFs load via `pypdf`, text via stdlib) and NOT the `langchain` umbrella."
