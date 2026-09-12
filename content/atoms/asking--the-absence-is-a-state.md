---
title: The absence is a state, not a missing value
topic: the-governance-layer
rung: asking
concern: cost
question: What survives when you go looking for the receipts two years later?
audience: [university, rnd-engineers]
evidence: number
minutes: 2
level: show
source_chapter: 90-what-i-got-wrong
slot: open
quote_from: content/measurements/00-copilot.md
---

# The absence is a state, not a missing value

Four tools, four answers to "what went through here": exact, floor-because-partial,
floor-because-sampled, absent. The first era is the pure case — Copilot Chat wrote no token field at
all, so its row is a named absence rather than a zero. A chart cannot render `null`; a table of
states can, and that constraint is what kept the measurements page truthful before there was any
reason to redact it.

## Evidence

> [2025-06-20..2025-12-08] "Grepped every session JSON: there is **no token field** anywhere, so no token figure exists at all — not even a floor."
