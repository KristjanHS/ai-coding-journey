---
title: Two crash-dash rules written as prohibitions
source: private repo crash-dash — the indicator rules and the research-probe rules under `.claude/rules/`
kind: rule
captured: 2026-07-28/2026-08-07
---

# Rule · a prohibition with a named mechanism

From the dashboard repo's indicator rules — the rule that ended the duplicated-threshold problem.
The rule file was created 2026-07-25; this wording entered it on 2026-07-28:

```text
A retune is a ONE-place edit — never restate a cut's value. registry.ts is the
single source for an indicator's cuts. Do not copy the current numbers into a
docblock, a test fixture, a mock level, a plan doc, or docs/public prose —
every copy is a second source that has to be hand-found on the next retune.
```

And from the research-probe rules — the rule that ended the false-confidence problem. That file
dates from 2026-07-25 too, but this rule was written only after the failure it describes, on
2026-08-07:

```text
sim:notify is not evidence. It synthesizes confirmed STATES directly, so it
never reaches resolveCuts, never emits delta20/evaluateLegs, and carries no
fold history — a green sim says nothing about a cut-layer, leg-attribution,
within-band or stateful-trigger change. Verify by real-close replay.
```

Both are prohibitions with named mechanisms rather than advice. That is deliberate: an agent can
comply with "never restate a cut's value" and cannot meaningfully comply with "keep configuration
DRY". Both rules are still in use.

## What didn't work

The states each rule closed: tuning values restated in docblocks, fixtures, mock levels and plan
prose, so that every retune became a grep-and-replace sweep; and a simulation gate that passed
reliably while never touching the layers it claimed to cover.

## Where it came from

A private production repo's `.claude/rules/` tree. The repo is not public, so a reader cannot open
the files; the excerpts are sanitised verbatim, and the journey chapter that cites them
([13 · crash-dash](../journey/13-crash-dash.md)) names the defect each rule was written after.
