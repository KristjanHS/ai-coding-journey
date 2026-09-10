---
name: Tests — assertion validity
description: The red-demo duty, guard vacuity, and the derived-fixture premise trap for the vitest content suite
paths:
  - "tests/**/*.test.ts"
---
# Tests (ai-coding-journey)

The gate that runs these → `dev-workflow.md`. This file carries **assertion validity**: whether a passing
test could ever have failed.

## Every new assertion owes a mutate-and-confirm-red demonstration

**Mutate the exact line the assertion guards, confirm the failure, then restore it — before calling a stage
verified.** Restore by re-typing, never `git checkout -- <file>` (that destroys the uncommitted work
alongside it). The red state lives in the working tree only: never commit it. Record the failing output in
the commit message.

⚠ **The mutation must break the ASSERTION'S PATTERN, not merely the source text.** Renaming
`data-tl-table` to `data-tl-table-REMOVED` still matched `/data-tl-table/`, so the demo stayed green and
proved nothing; delete the element instead. A demo that does not red is a failed demo, never a pass.

⚠ **Scoped to NEW or CHANGED guards.** A data-only edit that leaves every assertion's text untouched — a
regenerated `timeline.json`, a reworded chapter — owes no demo: re-running one for an existing guard
re-proves what its own shipping demo already proved.

## A guard's vacuity anchor must not certify the thing it exists to catch

A content lint that searches for violations goes green the day it finds none — which is also the day it
would go green if the walker broke. Anchor its vacuity floor on something the **fix moves**, never on the
population it drains: `expect(FOUND.length).toBeGreaterThan(0)` reds the day the guard succeeds.

Anchor instead on the *corpus* the guard walked — that every chapter file was read, that a known-present
heading was found — plus one unrelated high-count fixture only a broken walker or parser can collapse.
**Exclude the guard's own file from every anchor**, or a later edit lets the test satisfy itself.

Conversely, a guard asking only "did anything match at all" goes green on a degenerate arm: pin it to the
**discriminating** property, not the total.

## A fixture derived from a constant goes vacuous when that constant is retired to zero

Deriving fixtures from a constant (never restating it) is the standing rule — but the derivation is itself
an unpinned claim. `MIN_COMMITS - 1` reads as "one short of the gate" only while `MIN_COMMITS >= 1`. Retire
the gate to `0` and it silently becomes `-1`: the test passes on every input and nothing reds.

**Recognition cue: an arithmetic offset from a constant whose plausible future includes 0.** Retiring any
gate constant therefore owes a repo-wide grep for offsets off it — not just a re-run of the suites, since
the hollowed tests stay GREEN. Pair the derived fixture with a premise guard that reds on the re-arm
(`expect(MIN_COMMITS).toBeGreaterThan(0)`), so the test fails loudly instead of quietly ceasing to
discriminate. The suite's prose-vs-source check (the banned-word bullet in `content-writing.md` against
`src/lib/content-rules.ts`) is this pattern: a restated constant that drifts reds instead of rotting.
`MIN_COMMITS` no longer has a copy to mirror — both readers load `scripts/timeline-config.json`.

## `isolate: false` silently no-ops a `vi.mock` — not yet applicable here

⚠ Kept for when a suite adds mocks. `isolate: false` does not error on a `vi.mock` — it **silently
no-ops** whenever an earlier file in the same worker already imported the real module, so the test then
runs against the real seam. **This repo is not exposed today**: `vitest.config.mts` sets no `isolate`, so
isolation stays on, and the content suite mocks nothing (it reads markdown with `node:fs`). If either fact
changes — a mock appears, or `isolate: false` is set for speed — this section becomes live and wants a
standing manifest guard over `mock`/`doMock`/`spyOn`/`stubEnv`/`stubGlobal`/`useFakeTimers`.

## An ordering assertion must be measured inside the region it claims to order

Slice to the region before comparing offsets (`html.slice(html.indexOf('class="atoms'))`) —
a page-wide `indexOf` finds a nav or link list that repeats the same identifiers in the same
order, so the assertion passes however the region is sorted.

Red-demo it by REVERSING the comparator, never by removing it: a duplicate list survives removal.
