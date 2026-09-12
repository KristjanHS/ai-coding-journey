---
title: crash-dash
repo: crash-dash
start: 2026-06-25
end: 2026-09-12
commits: 5185
stage: configuring
stage_peak: governing
could_see: path-gated-rules
retrieved: grep-on-demand
versioned: governance
verified_by: agent-run-gate
cost_to_look: cache-reuse
tools: [claude-code]
deck: true
artifact: present
---

# 13 · crash-dash

## What I was trying to do

Ship and operate a production dashboard application without reading the generated code.

That is the honest description, and the whole point of this chapter. The repo is private, so nothing
here quotes its source. What can be shown is the layer I *do* write and read: the rules that constrain
the agent, the gates that have to go green, and the defects those gates caught.

Scale is what forces the question. This repo's git log holds roughly 5,000 commits between
2026-06-25 and 2026-09-12. The Claude Code era row in `eras.json` reports 15 commits for its own
window, 2026-06-23 to 2026-09-06, because it counts my `.claude` config repo, not this one. Repo
scope and tool scope are separate measurements here and neither stands in for the other. A rate like the first number is survivable only if the
review system, not my attention, is what holds quality.

## What didn't work

**Duplicating a threshold in the places that "document" it.** Tuning values lived in the registry that
owns them *and* in docblocks, test fixtures, mock levels and plan prose. Every retune became a
grep-and-replace sweep, and what I missed was found by review rather than by anything failing. The
copies were all written for good reasons — a docblock naming the current value is genuinely more
readable, right up to the moment it is wrong.

**A green test suite that never touched the code it claimed to cover.** A simulation gate synthesised
confirmed states directly, so it never reached the resolution layer, never emitted the downstream
evaluation step, and carried no history. It passed reliably while telling me nothing about any change
to the layers it skipped. Chapter 02's untested filter is the same defect from the opposite direction:
there no test existed; here one did, and was worse than none, because it produced confidence.

**Test isolation leaking across files.** One test file deleted a global and left it deleted for every
sibling in the same worker; under a shared runner config that contaminated unrelated tests. The fix
commit subject is the whole story: *"fix(test): auth-session.test.js leaked a deleted globalThis.fetch
into the whole worker"*. The guard — save and restore the real global per file, assert a marker — was
retrofitted into the project's test rules only after the bug had happened.

## What I learned

**Write the constraint where it can be checked, not where it reads well.** The single-source rule below
exists because the alternative was tested and failed. It does not ask for care; it names the one file
that may hold a value and forbids every restatement, including the friendly ones.

**A passing gate is a claim, and claims need falsifiers.** The rule that a simulation "is not evidence"
is the most useful sentence in the repo. It turns a green check from a conclusion into a question:
*what did this actually execute?* Every gate I trust can answer that with a real-data replay.

**Not reading the code is a governance position, and it is delegation I can count.** I read rules,
plans, test names, review findings and commit messages; I do not read implementations. The logs price
that: subagents account for the majority of the era's tokens — 53.7% against 46.3% in the sessions I
typed into — spread across 48.1% of main sessions. Roughly half my sessions delegate at all, and those
that do outweigh every session that does not. The position is defensible exactly as far as the
verification layer reaches, and no further.

## Artifact

From the repo's indicator rules — the rule that ended the duplicated-threshold problem. The rule file
was created 2026-07-25; this wording entered it on 2026-07-28:

```text
A retune is a ONE-place edit — never restate a cut's value. registry.ts is the
single source for an indicator's cuts. Do not copy the current numbers into a
docblock, a test fixture, a mock level, a plan doc, or docs/public prose —
every copy is a second source that has to be hand-found on the next retune.
```

And from the research-probe rules — the rule that ended the false-confidence problem. That file dates
from 2026-07-25 too, but this rule was written only after the failure it describes, on 2026-08-07:

```text
sim:notify is not evidence. It synthesizes confirmed STATES directly, so it
never reaches resolveCuts, never emits delta20/evaluateLegs, and carries no
fold history — a green sim says nothing about a cut-layer, leg-attribution,
within-band or stateful-trigger change. Verify by real-close replay.
```

Both are written as prohibitions with named mechanisms rather than as advice. That is deliberate: an
agent can comply with "never restate a cut's value" and cannot meaningfully comply with "keep
configuration DRY".
