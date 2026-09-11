---
title: A hook, and the four sentences it is allowed to say
source: a private dotfiles repo — `claude/.claude/hooks/impag-budget-check.py`, mirrored in the public `KristjanHS/claudeconf` (excerpted here)
kind: hook
captured: "2026-09-08"
---

# Hook · code that runs whether or not the model cooperates

A rule is an instruction and a skill is a procedure. Both are text the model reads and may or may
not act on. A **hook** is neither: it is a program the harness runs at a fixed event, and its output
is injected into the transcript. With a settings file, it is one of the two kinds that do not depend
on the model agreeing.

This one fires after every tool call and answers one question: *how full is the context window?*

```json
"PostToolUse": [
  { "matcher": "*", "hooks": [
      { "command": "$HOME/.claude/hooks/impag-budget-check.py" } ] }
]
```

## The four sentences

The entire behaviour is a table of graduated bands. Three are informational; one is a stop.

```python
BANDS: tuple[tuple[int, str, str], ...] = (
    (80_000,  "soft", "[impag-budget] Budget FYI, not a checkpoint — keep going, no action. (~{t}k)"),
    (100_000, "soft", "[impag-budget] Budget FYI, not a checkpoint — keep going normally. (~{t}k)"),
    (115_000, "soft", "[impag-budget] Budget FYI, not a stop — don't wrap up on the number alone. "
                      "Keep going if work remains; 130k is the only budget checkpoint. (~{t}k)"),
    (130_000, "hard", "[impag-budget] ~{t}k — WRAP UP: do NOT start a new task. Finish in-flight "
                      "work, save remaining tasks to project_state.md, then run code review → ..."),
)
```

The wording of the soft bands is defensive, and the file says why in a comment above the table: *the
soft wording is intentionally non-stop-flavored and never names an end gate to run now.* An earlier
version phrased the 80k notice as a checkpoint, and sessions began wrapping up at 80k with two
thirds of the budget unspent — the warning caused the outcome it was measuring.

The threshold itself carries its reasoning in the source, which is the habit worth stealing:

```python
# 130k is the /impag wrap-up threshold. Aligned with the statusline 130k yellow
# mark, leaving ~70k headroom before the 200k session-stop budget so review +
# finish-branch + /retro can run with a clean-enough transcript.
HARD_STOP_TOKENS = 130_000
```

A soft band fires once, tracked by a stored high-water mark. A measured drop of 20k or more can only
mean a compaction or a rewind, so the bands re-arm:

```python
COMPACTION_RESET_DROP = 20_000
```

## What didn't work

Reading the whole transcript to measure the context. A 130k-token session is many megabytes of
JSONL, and this hook runs after *every* tool call. The file reads the last 64 KB instead, because
the last assistant turn's reported usage is virtually always in the final few kilobytes — and it
skips the read entirely for transcripts under 400 KB, which cannot hold 130k tokens of context.

Nagging on a fixed timer also failed: sub-agents rarely run `git commit`, so a re-nag keyed to
commits almost never fired for them. They get their own bands and re-nag every 15k tokens of
further growth instead.

## Where it came from

`claude/.claude/hooks/impag-budget-check.py` in a private dotfiles repository — 383 lines, of which
the passages above are quoted verbatim and cut for length. The same file is published at
[KristjanHS/claudeconf](https://github.com/KristjanHS/claudeconf/blob/main/.claude/hooks/impag-budget-check.py),
so this is the one hook on the page you can diff against the excerpt rather than take on trust.

It was not always: until this page was written, the public copy was a 191-line ancestor that
predated the graduated bands entirely and emitted a single reminder at 130k with nothing before
it. Publishing the current version is part of what writing this page cost — an artifact you cannot
show is an artifact a reader has to believe you about.

Ledger field it evidences: **cost to look**.
