---
title: fte-budget-planner
repo: fte-budget-planner
start: 2026-03-31
end: 2026-07-27
commits: 668
stage: planning
stage_peak: configuring
could_see: path-gated-rules
versioned: code-and-rules
verified_by: tests
cost_to_look: counts-only
tools: []
deck: false
artifact: present
---

# 08 · fte-budget-planner

## What I was trying to do

An Excel workbook generator for a multi-year grant-funded project: planned FTE per work package,
actual EUR spend per month, and overcommitment detection per person. The binding rule was that
Python writes *formulas*, never computed values, so the workbook stays live for people who only
ever open Excel. By spring 2026 that part worked. The work these notes cover is the second job —
making my own sessions on the repo cheaper, and adopting the agent configuration I had refined in
two other repos instead of maintaining a third copy of it here.

Calling that adoption undersells one half of it. The hook the 2026-07-27 failure below is about was
first written *here*: `.claude/hooks/docs-bloat-gate.py` was added in this repo on 2026-04-25
(`feat(hooks): add docs-bloat-gate PreToolUse + companion rule trims`), rebuilt as v2 on 2026-04-27,
and iterated six times before it was promoted into my global configuration in May. The inherited
suite below is therefore a test for a hook this repo authored and later re-adopted from elsewhere.

## What didn't work

Copying a configuration between repos quietly copies its assumptions. On 2026-07-27 `make check`
was red on a clean tree: 57 failures, all in one inherited hook test suite, and my changes were not
the cause — stashing them left 57 failed / 21 passed at clean HEAD. The suite asserted that a write
to a gated path was *blocked*; the gate it pinned had been made advisory two days earlier, on
2026-07-25. It pinned a contract that had been deliberately deleted. Worse, it was the only
remaining test for that hook anywhere, so this repo was asserting dead behaviour while the live
behaviour had no test at all.

## What I learned

A copied rule brings a copied test, and the test is the half that rots silently: the rule stops
applying the day the source repo changes its mind, and nothing tells the copy. The fix is an
ownership question, not a cleanup — re-pin the suite to the advisory contract it actually has, or
restore blocking where the hook itself lives — so it belongs in front of the person who owns the
hook, not inside the config-adoption session that tripped over it.

The second lesson is smaller and concrete. A passing test run's output is almost entirely progress
dots, and filtering them out is a one-line change to how the command is invoked: one run's stdout
went from 672 bytes to 32. What that saves across a whole session I never measured — the byte count
on a single run is the whole claim. The filter passes failure blocks intact, and it is for reading
a run, never for gating a commit on one — the pipe reports `tail`'s exit status, not the suite's.

## Artifact

The inherited suite's diagnosis, from the repo's own working notes, now housed with the hook it
pinned: [The copied test pinned deleted behaviour](../atoms/configuring--a-copied-test-pins-dead-behaviour.md)

## Atoms

- [The copied test pinned deleted behaviour](../atoms/configuring--a-copied-test-pins-dead-behaviour.md)
