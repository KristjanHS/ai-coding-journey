---
title: "Claude Code — the era with tokens, cost and sessions"
summary: "The richest logs: token classes, derived per-model cost, session counts, and the cross-era token floor over four of five tools."
---

# Claude Code

The one era where tokens, money and sessions are all derivable from the logs. It
carries two token figures side by side, never one silently, and the only derived
cost on the page.

- **<redacted> tokens** main-session (input + cache-creation + output), and
  **<redacted> tokens** for main + subagents — both reported, per the ruling
  that neither side is folded away.
- **723 main sessions** across 749 files; 898 subagent transcripts spread over
  346 of those sessions.
- Measured how: sum `message.usage.*` over `type == "assistant"` records in
  `~/.claude/projects/**/*.jsonl`, scoping the `isSidechain` filter per side
  (false for main transcripts, true for subagent transcripts), so neither side
  zeroes the other.

Cache-read tokens are reuse, shown separately and never inside the headline sum.

## Cost is `derived`

- **$<redacted>** total, across 293 sessions that carry a cost-state.
- Measured how: take the last `cost-state` per session (it is cumulative), and
  cross-check the per-model sum against the assistant-derived cost. This is the
  only `derived` cost state — real per-model spend from the logs, distinct from
  Continue's `near-zero-local`, Cursor's and Codex's `unknown-server-side`, and
  Copilot's `absent`.

## The cross-era token floor

Across the four tools that log tokens at all — Continue, Codex, Cursor and Claude
Code — the combined floor is **<redacted>** tokens, four of five tools. It is a
floor: Copilot logs no token field, and both Codex and Cursor contribute floors
of their own. The eras that produced it overlap in time rather than succeeding one
another.

## Skills — a Claude-Code-era attribute

None of the four earlier tools had skills; Claude Code is the only era with them.

- **29** live `SKILL.md` files, and **103** commits touching `skills/`
  (2026-07-09 → 2026-08-20).
- Measured how: count `SKILL.md` under the live `skills/` directory, and count
  git commits touching that directory.
- Caveat: those dates are adoption-into-version-control, not authoring — the
  103-commit figure is a floor over the git era only and undercounts pre-git
  iteration, the same shape as the Cursor token floor.
