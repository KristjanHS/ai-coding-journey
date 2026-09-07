---
title: "OpenAI Codex plugin — a token floor from a partial log"
summary: "The Codex era: two header formats, injected context separated from human prompts, and a share that is a floor because logging starts late."
---

# OpenAI Codex plugin

Codex overturned two of the assumptions the recon brief carried into this
increment, so both corrections are recorded here rather than smoothed over.

- **Two header formats**, not one. Rollout files come in an old top-level `id`
  shape and a newer `session_meta` shape; reading only the old one undercounts
  the era by more than a third of its sessions.
- **69.7% of `role == "user"` messages are human prompts** — the remaining 30.3%
  are injected `environment_context` blocks. Counting raw user messages would
  inflate the prompt figure by half as much again.
- Measured how: walk `~/.codex/sessions/**/rollout-*.jsonl`, count unique session
  ids across both header shapes, and classify each `role == "user"` message as a
  human prompt or an injected context block.

## The share is a floor

Codex *does* log tokens — the brief's "grepped, zero" was wrong — but only from
**2025-09-23**, when the `token_count` event first appears, and only in
**37% of rollouts**. So its share of the cross-era floor is itself a floor, with
a different cause from Cursor's:

- **14.8% of the cross-era floor**, second largest of the four bearing tools.
- Measured how: sum `token_count.info.total_token_usage` per session (cumulative,
  last value per session). `cached_input_tokens` is a *subset* of input and
  `reasoning_output_tokens` a subset of output — neither is added again, which is
  the difference between a floor and a double count.
- Cached input reuse is real here but is a subset already inside the input count.
  It is not the same class as Claude Code's separately-tracked `cacheRead`.

Two provenance notes, so no later session re-litigates them: `~/.codex/history.jsonl`
is a 3-line stub, not a prompt log — the counts come from the rollout jsonl
instead; and OpenAI priced this era server-side, with nothing about price
surviving locally.

**Cursor and Codex overlapped** — the two ran concurrently, Codex from
2025-08-28 through 2026-04-12 while Cursor was live, not one after the other.

## What is not published

Session, prompt and token totals. The share, the coverage fraction and the
two-format finding are the parts that generalise.
