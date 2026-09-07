---
title: claudeconf
repo: claudeconf
start: 2026-06-18
end: 2026-07-09
commits: 44
stage: config-engineering
tools: []
deck: true
artifact: present
---

# 12 · claudeconf

## What I was trying to do

Make the agent's own token spend visible while it worked. The dotfiles tree said what the agent should
do; nothing in it said what a session was costing, and the cost is the binding constraint — a run that
exhausts its context window stops mid-task and takes the reasoning with it.

So this repo, forty-odd commits over three weeks, is instrumentation: hooks that read the real token count out
of the session transcript, a statusline that shows it, and rules that load only when the path they
govern is touched.

## What didn't work

A session-start health check that validated the whole hook setup before any work began. It was 108
lines and it went out again in `d2e21a5`.

The problem was that it validated configuration rather than behaviour: it could confirm a hook file
existed and was executable, which is never the thing that breaks. What breaks is a hook that runs and
silently does nothing. A check that cannot observe the failure it was written for is cost with no
return, paid at the start of every session.

## What I learned

An estimate that is never compared to the truth drifts, and nobody notices. The first budget hook
guessed the context size from message lengths; replacing the guess with the exact figure summed from
the transcript is what made the 130k gate mean anything, and a reviewer catching stale "estimate"
wording is what forced the exact-boundary tests — 130,000 fires, 129,999 stays silent (`cef9b8c`).

The second lesson is that configuration should be lazy. Roughly 37 KB of rules and reference documents
sit in this tree; inlined into every session they would cost around 8k tokens per turn. Loaded only
when a path matches, most of them cost nothing most of the time.

## Artifact

The governor is four lines of arithmetic and two design decisions:

```python
# PostToolUse hook: the exact context size, not an estimate
sum(input_tokens + cache_creation_input_tokens + cache_read_input_tokens)
# fires at 130k
# fails open — an error here never blocks the tool call
# compaction-aware — a post-compact turn reports the reset context
```

Failing open is the load-bearing one. A budget check that can block work becomes a second thing that
can break the session, and the whole point of it was to make the first failure visible.
