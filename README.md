<div align="center">

# ai-coding-journey

**One person's path from a 20-year coding pause to shipping a ~5k-commit app with AI coding agents — written as a public, markdown-first knowledge base. Method and governance, never a demo.**

[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![markdownlint](https://img.shields.io/badge/markdownlint-cli2-000000?logo=markdown&logoColor=white)](https://github.com/DavidAnson/markdownlint-cli2)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)
[![Live](https://img.shields.io/badge/Live-vercel-000000?logo=vercel&logoColor=white)](https://ai-coding-journey-five.vercel.app)

[What it is](#-what-it-is-and-isnt) · [Read it](#-reading-it) · [Decode a chapter](#-decoding-a-chapter) · [Stages](#-the-five-stages) · [The two rules](#-the-two-content-rules) · [Build it](#-building-it) · [Chapters](content/journey/README.md) · [Prompts](content/prompts/agent-loop.md)

</div>

> **Status 2026-09-06:** the markdown under `content/` is the product and renders on GitHub as-is. An
> Astro site (inc3) now builds the journey and prompts routes from those same files; `case-study/` and
> `course/` are wired collections over empty directories, and the whole thing renders live at
> **[ai-coding-journey-five.vercel.app](https://ai-coding-journey-five.vercel.app)**. `make ship` is the
> release — and the push it ends with *is* the deploy ([Deploying it](#-deploying-it)).

It is a chapter per repo, in the order the repos were started, tracing how the tooling moved from a chat
window to agents running under a written review system. The author **does not read the generated code**;
the chapters show the rules, gates and caught defects that stand in for reading it. Every chapter owes at
least one real artifact and a *What didn't work* section — **failures get equal billing.**

## Contents

**Start here** — the short version

- 🎯 [What it is (and isn't)](#-what-it-is-and-isnt)
- 📚 [Reading it](#-reading-it)
- 🪜 [The five stages](#-the-five-stages)

**How it works** — the structure, in detail

- 📖 [Decoding a chapter](#-decoding-a-chapter)
- 📐 [The two content rules](#-the-two-content-rules)
- 🧮 [How the timeline is generated](#-how-the-timeline-is-generated)

**Reference** — the machinery behind the pages

- 🧰 [Building it](#-building-it) — the one verification gate
- 📁 [Repository map](#-repository-map)
- 🧭 [Status and roadmap](#-status-and-roadmap)

---

## 🎯 What it is (and isn't)

- **Is:** a worked account of one person's method — the prompts actually typed, the rules that constrain
  the agent, the gates that have to go green, and the defects those gates caught. Written for engineers
  and managers who want the governance layer.
- **Isn't:** a tutorial, a tool review, or a portfolio. It does not claim a technique generalises; it
  names the repo, the date and the evidence, or it says nothing. Private repos contribute lessons and
  sanitised markdown only — no code, no live URLs, no colleague names.

---

## 📚 Reading it

Start at [`content/journey/`](content/journey/README.md) — a generated index table of every repo with
≥5 commits, in start-date order, each row linking to its chapter. Repos below that threshold get one line
in [`00-experiments.md`](content/journey/00-experiments.md) instead of a chapter of their own.

| Where | What is there |
| --- | --- |
| [`content/journey/`](content/journey/README.md) | one chapter per repo — the spine of the book |
| [`content/prompts/`](content/prompts/agent-loop.md) | prompts reproduced as typed, typos and Estonian notes-to-self included |
| `content/case-study/` | the sanitised `.md` layer of a private production repo *(empty until inc5)* |
| `content/course/` | the course skeleton — module, outcome, chapters it draws on *(empty until inc5)* |
| `content/timeline.json` | the generated spine every index and frontmatter block is synced from |

Chapters are written out of order and land as stubs first, so a chapter can be a heading skeleton with
`artifact: pending` in its frontmatter. The index table and the `artifact:` key are the honest
progress meter; no count is published on this page, because a hardcoded one rots.

---

## 🪜 The five stages

Each repo is tagged with the stage of the journey it belongs to (`STAGE` in
`scripts/timeline-from-git.py`, mirrored into every chapter's frontmatter and validated by the Zod
schema in `src/content.config.ts`). The stages are a description of what changed in the working method,
not a maturity ladder:

| Stage | What the method looked like |
| --- | --- |
| **chat** | code pasted in and out of a chat window; the human is the integration layer |
| **local-llm** | models run locally, retrieval and evaluation built by hand |
| **first-agent** | an agent edits the repo directly; small, short-lived experiments |
| **config-engineering** | the artifact under work is the *configuration* — rules, skills, gates |
| **production-app** | agent-written applications shipped and operated under a review system |

---

## 📖 Decoding a chapter

Every chapter is the same six parts. Here is one, annotated:

```text
---                                        ← frontmatter, four keys of it GENERATED
title: crash-dash
repo: crash-dash                              from git by scripts/timeline-from-git.py
start: 2026-06-25                             (start · end · commits · stage) —
end: 2026-09-06                               never hand-edited, resynced on every run
commits: 4978
stage: production-app                      ← one of the five stages above
tools: [claude-code]                       ← what was actually driving the keyboard
deck: false                                ← is this chapter in the lecture deck yet
artifact: present                          ← present = the evidence rule is satisfied
---

# 13 · crash-dash                          ← NN · repo, matching the index row

## What I was trying to do                 ← the goal, stated plainly, no framing
## What didn't work                        ← REQUIRED, and before the lesson
## What I learned                          ← the lesson, earned by the section above
## Artifact                                ← the evidence: a prompt, a rule excerpt,
                                              a caught defect + its fix commit, or a
                                              measured number with how it was measured
```

Read it top to bottom:

| Piece | Example | Meaning |
| --- | --- | --- |
| **Frontmatter** | `commits: 4978` | Generated from the repo's git log. Prose cites counts rounded ("roughly 4,970"), never exact, so a regen doesn't strand a sentence. |
| **Stage** | `production-app` | Which rung of the method this repo belongs to (see [the five stages](#-the-five-stages)). |
| **`artifact:`** | `present` / `pending` | Whether the chapter carries its evidence yet. `present` with an empty `## Artifact` body reds the test suite. |
| **`## What didn't work`** | *"A green test suite that never touched the code it claimed to cover."* | Required in every chapter. A chapter with only lessons is not done. |
| **`## Artifact`** | the repo's own rule, quoted and dated: *"A retune is a ONE-place edit — never restate a cut's value."* | The one section that makes a claim checkable by someone who wasn't there. A private repo contributes rule excerpts and dates, never code or commit SHAs. |

So a chapter says: *here is what I set out to do, here is what failed and how I know, here is what that
taught me, and here is the artifact you can check it against.*

---

## 📐 The two content rules

Both are binding, both are executable — the vitest suite in `tests/content.test.ts` is their machine
half, and `.claude/rules/content-writing.md` their prose half. The two are mirror-tested against each
other, so a reworded rule reds instead of rotting quietly.

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

> Every assertion above owes a mutate-and-confirm-red demo before it counts as verified. A check that
> cannot fail proves nothing — which is itself one of the lessons the chapters keep arriving at.

---

## 🧮 How the timeline is generated

`scripts/timeline-from-git.py` is the single source of the spine. It scans the repos under `~/projects`,
reads each git log, and writes three things:

1. **`content/timeline.json`** — repo · first commit · last commit · commit count · stage.
2. **`content/journey/README.md`** — the index table, regenerated whole.
3. **The four generated frontmatter keys** in every chapter (`start` · `end` · `commits` · `stage`),
   rewritten in place — plus a fresh chapter **stub** the first time a repo crosses **5 commits**.

Nothing on that list is hand-edited; `make timeline` regenerates and the result is committed. Because
the script scans *all* of `~/projects`, another repo's commits are enough to stale this repo's
`timeline.json` — which is why the gate reports drift **loudly but never blocks on it**.

---

## 🧰 Building it

```bash
make            # list every target
make check      # THE gate — run it once per step
make timeline   # regenerate timeline.json + the index, then commit the regen
make dev        # Astro dev server on localhost:4321
make ship       # clean tree + gate + push — the push is the deploy
```

`make check` is four parts, all reported — the first three blocking:

| Part | Blocks? | What it catches |
| --- | --- | --- |
| `markdownlint-cli2` over every `.md` | ✅ | formatting drift across the product itself |
| `astro build` | ✅ | the Zod frontmatter gate — a bad `stage` enum, a string `commits`, an out-of-enum `artifact` |
| `vitest run` | ✅ | the evidence rule, the missing `What didn't work`, the banned vocabulary, and the two mirrored constants |
| timeline drift report | ❌ advisory | a stale `timeline.json` — printed as a diff with `make timeline` named as the fix |

The drift probe snapshots the generated files, runs the script, compares, and restores them on **every**
exit path, so the report cannot leave edits in the tree. The one thing it cannot undo is a **new chapter
stub** — those are reported as untracked and deliberately left in place for you to fill in.

Never gate a commit on `cmd | tail`: the pipe reports tail's exit status, not the command's.

---

## 🚀 Deploying it

The site is **static**. `astro build` writes plain HTML into `dist/` — no server runtime, no serverless
functions, and **no `@astrojs/vercel` adapter**: Vercel auto-detects a static Astro project, and installing
an adapter would switch the build to a server output nothing here needs. `vercel.json` states the same
settings explicitly so the build does not depend on detection.

The one-time setup — sign in at [vercel.com](https://vercel.com) with the GitHub account that owns the
repo, **Add New… → Project → Import** `ai-coding-journey`, leave every build setting untouched because
`vercel.json` already declares them — was done on 2026-09-06. The project now lives at
[ai-coding-journey-five.vercel.app](https://ai-coding-journey-five.vercel.app).

There is nothing left to run: Vercel's git integration builds and publishes **every push to `main`**, so
`make ship` (clean tree → gate → push) is the whole release. `make ship` deliberately does not call the
`vercel` CLI — that would publish the same commit twice and would need a linked `.vercel/` directory a
fresh clone does not have. Nor is there a GitHub Actions workflow: Vercel builds on its own
infrastructure, so a push costs no Actions minutes.

⚠ A green push is still not a green site — check the deployment.

---

## 📁 Repository map

| Path | What it holds |
| --- | --- |
| `content/` | **the product** — journey, prompts, case study, course, timeline |
| `src/` | the Astro site: `content.config.ts` (the schema), layouts, and the journey/prompts routes |
| `tests/content.test.ts` | the executable half of the two content rules |
| `vercel.json` | the static-build settings Vercel reads — framework, build command, `dist` |
| `scripts/timeline-from-git.py` | the generator behind `timeline.json`, the index, and chapter stubs |
| `scripts/onenote/` | the export path that lifts the source notebook out of Windows |
| `sources/` | gitignored OneNote exports — raw input, never published |
| `.claude/rules/` | the path-gated conventions the agent works under — the executable rules' prose half |
| `CLAUDE.md` | the agent's brief for this repo: where things live, the one gate, the constraints |

---

## 🧭 Status and roadmap

**Live today:** thirteen chapters (several still stubs) plus the experiments round-up, one prompts page
lifted verbatim from OneNote, a generated timeline and index, the two content rules in executable form,
and an Astro build over the same markdown — home, journey and prompts routes, with `case-study/` and
`course/` as wired empty states, committed Vercel settings and a `make ship` whose push is the deploy.

**Where it's heading.** Fill the pending chapters to `artifact: present`; publish the sanitised
crash-dash case study and the course skeleton (inc5); then the web-native lecture deck (TalTech, 19 Nov 2026), which is what the
`deck:` frontmatter key is reserved for. Interactive explorers over `timeline.json` come after that,
and a book from the same files is the long horizon.

Increments stay thin — one session each, visible on GitHub the same day. The binding constraint is not
ambition; it is the token budget.
