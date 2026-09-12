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
commit is quoted below.

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

The project-authored rule that raises this chapter's peak to `configuring` — `.claude/rules/api-routes.md`,
verbatim as first committed in `ca0f68d` on 2026-06-24. It is not in the global config baseline; it
names this app's routes, its upstream weather services and its own error shape:

```markdown
---
paths:
  - "app/api/**/route.ts"
last_verified: 2026-06-24
---
# API Route Conventions

## Conventions

App Router `GET` handlers (`app/api/<name>/route.ts`) proxying external weather APIs. No dynamic `[id]` routes yet — when added, params are a Promise: `await context.params`.

- **Live data**: set `export const dynamic = "force-dynamic"`, else Next caches the response at build time.
- **External fetch**: `fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" })`, then `if (!response.ok) throw new Error(...)`.
- **Required env vars**: guard before use — `if (!apiKey) return NextResponse.json({ error: "Missing X" }, { status: 500 })`.
- **Errors**: `NextResponse.json({ error, detail? }, { status })`. No `{ success, data }` envelope — keep success payloads route-specific.
- **XML parsing** (`humidity`/`beach` via `xml2js`): prefer a typed shape over widening to `any`.
```

The wrap bug, commit `ffbc0ca` dated 2026-06-24, message body verbatim with the trailers dropped:

```text
Add lib/geo.test.ts and fix degToCompass wrap bug

Task 3 of test-framework-design plan. Tests: haversine (identity,
1-deg latitude ~111.19 km, known city pair); dmsToDecimal;
degToCompass boundaries + 360 wrap; findNearestStation incl.
empty-array -> null.

Fixes a real production bug surfaced by the boundary test:
degToCompass used Math.round((deg/45) % 8), so bearings in
[337.5, 360) rounded 7.5 -> 8 and returned dirs[8] === undefined.
Corrected to Math.round(deg/45) % 8.
```

The reviewer-caught defect and its fix, commit `e71fe18` the same day, trailers dropped:

```text
Address code review (Important): unstub globals + drop dead import

- Add vi.unstubAllGlobals() to every afterEach. vi.restoreAllMocks()
  does not unwind vi.stubGlobal('fetch', ...); without this, a future
  test added after a stubbing test in the same file would silently
  inherit the stub instead of the real global.
- Remove the dead 'import { afterEach, beforeEach } from "vitest"' in
  the weather test — beforeEach was unused and afterEach is already a
  global (globals: true).
```

And the opening of the test-framework design document, `docs/plans/2026-06-24-test-framework-design.md`
as first committed in `ef11c41` on 2026-06-24 and archived the next day — the first fourteen lines:

```text
# Test Framework Design — dewpoint-ts

**Date:** 2026-06-24
**Status:** Approved design (not yet implemented)
**Stack:** Next.js 15 (App Router), React 18, TypeScript 5.7 (`strict`, `noEmit`), npm, Vercel

## Goal

Introduce automated tests to a project that currently has none. Tests should protect
the real bug-risk surface — data/parsing logic, API route behavior, and basic component
wiring — without imposing infrastructure disproportionate to a one-page app.

The verification gate today is `tsc → lint → build` (no test runner). This design adds a
`test` step between lint and build.
```
