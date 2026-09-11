---
title: Review sends the plan back, not the code
topic: the-governance-layer
rung: planning
concern: quality
question: What does a reviewer check in a plan before anything is built?
audience: [university, rnd-engineers]
evidence: defect
minutes: 2
level: govern
source_chapter: 13-crash-dash
slot: climb
quote_from: content/case-study/crash-dash/shipped-plan.md
---

# Review sends the plan back, not the code

At the planning rung the first thing that gets reviewed is a document, before
any code exists. The defect this reviewer caught was an absence: the draft
argued its chosen design forward and listed nothing it had rejected.

That gap is invisible in the code that follows. It only shows up later, when
someone meets a constraint and cannot tell whether to keep it.

## Evidence

> [2026-06-29] "Review sent it back: without the rejected options, a reader six months later cannot tell whether a constraint was load-bearing or an accident, and re-litigates it."

The date is the plan doc's; the case-study page is a sanitised rewrite of a private file.
