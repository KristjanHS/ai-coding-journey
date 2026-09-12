---
title: dewpoint
repo: dewpoint
start: 2025-07-15
end: 2026-06-25
commits: 106
stage: suggesting
stage_peak: configuring
could_see: path-gated-rules
versioned: code-and-rules
verified_by: tests
cost_to_look: no-log
tools: []
deck: false
artifact: present
---

# 03 · dewpoint

## What I was trying to do

A one-page dew-point advisor: fetch the current weather and the forecast, compute the dew point, and
say whether to open the windows or go to the beach. It began in July 2025 as a Python and Streamlit
script carved out of a learning repo, and it is the one journey repo that lived three separate lives
with months of silence between them.

The first life was a burst. Forty commits landed on 2025-07-14 alone, and the July total was
sixty-eight; by the 17th the app was done and the repo went quiet for four and a half months. The
second life is one commit, dated 2025-12-01 and titled "ported from streamlit to ts": a Next.js app
arriving whole, about a thousand lines across sixteen files, with the Python original merged in beside
it. Ten commits that afternoon got it onto Vercel. Then nearly seven more months of nothing.

The third life is a single day, 2026-06-24, and it is why this chapter's peak rung is `configuring`
rather than the `suggesting` it opened on. Twenty-one commits that day added the project's first
tests, a project `CLAUDE.md`, four rules under `.claude/rules/` and two skills — none of them copied
from the global baseline, all git-dated inside this repo, and the rule that raises the peak, like the
instruction file, written for this app rather than installed. The project was eleven months old and
had never had a test.

## What didn't work

**A seven-month-old production bug that no reader had noticed, found by the first boundary test.** The
compass-direction helper rounded a bearing into eight sectors with the modulo applied before the
rounding, so every wind from between 337.5 and 360 degrees indexed past the end of the array and
rendered as `undefined`. It had been that way since the day of the December port. The commit that added the
first tests for that module fixed it in the same change.

**Merge-conflict markers were committed and pushed.** The December port merged the Python line into
the TypeScript repo; the commit is titled "merge conflicts", and the one that removed the markers from
the Next.js files came later the same afternoon. Between them, a fix moved the leftover Python files
out of `app/` because Vercel could not detect a Next.js project with them there. The deploy did not
work as first pushed.

**The abandoned stack steered the tools for seven months.** After the port, the Python-era lint config,
pre-commit hooks, a Python lint-and-test workflow and two workspace files pointing at a Python
interpreter stayed in the TypeScript tree until the June cleanup commit deleted them. Anything reading
the repo's configuration in that window was told it was a Python project.

**Freshly written tests leaked a stubbed global into each other.** The June test suite stubbed `fetch`
per test and restored mocks, but restoring mocks does not unwind a stubbed global, so any later test in
the same file would silently have inherited the stub. A same-day review pass caught it; the fix
commit, `e71fe18`, adds `vi.unstubAllGlobals()` to every `afterEach`.

## What I learned

**Governance arrived on one day, a year in, and it arrived together with the tests.** Nothing in the
first two lives of this repo was reviewed, tested or ruled. The rules, the instruction file and the
test framework all carry the same date, 2026-06-24, and the design document that day opens by
stating the project "currently has none". The ladder here is not a slope; it is a step, and the
step is dated.

**A test's first job is to find what the eye never checked.** The wrap bug lived in a function
nobody had reason to read for six months; the app looked right because the failing bearings are a
sixteenth of the compass. The boundary case was the first thing the test asked, and it was the first
thing that broke.

**The stack you left behind is still configuration until you delete it.** The seven-month residue did
no visible harm, which is exactly why it sat there. A tree that describes two stacks is a tree an
agent will half-read wrong.

## Artifact

The project-authored rule that raised this chapter's peak to `configuring`, and the caching line in
it that can be checked against a route file:
[The rule names its own routes](../atoms/configuring--the-rule-names-its-own-routes.md)

## Atoms

- [The rule names its own routes](../atoms/configuring--the-rule-names-its-own-routes.md)
