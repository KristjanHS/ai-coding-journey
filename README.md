<div align="center">

# Journey to AI coding agent governance

**One person's path from a 20-year coding pause to shipping a ~5k-commit app with AI coding agents — written as a public, markdown-first knowledge base. Method and governance, never a demo.**

[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![markdownlint](https://img.shields.io/badge/markdownlint-cli2-000000?logo=markdown&logoColor=white)](https://github.com/DavidAnson/markdownlint-cli2)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)
[![Live](https://img.shields.io/badge/Live-vercel-000000?logo=vercel&logoColor=white)](https://ai-coding-journey-five.vercel.app)

[What it is](#-what-it-is-and-isnt) · [Read it](#-reading-it) · [Decode a chapter](#-decoding-a-chapter) · [Stages](#-the-six-stages) · [The two rules](docs/creator.md#the-two-content-rules) · [Chapters](content/journey/README.md) · [Context artifacts](content/artifacts/agent-loop.md)

</div>

> **Status 2026-09-06:** the markdown under `content/` is the product and renders on GitHub as-is. An
> Astro site (inc3) now builds the journey and context-artifact routes from those same files; `case-study/` and
> `course/` are wired collections over empty directories, and the whole thing renders live at
> **[ai-coding-journey-five.vercel.app](https://ai-coding-journey-five.vercel.app)**.

It is a chapter per repo, in the order the repos were started, tracing how the tooling moved from a chat
window to agents running under a written review system. The author **does not read the generated code**;
the chapters show the rules, gates and caught defects that stand in for reading it. Every chapter owes at
least one real artifact and a *What didn't work* section — **failures get equal billing.**

## Contents

**Start here** — the short version

- 🎯 [What it is (and isn't)](#-what-it-is-and-isnt)
- 📚 [Reading it](#-reading-it)
- 🪜 [The six stages](#-the-six-stages)

**How it works** — the structure, in detail

- 📖 [Decoding a chapter](#-decoding-a-chapter)
- 📐 [The two content rules](#-the-two-content-rules)
- 🧭 [Status and roadmap](#-status-and-roadmap)

**Working on the repo itself** — building, verifying, publishing → [`docs/creator.md`](docs/creator.md)

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
| [`content/artifacts/`](content/artifacts/agent-loop.md) | the five kinds of context artifact — prompt, rule, skill, hook, memory — reproduced as written |
| `content/case-study/` | the sanitised `.md` layer of a private production repo *(empty until inc5)* |
| `content/course/` | the course skeleton — module, outcome, chapters it draws on *(empty until inc5)* |
| `content/timeline.json` | the generated spine every index and frontmatter block is synced from |

Chapters are written out of order and land as stubs first, so a chapter can be a heading skeleton with
`artifact: pending` in its frontmatter. The index table and the `artifact:` key are the honest
progress meter; no count is published on this page, because a hardcoded one rots.

---

## 🪜 The six stages

Each repo carries two tags in its chapter's frontmatter: `stage`, the rung it **opened** on, read off its
first commit date, and `stage_peak`, the highest rung it **reached**. The rungs are ordered, low to high,
and they track what changed in the **working method** — not the developer's skill, and not a claim that
every repo should have climbed:

| Stage | What the method looked like |
| --- | --- |
| **asking** | code pasted in and out of a chat window; the human is the integration layer |
| **suggesting** | models run locally, retrieval and evaluation built by hand |
| **delegating** | an agent edits the repo directly; small, short-lived experiments |
| **planning** | the agent works from a written plan or spec, not ad-hoc prompts |
| **configuring** | the artifact under work is the *configuration* — rules, skills, gates |
| **governing** | agent-written applications shipped and operated under a written review system |

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
stage: configuring                         ← the rung it OPENED on; one of the six above
stage_peak: governing                      ← highest rung reached; author-set, defaults to stage
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
| **Stage** | `configuring` | The rung of the method this repo OPENED on, by first-commit date (see [the six stages](#-the-six-stages)). |
| **`stage_peak:`** | `governing` | The highest rung the repo reached. Author-set, defaults to `stage`; raised only with a git-dated in-repo artifact. |
| **`artifact:`** | `present` / `pending` | Whether the chapter carries its evidence yet. `present` with an empty `## Artifact` body reds the test suite. |
| **`## What didn't work`** | *"A green test suite that never touched the code it claimed to cover."* | Required in every chapter. A chapter with only lessons is not done. |
| **`## Artifact`** | the repo's own rule, quoted and dated: *"A retune is a ONE-place edit — never restate a cut's value."* | The one section that makes a claim checkable by someone who wasn't there. A private repo contributes rule excerpts and dates, never code or commit SHAs. |

So a chapter says: *here is what I set out to do, here is what failed and how I know, here is what that
taught me, and here is the artifact you can check it against.*

---

## 📐 The two content rules

Every chapter carries **≥1 artifact block** (the evidence rule), and nothing here is sold — no claim
without an artifact or a number, failures before lessons, a banned-vocabulary list grepped across
`content/` (the anti-hype rule). Both are binding, both are enforced by a test suite rather than by good
intentions, and a chapter that breaks one of them cannot be published.

The rules in full, and how they are wired to fail a build —
**[`docs/creator.md`](docs/creator.md#the-two-content-rules)**.

---

## 🧭 Status and roadmap

**Live today:** thirteen chapters (several still stubs) plus the experiments round-up, one context-artifacts page
lifted verbatim from OneNote, a generated timeline and index, the two content rules in executable form,
and an Astro site over the same markdown — home, journey and artifacts routes, with `case-study/` and
`course/` as honest empty states.

**Where it's heading.** Fill the pending chapters to `artifact: present`; publish the sanitised
crash-dash case study and the course skeleton (inc5); then the web-native lecture deck (TalTech, 19 Nov 2026), which is what the
`deck:` frontmatter key is reserved for. Interactive explorers over `timeline.json` come after that,
and a book from the same files is the long horizon.

Increments stay thin — one session each, visible on GitHub the same day. The binding constraint is not
ambition; it is the token budget.

---

## 🛠 Working on this repo

Building it, the one verification gate, how the timeline is generated, and how it deploys —
**[`docs/creator.md`](docs/creator.md)**.
