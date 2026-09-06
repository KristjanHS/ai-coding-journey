---
name: Dev workflow — the one gate, and what it does not cover
description: How to verify a change to the Astro site — the single `make check` gate, the release path, and the two coverage holes the gate cannot see
paths:
  - "src/**/*.{astro,ts}"
  - "astro.config.*"
  - "vitest.config.*"
  - "Makefile"
---
# Dev Workflow (Astro / vitest)

Stack: **Astro 7.3.1** static output (no adapter — Vercel auto-detects a static Astro build), Node
v22.19.0, npm 11.6.0. Markdown under `content/` is the source; `src/` renders it. `Makefile` is in this
rule's `paths:` on purpose — it defines the gate, so editing it loads the gate's contract.

## The one gate

**`make check`** = `markdownlint-cli2` (BLOCKING) + `astro build` (BLOCKING) + `vitest run` (BLOCKING) +
a timeline drift report (ADVISORY). Run it **once per step** — don't re-run to "confirm".

Each part answers something the others can't:

- **markdownlint** covers every `.md` except the four ignored trees in `.markdownlint-cli2.jsonc`
  (`node_modules`, `sources`, `docs/plans/archive`, **`.claude`**). ⚠ `.claude` is ignored, so **this file
  and every sibling rule are outside the lint gate** — a malformed rule `.md` never reds `make check`.
  The ignore wins even over an explicit path argument (`markdownlint-cli2 '.claude/rules/*.md'` reports
  `Linting: 0 files`), so a rule edit is reviewed by eye, not by the gate.
- **`astro build`** carries the Zod frontmatter gate from `src/content.config.ts`: a bad `stage` enum, a
  string `commits`, or an `artifact` value outside `present|pending` fails the build. It is the only part
  that sees frontmatter *types*.
- **`vitest run`** is the executable half of `content-writing.md` — the evidence rule and the anti-hype
  rule as assertions. Authoring guidance for those tests → `testing-project.md`.
- **timeline drift never blocks.** `scripts/timeline-from-git.py` scans all of `~/projects`, so another
  repo's commits stale `content/timeline.json` — failing on that would red a content commit for activity
  outside this repo. `make timeline` regenerates; commit the regen.

**Never gate a commit on `cmd | tail`** — the pipe reports tail's exit status, so a red run reads green.
The `lint`/`site`/`test` targets each capture-and-replay instead of piping, for exactly this reason.

## What the gate does not cover

`vitest.config.mts` sets `include: ['tests/**/*.test.ts']` — **TypeScript only, under `tests/` only**. A
plain `.js` helper, or a `.test.ts` co-located anywhere else, is collected by nothing; `astro check`/`tsc`
skip plain `.js` too, so such a file has no checker at all. Put test code in `tests/` with a `.test.ts`
extension, or it is unverified by construction.

The gate also cannot see **rendered** behavior. Never mark a page-visible claim "verified" from the source
or a passing build — a green `astro build` proves the page compiled, not that it says the right thing.
Drive the actual path (`make preview` over `dist/`, or `make dev`) and say what you drove versus what
remains the user's eye.

## Release

**`make ship` is the release**: refuse a dirty tree → `make check` → `git push`. **The push IS the
deploy** — Vercel's git integration builds and publishes every push to `main` once the repo is imported on
vercel.com. There is deliberately no `vercel` CLI call in the recipe (it would publish the same commit
twice and needs a linked `.vercel/`), and no separate build step (`check` already runs `astro build`, so
`dist/` is proven before the push).

⚠ **A green push is not a green site.** Until the dashboard import has happened a push publishes nothing
but the GitHub-rendered markdown; after it, the Vercel build can still fail on its own. Confirm the
deployment — never infer it from a successful push. Drift stays advisory here too: a stale
`timeline.json` never blocks a release.

The output is **static** — no adapter. Never install `@astrojs/vercel`: it switches the build to a server
output nothing here needs. `vercel.json` states framework, build command and `dist` explicitly rather than
relying on Vercel's auto-detection.

## Code review

**A review range is `<first-commit>^..<last>`, never `<first-commit>..<last>`** — `A..B` excludes `A`, so
naming the stage's first commit as the base silently drops its diff while the report still reads like full
coverage. Confirm with `git rev-list --oneline <range>` before dispatching, and record that commit list,
not the range, as what was read.

## Shared plan directory

`docs/plans` is a **symlink** into `~/projects/dotfiles/docs/plans/ai-coding-journey`. A spec edit commits
in `dotfiles`, not here — pathspec it, and never `git add -A` in either repo.

Sibling rules: `testing-project.md` · `content-writing.md` · `plan-hygiene.md`.
