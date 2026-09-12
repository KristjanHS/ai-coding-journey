---
title: dotfiles
repo: dotfiles
start: 2026-04-05
end: 2026-09-12
commits: 884
stage: configuring
stage_peak: governing
could_see: path-gated-rules
retrieved: grep-on-demand
versioned: governance
verified_by: agent-run-gate
cost_to_look: cache-reuse
tools: []
deck: true
artifact: present
---

# 11 · dotfiles

## What I was trying to do

Stop retyping the same corrections to the agent. By the middle of 2026 every session started the same
way: re-explaining how I want commits scoped, which paths are off limits, when to delegate a read to a
sub-agent. The dotfiles repo — stow-managed configuration for a WSL2 Ubuntu machine, shell and git and
editor — became the place that instruction set lives, versioned in git like the code it governs.

The point was not tidiness. An instruction that lives in a chat window is gone at the end of the
session; the same instruction in a file is loaded before the agent's first token and applies to every
project that path-matches it.

## What didn't work

Installing a skill for a one-off job. `dead-code-detector` and `unused-code-cleanup` went into the tree
for a single cleanup pass over a private app, and came back out once the job landed — commit `938206a`,
with the rationale recorded as "no longer needed locally".

The cost of a skill is not its install; it is that its description is loaded in every session
afterwards, whether or not the job it was built for ever recurs. One-off tooling belongs in a sub-agent
that dies with the task, not in a config tree that outlives it.

## What I learned

Configuration is engineering work, and it fails the way code fails. A rule that never fires is dead
code. A rule that contradicts another is a race condition. A rule with no way to observe whether it was
followed is an untested branch.

The surface is small enough to count and large enough to need counting: 10 rules, 29 skills and 25
references across roughly 730 commits, as of September 2026. The counts are the only reason I can say
whether an addition is a real gain or just more text the model has to read first.

## Artifact

The most-cited rule in the tree is a budget on prose, not on code: a unit of agent-written text
"Never extends to a third line, nested bullet, or sibling unit — overflow goes to the commit
message: durable, greppable, attached to the diff." — and why that overflow clause is what makes
the rule hold is in
[A rule that caps text needs somewhere for the overflow to go](../atoms/configuring--overflow-needs-somewhere-to-go.md)

## Atoms

- [A skill costs every session, not just the job it was for](../atoms/configuring--a-skill-costs-every-session.md)
- [Climb one rung](../atoms/configuring--climb-one-rung.md)
- [A rule that caps text needs somewhere for the overflow to go](../atoms/configuring--overflow-needs-somewhere-to-go.md)
- [Ask once the target is known](../atoms/governing--ask-once-the-target-is-known.md)
- [One control reached the fleet in a day](../atoms/governing--one-control-reached-the-fleet-in-a-day.md)
- [The global file grew, then was cut back](../atoms/governing--the-global-file-was-cut-back.md)
- [The ladder on one page](../atoms/governing--the-ladder-on-one-page.md)
