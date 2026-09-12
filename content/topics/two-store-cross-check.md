---
title: The two-store cross-check
summary: When a tool writes the same events to two independent stores, the two records can be compared — and across the whole ladder exactly one pair agreed to the event.
---

# The two-store cross-check

Named after the check itself: reading a tool's usage from two places it wrote
independently, and subtracting. Continue keeps an append-only JSONL log and a
SQLite mirror of the same token events, which makes the comparison possible at
all — most tools offer one store or none.

The idea grouped here is what the result of that subtraction is worth. A
non-zero delta says the numbers need a caveat before they are published. A zero
delta is the stronger and rarer outcome: it does not prove the tool counted
correctly, only that it counted consistently in two places at once, which is the
most a self-reported figure can offer without an external check.
