---
title: "Continue — tokens logged exactly, and almost none of them"
summary: "The local-LLM era: the one era whose token log is exact and cross-checked, and the smallest share of the floor by three orders of magnitude."
---

# Continue (VS Code)

The local-LLM era. Continue ran mostly against a local Ollama model, which makes
it the one era whose token state is `yes` in the strong sense — the record is
*exact*, not a floor — and the one that contributes almost nothing to the
cross-era floor.

- **0.10% of the cross-era floor** — the smallest share of the four
  token-bearing tools, three orders of magnitude below the largest. On the
  page's log-scaled bar it is visible; on a linear one it would not be.
- **98.8% of token events ran on the local Ollama provider**, the rest on a
  hosted Gemini key. That split is why the era's marginal money is a rounding
  error rather than an unknown.
- Measured how: sum `.promptTokens` and `.generatedTokens` over
  `dev_data/0.2.0/tokensGenerated.jsonl`, then cross-check the sums against the
  `tokens_generated` table in `dev_data/devdata.sqlite` (read-only copy).

## The cross-check agrees to the event

Two independent stores — a JSONL append log and a SQLite mirror — record the same
events, and they agree exactly: zero delta on events, prompt tokens and generated
tokens alike. That is the only clean agreement anywhere in the ladder, and it
is worth naming precisely because every other era's two records disagree.

## Two ranges, kept apart

The chat sessions stop on **2025-07-09**, but token events keep generating
through **2025-08-16**. The page shows both ranges rather than silently picking
one, and both sit alongside the config-dir git range — no single source dates
this era on its own. Continue's span overlaps Copilot's and Cursor's; the eras
are concurrent, not sequential.

## What is not published

The absolute token sums, the event count and the session count. The share and the
provider split carry the finding; the volume is private.
