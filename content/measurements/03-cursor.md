---
title: "Cursor — a client-side token floor"
summary: "The Cursor era: a quarter of the cross-era floor, carried by 4.86% of its own message bubbles, and a client-side estimate throughout."
---

# Cursor

Cursor holds the second-largest share on the page and the two heaviest caveats.
Both render beside the number, never after it.

- **26.7% of the cross-era floor**, across the longest single span of any era.
- Measured how: copy `state.vscdb` to a read-only scratchpad
  (`mode=ro&immutable=1`), then aggregate SQL only — sum `tokenCount.*` over the
  `bubbleId:` rows and count `composerData:` rows for sessions.

## Two caveats, both load-bearing

- **It is a floor, not a total.** Only **4.86%** of message bubbles carry a
  non-zero count, and every one of those priced bubbles is an assistant turn. The
  rest log zero, so the real usage is higher than the sum the share is computed
  from — and higher by an unknown factor, not a correctable one.
- **It is a client-side estimate, not a billed figure.** Cursor computes the
  count locally; nothing here was reconciled against an invoice, and nothing here
  could be.

## Nothing about price survives locally

No model name and no price field survive anywhere in `state.vscdb`. That work was
priced server-side and never reached the local store, so nothing about it is
derivable here and nothing is estimated from the token count.

Cursor's 2025-07-09 → 2026-05-18 span overlaps Continue, Codex and the start of
Claude Code; the eras are concurrent.

## What is not published

The token sums, the session count and the message counts. `4.86%` is the shape of
the gap; its absolute size is private.
