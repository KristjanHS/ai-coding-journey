---
title: "Continue — tokens logged, cost near-zero by construction"
summary: "The local-LLM era: prompt and generated token sums cross-checked against SQLite, and a cost finding rather than an unknown."
---

# Continue (VS Code)

The local-LLM era. Continue ran mostly against a local Ollama model, so it is the
one era whose cost is a *finding*, not a gap: near-zero marginal money by
construction.

- **<redacted> prompt tokens** and **<redacted> generated tokens** — **<redacted>** in
  total across <redacted> token events and **16 chat sessions**.
- Measured how: sum `.promptTokens` and `.generatedTokens` over
  `dev_data/0.2.0/tokensGenerated.jsonl`, then cross-check the sums against the
  `tokens_generated` table in `dev_data/devdata.sqlite` (read-only copy); the two
  agree to the event, and the delta is emitted as data either way.

## Cost is `near-zero-local`, a finding

Most inference ran on a local Ollama provider, so the marginal money is
near-zero — a measured finding, not the `unknown-server-side` state Cursor
carries. No cost field exists in the logs, and none is estimated from the token
count.

## Two ranges, kept apart

The 16 chat sessions stop on **2025-07-09**, but token events keep generating
through **2025-08-16**. The page shows both ranges rather than silently picking
one, and both sit alongside the config-dir git range — no single source dates
this era on its own. Continue's span overlaps Copilot's and Cursor's; the eras
are concurrent, not sequential.
