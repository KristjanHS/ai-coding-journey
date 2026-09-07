---
title: "Claude Code — the era with the richest logs"
summary: "The one era whose logs date themselves, split main from subagent traffic, and account for reuse separately — and the largest share of the floor."
---

# Claude Code

The one era where tokens, sessions and era-start dates are all derivable from the
logs. It is also the only era that can distinguish work I drove from work it
spawned on my behalf.

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

## The share, and how it splits

- **59.8% of the cross-era floor** — the largest of the four bearing tools, and
  larger than the other three combined.
- **52.9% of that is subagent traffic**, against 47.1% in the sessions I typed
  into. Sub-agents are the majority of the era by tokens, spread across
  **47.9%** of main sessions — roughly half of all sessions delegate at all, and
  those that do account for more than half the work.
- Measured how: sum `message.usage.*` over `type == "assistant"` records in
  `~/.claude/projects/**/*.jsonl`, scoping the `isSidechain` filter per side
  (false for main transcripts, true for subagent transcripts), so neither side
  zeroes the other.

Both sides are reported, per the ruling that neither is folded away.

## Reuse is 16× the fresh traffic

Cache reads — context re-sent from a warm prompt cache — run at **16.1× the
headline sum** of input, cache-creation and output. It is a ratio, not a total,
and it is reported separately because folding reuse into a token headline is the
single easiest way to make an AI-coding figure meaningless. A ratio above one
says most of what the model reads it has read before.

## Skills — a Claude-Code-era attribute

None of the four earlier tools had skills; Claude Code is the only era with them.

- **29** live `SKILL.md` files, and **103** commits touching `skills/`
  (2026-07-09 → 2026-08-20).
- Measured how: count `SKILL.md` under the live `skills/` directory, and count
  git commits touching that directory.
- Caveat: those dates are adoption-into-version-control, not authoring — the
  103-commit figure is a floor over the git era only and undercounts pre-git
  iteration, the same shape as the Cursor token floor.

## What is not published

The token sums for either side, the session and transcript counts, and every
figure about what any of it cost. The splits and the reuse ratio are the findings;
the volumes are private, and the cost derivation was moved out of this repo's
scripts along with them.
