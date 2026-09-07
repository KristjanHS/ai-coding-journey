---
title: "Claude Code — the era with tokens, cost and sessions"
summary: "The richest logs: token classes, derived per-model cost, session counts, and the cross-era token floor over four of five tools."
---

# Claude Code

The one era where tokens, money and sessions are all derivable from the logs. It
carries two token figures side by side, never one silently, and the only derived
cost on the page.

## Where the era starts

The transcripts cannot date this era: Claude Code prunes them, so the oldest surviving
one is 161 days younger than the era itself. Two files that pruning does not touch date
it instead.

- **2026-02-28 06:41:21 UTC** — the first token ever spent in Claude Code on this
  account.
- **2026-02-28 06:43:47 UTC** — the first prompt ever typed into it, `/plugin install`
  in a since-deleted `kaizen` scratch project. Two minutes after the first token, from a
  second file: the two sources agree without being derived from each other.
- Measured how: `claudeCodeFirstTokenDate` and `firstStartTime` in `~/.claude.json`, and
  the first record of `~/.claude/history.jsonl`. Dates only are read out of those files.
- The paid claude.ai plan began **17 Feb 2026** — the author's own record, not a measured
  one; a subscription lives server-side and leaves nothing on the machine. The first
  Claude Code token came eleven days later.
- The binary itself first ran **2025-08-16**, 196 days before it spent a token: installed,
  looked at, left alone for six months while the Cursor era ran on.

Both of the era's own records start late — git by 115 days, the logs by 161. The bar on
`/measurements` keeps that gap open rather than widening itself to cover it.

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
