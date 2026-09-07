---
title: "Cursor — a client-side token floor, cost unknown"
summary: "The Cursor era: the largest single token corpus, but a floor and a client-side estimate, with cost server-side and never estimated."
---

# Cursor

Cursor holds the largest single token count on the page, and the two heaviest
caveats. Both render beside the number, never after it.

- **<redacted> input tokens** and **<redacted> output tokens**, over
  **<redacted> sessions** and <redacted> messages (<redacted> user, <redacted> assistant).
- Measured how: copy `state.vscdb` to a read-only scratchpad
  (`mode=ro&immutable=1`), then aggregate SQL only — sum `tokenCount.*` over the
  `bubbleId:` rows and count `composerData:` rows for sessions.

## Two caveats, both load-bearing

- **It is a floor, not a total.** Only **<redacted> of <redacted>** bubbles carry a
  non-zero count — 4.86% — and every priced bubble is an assistant turn. The rest
  log zero, so the true usage is higher than the sum.
- **It is a client-side estimate, not a billed figure.** Cursor computes the
  count locally; nothing here was reconciled against an invoice.

## Cost is `unknown-server-side`

No model name and no cost field survive anywhere in `state.vscdb`. The money was
priced server-side and never reached the local store, so this era's cost stays
`unknown-server-side` — distinct from Continue's `near-zero-local` finding — and
is never estimated from the token count. Cursor's 2025-07-09 → 2026-05-18 span
overlaps Continue, Codex and the start of Claude Code; the eras are concurrent.
