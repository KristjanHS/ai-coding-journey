---
title: The copied test pinned deleted behaviour
topic: the-config-tree
rung: configuring
concern: quality
question: What rots first when a configuration is copied between repos?
audience: [university, rnd-engineers]
evidence: defect
minutes: 2
level: govern
source_chapter: 08-fte-budget-planner
slot: toolkit
quote_from: content/artifacts/hook-docs-bloat-gate.md
---

# The copied test pinned deleted behaviour

On 2026-07-27 the repo that first authored the docs-bloat gate had a red `make check` on a clean
tree: 57 failures, all in one inherited suite asserting that a gated write is blocked — a contract
the hook's live version had made advisory two days earlier. The copy's suite was the only remaining
test for that hook anywhere, so dead behaviour was pinned while live behaviour had no test at all.
A copied rule brings a copied test, and the test is the half that rots silently.

## Evidence

> [2026-07-27] "`make check` is red on a clean tree — 57 pre-existing failures, all in `tests/hooks/test_docs_bloat_gate_v2.py`."
