---
title: Ask for proposals, not edits
topic: rag-simplify-align
rung: planning
question: What changes when you stop asking a model to edit and start asking it to propose?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 3
level: orient
source_chapter: 02-kri-local-rag
---

# Ask for proposals, not edits

At the planning rung the unit of work stops being a change and becomes a list
you rule on. The prompt below hands over the whole repository and asks for
proposals — not a patch. What came back was nine numbered items, each with why
it was over-engineered, a lighter alternative, and the smallest edit that would
get there. The decision stayed with me; only the enumeration moved.

The cost is visible in the prompt itself: it names a constraint ("retaining
alignment with best practices") because a proposal list with no constraint is a
list of things to delete.

## Evidence

> [2025-07..2025-09] "Scan my project dev branch, for over-engineering that can
> be simplified while retaining alignment with best practices. List
> simplification proposals."

The date is a bracketed span, not a day: this thread is undated in the export
and is placed by the surrounding thread family.
