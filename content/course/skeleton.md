---
title: "Journey to AI coding agent governance"
summary: "Seven modules, each with one learning outcome and the journey chapters it draws on. Titles and outcomes only — no bodies."
---

A half-year course framed as **governance and planning**, not "how to code". The audience is mixed: about
half have no software background. Every module draws its evidence from chapters of this journey, so nothing
is asserted that the repo cannot show.

This is a skeleton. Module titles, one learning outcome each, and the chapters each draws on — no session
plans, no syllabus, no assessment.

## 1. What changed, and what did not

**Outcome:** the learner can describe the five working stages an individual passed through — chat,
local models, first agents, config engineering, production app — and say what each stage could and could
not deliver.
**Draws on:** `01-hands-on-llm`, `02-kri-local-rag`, `05-stt-faster`, the timeline.

## 2. Cost as a design constraint

**Outcome:** the learner can explain why token cost is a *design* input, not an invoice, and can name the
mechanisms that control it — scoping what a session reads, delegating bulk reading, ending sessions at a
boundary.
**Draws on:** `10-token-monitor`, the measurements pages.

## 3. Governance as a layer

**Outcome:** the learner can describe the six jobs of a governance layer over a coding agent — root
instructions, path-gated rules, plan docs, review, test discipline, postmortems — and say what breaks when
any one is missing.
**Draws on:** `11-dotfiles`, `12-claudeconf`, the crash-dash case study.

## 4. Planning before building

**Outcome:** the learner can write a plan document that states its alternatives and why each was rejected,
and can explain why the rejected options are the part that gets re-read.
**Draws on:** the case study's shipped plan doc, `07-proj-mgmt`.

## 5. Quality gates that can actually fail

**Outcome:** the learner can distinguish a check that passes from a check that *could have failed*, and can
demand a demonstration of failure before accepting a claim of coverage.
**Draws on:** the case study's test-discipline and reviewer-caught-defect artifacts.

## 6. Review when nobody reads the code

**Outcome:** the learner can describe an engineered review system — independent reviewers, evidence
requirements, what gets escalated to a person — and argue for or against relying on it in a given project.
**Draws on:** `13-crash-dash`, the case study, `08-edf-budget-planner`.

## 7. Choosing tools, and being wrong about them

**Outcome:** the learner can evaluate a tool choice against the work rather than the marketing, and can
name at least three abandoned approaches from this journey and why each was abandoned.
**Draws on:** `03-dewpoint`, `04-llm-eng-template`, `06-xls-analyser`, `09-gitlab-standup`,
`00-experiments`.
