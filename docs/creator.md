# Working on this repo

Everything a contributor — or the author six months from now — needs to build, verify and publish this
knowledge base. The [README](../README.md) is for people **reading** the journey; this page is for people
**running** it.

- [Prerequisites](#prerequisites)
- [Building it](#building-it) — the one verification gate
- [How the timeline is generated](#how-the-timeline-is-generated)
- [The two content rules](#the-two-content-rules) — the rules themselves, then how they are enforced
- [How the content rules are enforced](#how-the-content-rules-are-enforced)
- [Deploying it](#deploying-it)
- [Repository map](#repository-map)

---

## Prerequisites

Node (for Astro, markdownlint and vitest) and Python 3 (for the timeline generator). Then:

```bash
npm install
```

The `make` targets check for the binaries they need and tell you to run `npm install` if one is missing.

---

## Building it

```bash
make            # list every target
make brief      # one-block orientation — start a session with this
make check      # THE gate — run it once per step
make timeline   # regenerate timeline.json + the index, then commit the regen
make dev        # Astro dev server on localhost:4321
make ship       # gate HEAD + push HEAD (uncommitted work ignored) — the push is the deploy
```

`make check` is three parts, all blocking:

| Part | Blocks? | What it catches |
| --- | --- | --- |
| `markdownlint-cli2` over every `.md` | ✅ | formatting drift across the product itself |
| `astro build` | ✅ | the Zod frontmatter gate — a bad `stage` enum, a string `commits`, an out-of-enum `artifact` |
| `vitest run` | ✅ | the evidence rule, the missing `What didn't work`, the banned vocabulary, and the rule prose against `src/lib/content-rules.ts` |

The timeline is not part of the gate. Run `make timeline` when you want the spine refreshed; it rewrites
`timeline.json`, the index and the generated frontmatter, and creates a chapter stub for any repo that has
newly crossed 5 commits. Review and commit that as its own change.

Two things the gate cannot see: `markdownlint` ignores `.claude/`, so a malformed rule file never reds it,
and nothing type-checks the prose. Both are reviewed by eye.

Never gate a commit on `cmd | tail`: the pipe reports tail's exit status, not the command's.

`make brief` is the orientation call that opens a session: branch and status, the last five commits, the
active plan's `##` headings, the next action, and the last gate result. The plan and next action are read
from the working pointer, never from the newest file in `docs/plans/` — a plan doc is touched when it is
ruled and archived, so a closed doc routinely outranks the live one. No pointer, no guess: it prints
`unknown (no pointer)`. The gate line comes from `.gate-stamp`, which `check` writes on green only, and
`brief` flags it when that SHA is no longer `HEAD` — the one way to see that the tree is green about a
commit you have since built on top of.

---

## How the timeline is generated

`scripts/timeline-from-git.py` is the single source of the spine. It reads the repos named in
`scripts/repos.json` (an explicit allowlist, never a `~/projects` scan — a scan made the spine a function
of whatever else sat in that directory), reads each git log, and writes three things:

1. **`content/timeline.json`** — repo · first commit · last commit · commit count · stage.
2. **`content/journey/README.md`** — the index table, regenerated whole.
3. **The four generated frontmatter keys** in every chapter (`start` · `end` · `commits` · `stage`),
   rewritten in place — plus a fresh chapter **stub** the first time a repo crosses **5 commits**.

Nothing on that list is hand-edited; `make timeline` regenerates and the result is committed. Author-owned
frontmatter (`title`, `tools`, `deck`, `artifact`) and the chapter body are never touched by the script.

Because it scans *all* of `~/projects`, another repo's commits are enough to stale this repo's
`timeline.json` — which is why the gate does **not** probe for drift. Regenerate when the spine matters.
Prose that cites a commit count is written rounded ("roughly 4,970") for the same reason: a regen must not
strand a sentence.

The stage of each repo is hand-maintained in `STAGE` in that script, mirrored into every chapter's
frontmatter and validated by the Zod schema in `src/content.config.ts`.

---

## The two content rules

Both are binding, and both are enforced by a test suite rather than by good intentions — a chapter that
breaks one of them cannot be published ([how that is wired](#how-the-content-rules-are-enforced)).

**1 · The evidence rule.** Every chapter carries **≥1 artifact block**: a real prompt, a rule or skill
excerpt, a defect a reviewer sub-agent caught (with the fix commit's subject), or a measured number
*with how it was measured*. `artifact: present` and an empty `## Artifact` section cannot coexist.

**2 · The anti-hype rule.**

- **No claim without an artifact or a number** — "X worked" names the repo, the date and the evidence.
- **Failures get equal billing** — `## What didn't work` sits before `## What I learned`, in every chapter.
- **Banned vocabulary**, grepped across every file under `content/`:

  `10x` · `game-changer` · `game changer` · `revolution` · `revolutionary` · `anyone can` ·
  `in minutes` · `no code needed` · `effortless` · `magic`

- **Positioning is governance and method, never "look what I built."**
- **Public-link gate** — before the first public link, a fresh sub-agent runs a sceptical senior-engineer
  review over `content/`; every hype finding is fixed or the sentence is deleted.

> Every check above has itself been broken on purpose once, to prove it can fail. A check that cannot
> fail proves nothing — which is itself one of the lessons the chapters keep arriving at.

---

## How the content rules are enforced

The two rules above are binding *and* executable. The vitest suite in `tests/content-*.test.ts` is their machine half; `.claude/rules/content-writing.md` is their prose half.
The banned-vocabulary list has one machine source, `src/lib/content-rules.ts`, and the suite compares the
rule's prose to it, so a reworded rule reds instead of rotting quietly. `MIN_COMMITS` likewise has one
source, `scripts/timeline-config.json`, read by both the site lib and the generator.

Every new assertion owes a **mutate-and-confirm-red demo** before the step that added it counts as
verified. A check that cannot fail proves nothing.

---

## Deploying it

The site is **static**. `astro build` writes plain HTML into `dist/` — no server runtime, no serverless
functions, and **no `@astrojs/vercel` adapter**: Vercel auto-detects a static Astro project, and installing
an adapter would switch the build to a server output nothing here needs. `vercel.json` states the same
settings explicitly so the build does not depend on detection.

The one-time setup — sign in at [vercel.com](https://vercel.com) with the GitHub account that owns the
repo, **Add New… → Project → Import** `ai-coding-journey`, leave every build setting untouched because
`vercel.json` already declares them — was done on 2026-09-06. The project now lives at
[ai-coding-journey-five.vercel.app](https://ai-coding-journey-five.vercel.app).

There is nothing left to run: Vercel's git integration builds and publishes **every push to `main`**, so
`make ship` (gate a `git archive HEAD` copy → push that same commit) is the whole release. It is HEAD-only:
uncommitted work in the tree can neither reach the release nor red its gate, so there is no dirty-tree
block — only a heads-up naming how many tracked files were left out. `make ship` deliberately does not call the
`vercel` CLI — that would publish the same commit twice and would need a linked `.vercel/` directory a
fresh clone does not have. Nor is there a GitHub Actions workflow: Vercel builds on its own
infrastructure, so a push costs no Actions minutes.

⚠ A green push is still not a green site — check the deployment.

---

## Repository map

| Path | What it holds |
| --- | --- |
| `content/` | **the product** — journey, prompts, case study, course, timeline |
| `src/` | the Astro site: `content.config.ts` (the schema), layouts, and the journey/prompts routes |
| `tests/content-*.test.ts` | the executable half of the two content rules |
| `vercel.json` | the static-build settings Vercel reads — framework, build command, `dist` |
| `scripts/timeline-from-git.py` | the generator behind `timeline.json`, the index, and chapter stubs |
| `scripts/onenote/` | the export path that lifts the source notebook out of Windows |
| `sources/` | gitignored OneNote exports — raw input, never published |
| `.claude/rules/` | the path-gated conventions the agent works under — the executable rules' prose half |
| `CLAUDE.md` | the agent's brief for this repo: where things live, the one gate, the constraints |
| `docs/plans/` | the living spec and the per-increment specs (a symlink out of the repo) |
