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

An Excel workbook generator for a multi-year EU-funded project: planned FTE per work package,
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
on a single run is the whole claim.

## Artifact

From this repo's private working notes, dated 2026-07-27 and 2026-04-26 — sanitised excerpts,
not a public page. The output filter, as used:

```bash
python3 -m pytest tests/ -q 2>&1 | grep -vE '^[.sxXFEP]+ +\[ *[0-9]+%\]$' | tail -20
```

Measured on one passing run's captured stdout: **672 bytes → 32 bytes**. Failure blocks do not
match the filtered shape, so they survive intact. The pipe reports `tail`'s exit status, not the
suite's, so this form is for reading a run, never for gating a commit on one.

The inherited-suite diagnosis, verbatim from the same notes:

> `make check` is red on a clean tree — 57 pre-existing failures, all in
> `tests/hooks/test_docs_bloat_gate_v2.py`. Verified pre-existing by stashing my changes (57 failed
> / 21 passed at clean HEAD). The cause: that suite asserts `rc == 2` (blocked) for writes to gated
> paths, but the global `docs-bloat-gate.py` header now reads "Signals on .md writes (all advisory —
> warn, never block)" — S2/S3 became advisory and the S1 tier caps were removed on 2026-07-25. The
> suite pins a contract that was deliberately deleted.
