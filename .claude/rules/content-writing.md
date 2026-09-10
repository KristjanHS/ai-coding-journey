---
name: Content writing — evidence, not hype
description: What each content/ target admits and refuses; the evidence rule and the anti-hype rule as path-gated instructions
paths:
  - "content/**/*.md"
---
# Content writing — evidence, not hype

The two-line unit and supersede-by-replacing are global → `~/.claude/rules/prose-budget.md`. The rules
below are this project's binding constraints (source: `2026-09-09-journey-vision.md` (docs/plans/)
§Binding constraints — edit there first, mirror here).

## Evidence rule
Every journey chapter carries **≥1 artifact block** — a real prompt, a rule/skill excerpt, a defect a
reviewer sub-agent caught (with the fix commit's subject), or a measured number *with how it was
measured*. A chapter without one is not done; the content test (from inc3) reds on it.

## Anti-hype rule
- **No claim without an artifact or a number.** "X worked" names the repo, the date and the evidence.
- **Failures get equal billing.** Every chapter has a `## What didn't work` before `## What I learned`.
- **Banned vocabulary** (content test greps for it): `10x`, `game-changer`, `game changer`, `revolution`,
  `revolutionary`, `anyone can`, `in minutes`, `no code needed`, `effortless`, `magic`.
- **Positioning is governance and method, never "look what I built".** The author does not read the
  generated code; say so plainly where relevant and show the review system and what it caught instead.
- **Learning/course repos** (`01-claude-code-pm-course`, `03-`/`09-learn-claude-code`) are cited inside a
  chapter as the source of a method — name it and what it taught — never given a chapter of their own.
- **Private repos** (crash-dash, the defence-exercise repos, R&D engineering work): lessons and sanitised `.md`
  excerpts only — no code dumps, no live URLs, no colleague names, no client names.
- **Public-link gate:** before the first public link or LinkedIn post, a fresh sub-agent runs
  `brutal-honesty-review` over `content/` as a sceptical senior engineer; every hype finding is fixed or the
  sentence is deleted.

## The writable set — each target with one admission row

| target | admits | refuses |
|---|---|---|
| `content/journey/NN-<repo>.md` | frontmatter from `timeline.json` (never hand-edit `start`/`end`/`commits`/`stage` — `timeline-from-git.py` resyncs them; cite counts in prose rounded, never exact); `## What I was trying to do` · `## What didn't work` · `## What I learned` · `## Artifact`; ≤1 screenshot per section, referenced from `content/media/` | narrative padding, tool marketing, claims about repos not in `timeline.json`, anything the anti-hype list bans |
| `content/journey/00-experiments.md` | one line per <5-commit repo: name · date · one-sentence outcome | a section per repo |
| `content/journey/README.md` | **generated** index from `timeline.json` | hand edits |
| `content/artifacts/<slug>.md` — one of five kinds (`prompt`, `rule`, `skill`, `hook`, `memory`), declared in frontmatter | a prompt verbatim as used (sanitised), one line on what it was for, and whether it is still used; for the other four kinds, excerpts ≤40 lines each from a real file, plus a *Where it came from* line naming the tree and stating whether a reader can verify it; a date per entry where the source has one, else one page-level `captured:` range plus an explicit "undated in source" note | improved/idealised rewrites presented as the original; an inferred date; a guessed still-used status; a claimed public address for a private or per-machine file |
| `content/case-study/crash-dash/**` | sanitised copies of the private repo's `.md` layer + architecture excerpts ≤40 lines each, each with its origin path and date | code files, `.env`, migrations, live URLs, commit SHAs of the private repo |
| `content/topics/<slug>.md` | one idea, named from the source corpus's own filename prefix: a title, what the idea is, and why its atoms belong together | a topic invented to hold one atom; a topic that names a source file, a colleague or a client |
| `content/atoms/<rung>--<slug>.md` | one claim plus **exactly one** verbatim line in `## Evidence`, that line carrying its own bracketed date; required facets `topic` (must resolve to a `content/topics/` file) · `rung` · `question` · `audience[]` · `evidence` · `minutes` · `level` · `source_chapter`; ~15 lines, slide-ready as written | a second quote block; an Estonian source line quoted in the original (translate and mark it); an atom seeded from a `tier: private` source row; a `minutes` value defended as accurate — the suite bounds the sum over an audience, never one value |
| `content/course/skeleton.md` | module title · learning outcome · which chapters it draws on | syllabus detail, grading, schedule |
| `content/timeline.json` | nothing by hand — regenerate | any manual edit |
