---
title: "OpenAI Codex plugin — a token floor from a partial log"
summary: "The Codex era: session and prompt counts, plus a token floor that only begins once the token_count event appears."
---

# OpenAI Codex plugin

Codex overturned two of the assumptions the recon brief carried into this
increment, so both corrections are recorded here rather than smoothed over.

- **223 rollout files = 223 sessions**, in two header formats (137 old
  top-level `id` headers, 86 newer `session_meta` headers — reading only the old
  shape undercounts by 86).
- **<redacted> human prompts** separated from 463 injected `environment_context`
  turns (<redacted> total).
- Measured how: walk `~/.codex/sessions/**/rollout-*.jsonl`, count unique session
  ids across both header shapes, and classify each `role == "user"` message as a
  human prompt or an injected context block.

## The token figure is a floor

Codex *does* log tokens — the brief's "grepped, zero" was wrong — but only from
**2025-09-23**, when the `token_count` event first appears, in **83 of 223**
rollouts. So the sum is a floor with a different reason from Cursor's:

- **<redacted> tokens** (<redacted> input + <redacted> output).
- Measured how: sum `token_count.info.total_token_usage` per session (cumulative,
  last value per session). `cached_input_tokens` is a *subset* of input and
  `reasoning_output_tokens` a subset of output — neither is added again.

Two provenance notes, so no later session re-litigates them: `~/.codex/history.jsonl`
is a 3-line stub, not a prompt log — the counts come from the rollout jsonl
instead; and cost stays `unknown-server-side`, priced by OpenAI with no cost field
surviving locally, never estimated here.

**Cursor and Codex overlapped** — the two ran concurrently, Codex from
2025-08-28 through 2026-04-12 while Cursor was live, not one after the other.
