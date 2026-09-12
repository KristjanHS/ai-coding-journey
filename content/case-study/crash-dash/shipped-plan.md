---
title: "A shipped plan doc: the alternatives-rejected pattern"
summary: "What a plan looks like before it is built — and why the rejected options are the part worth keeping."
origin: "docs/plans/archive/ — a shipped plan doc, 2026-06-29"
date: 2026-06-29
---

*Substituted slot.* The plan doc originally picked for this artifact was mostly domain physics; generalising
it would have removed about seventy per cent of its substance and left a shape with nothing in it. This one
is architectural, so it survives the rewrite intact — and it shows the pattern better anyway.

The problem: three separate one-shot scripts for re-fetching historical data, each a copy-pasted skeleton of
roughly two hundred lines. Four frictions followed — production credentials handled ad hoc, real authoring
cost for each new script, no uniformity between them, and no way to schedule any of them.

## The doc's shape

Goal and motivation · chosen approach **with the alternatives rejected** · one section per design seam ·
security caveats · testing strategy · out of scope. Ten sections, about a hundred lines.

## The alternatives, and why each lost

- **A thin dispatcher** that left the scripts untouched and kept the job list inside control flow.
  Rejected: the canonical list would live in code rather than data, so a "run everything" flag and the
  scheduled runner would each have to re-derive it. A small explicit registry buys one source of truth.
- **A convention glob** that discovered jobs by filename pattern and dynamic import. Rejected as
  implicit — it conflicts with the repo's minimal-seams rule, and an explicit three-entry list is plainly
  clearer than a naming convention you have to already know about.
- **Moving the work to a scheduled serverless function.** Rejected on a measured constraint: the batch
  sizes involved risk the platform's execution timeout, which is why the scripts ran on a host in the
  first place.

Two of the three rejections are about *legibility*, not capability. Both alternatives would have worked.

## The chosen shape

A registry binding a job name to its orchestration function and its live dependencies; one runner that
dispatches by name and serves as the single front door for both the command line and the scheduler. The
existing scripts export their orchestration functions unchanged — the runner wraps them.

The credential seam is a precedence ladder: use credentials from the environment if present; on a
production host without them, fetch from the management API; locally without them, **fail loudly** rather
than falling back. Environment files are loaded conditionally on the chosen mode, so a production run can
never read a local file and quietly write to the wrong database.

Failure is per-job and non-fatal: a failing job is recorded, the run continues, and the process exits
non-zero if any job failed — so a partial backfill can never read as a success.

## What "done" meant

Type-check clean; unit tests covering the precedence ladder with no network or filesystem, and the argument
parsing and dispatch against fake jobs; the existing backfill tests unchanged. Explicitly out of scope: any
new backfill, changes to the incremental path, converting anything to serverless.

## What didn't work

The first draft had no alternatives section — just the chosen design, argued forward. Review sent it back:
without the rejected options, a reader six months later cannot tell whether a constraint was load-bearing or
an accident, and re-litigates it. The rejections are now the part of the doc that gets re-read; the chosen
design is in the code.
