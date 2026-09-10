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

## Web stack and the offline deck

These bind `src/**` and the Astro config; the content-governing constraints live in `2026-09-09-journey-vision.md` (docs/plans/).

- **Web stack: Astro + MDX, React/Preact islands only where interactive**, deployed on Vercel (native
  Astro preset; Cloudflare Pages / Netlify are equivalent fallbacks). Chosen for lowest per-edit token
  cost for an agent. Deck = one Astro layout over **atoms selected by facet query**, not over chapters
  flagged `deck: true`; print stylesheet → PDF fallback (USB stick). **This repo still ships no pptx** —
  what changed 2026-09-09 (user) is that the atom corpus is structured so claude.ai can emit one per
  audience from it.
- **The deck runs offline.** `is:inline` on the deck's style and script is what keeps it working from
  `file://`, not the falsifier: Astro's `build.inlineStylesheets` defaults to `auto` and only inlines under
  ~4 kB, so a plain `<style>` passes today purely because the CSS is small. Never remove either from
  `src/layouts/Deck.astro`.
- **No hydrated island ships in the deck — ruled at inc4, still binding.** The offline deck renders under
  `file://`, where a client-hydrated component cannot be relied on. inc7's 7c repoints the deck onto a
  facet query, which is new deck work: if it ever embeds the timeline or any other island, this ruling is
  reopened first, never worked around.
- **Never add a root-absolute nav link inside `src/pages/deck/`** (e.g. `/course/`). That tree is the
  slide runtime — `Deck.astro`, no `Base`, assets inline — and `tests/deck-offline.test.ts` asserts the
  built deck carries zero root-absolute `href`/`src`. Door links belong on the homepage rows.
- **Islands degrade to text.** Every interactive island embeds alongside a text equivalent in the same
  markdown — the inc4 timeline's sr-only table is the pattern. It keeps three things alive at once: the
  GitHub fallback, screen-reader access, and the pandoc → PDF/EPUB book export.

## The one gate

**`make check`** = `markdownlint-cli2` (BLOCKING) + `astro build` (BLOCKING) + `vitest run` (BLOCKING).
Run it **once per step** — don't re-run to "confirm".

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
- **`make measurements` is never figure-neutral, and the gate makes that BLOCKING.** The scanners
  re-read live log trees, so a regen run for an unrelated reason (adding an era, say) also moves the
  shares and the Claude Code split by whatever was used since the last run. `measurements.test.ts`
  mirrors those figures against the narratives, so the drift reds `make check` until
  `content/measurements/01`–`04` and `content/journey/13-crash-dash.md` carry the new numbers —
  update them in the same commit as the regen, never after it.
- **the timeline is not in the gate.** `scripts/timeline-from-git.py` scans all of `~/projects`, so
  another repo's commits stale `content/timeline.json`; the old advisory drift report ran the generator on
  every gate to print a diff nobody was meant to act on. Run `make timeline` when the spine matters and
  commit the regen on its own.

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

**`astro preview` and `astro dev` silently fall back to the next free port** and print the real one only
to their own log. Another checkout of this repo (the main tree, a sibling worktree) commonly holds 4321,
so a route sweep that curls a hard-coded port can measure *someone else's server* and come back green.
Read the port back from the server's startup line, or pass a port you have just confirmed free, and
assert one string that only this build produces before believing any of the route results.

**Markdown plugins go through `markdown.processor`, not `markdown.remarkPlugins`.** Astro 7 replaced the
unified processor with Sätteri; `remarkPlugins`/`rehypePlugins`/`remarkRehype` now hard-error at config
validation unless `@astrojs/markdown-remark` is installed beside it. Write a Sätteri mdast plugin
(`{ name, link(node, ctx) { ctx.setProperty(node, 'url', …) } }`) and pass it as
`markdown: { processor: satteri({ mdastPlugins: [...] }) }` — see `src/md-links.mjs`.

## Release

**`make ship` is the release**: `make check` against a `git archive HEAD` copy in a temp dir (node_modules
symlinked in) → `git push origin <sha>:refs/heads/<branch>`. **HEAD-only, like crash-dash's**: what is
verified is exactly what is pushed, so uncommitted work can neither reach the release nor colour its
verdict — which is why there is deliberately **no dirty-tree gate**; dirty tracked files print a heads-up
and nothing more. Two corollaries: a HEAD that bumps `package.json` is checked against the *tree's*
installed deps (run `npm install` first), and `dist/` is built in the temp copy, not in the tree. **The
push IS the deploy** — Vercel's git integration builds and publishes every push to `main` once the repo
is imported on vercel.com. There is deliberately no `vercel` CLI call in the recipe (it would publish the same commit
twice and needs a linked `.vercel/`), and no separate build step (`check` already runs `astro build`, so
`dist/` is proven before the push).

⚠ **A green push is not a green site.** Until the dashboard import has happened a push publishes nothing
but the GitHub-rendered markdown; after it, the Vercel build can still fail on its own. Confirm the
deployment — never infer it from a successful push. A stale `timeline.json` never blocks a release.

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
