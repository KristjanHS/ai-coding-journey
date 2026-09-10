---
title: An eval ladder that ends in a failing build
topic: measuring-rag-answer-quality
type: artifact
summary: A phase plan that climbs from string overlap to a judge model to a framework, with every step ending in a checkpoint and the final metrics wired to a thresholds file that can fail CI.
---

# An eval ladder that ends in a failing build

The artifact is a plan for building an evaluation harness, written as a
sequence of steps rather than a description of one. It renders the same phase
three times: as a set of goals with deliverables, and twice as ten-step tables
whose columns are the objective, what to do, what to watch, and a checkpoint.
Every step ends in something that can be checked, which is the structural
choice worth copying.

The measurement ladder has four rungs. String overlap first — exact match and
F1 against a gold set — cheap to compute and blunt about paraphrase. Then
embedding similarity, which forgives wording and is correspondingly harder to
read a threshold off. Then a model scoring against a rubric: four criteria
covering faithfulness, task fit, clarity and safety, on a fixed scale, run at
zero temperature with a fixed seed. Then an established framework rather than
the hand-rolled version.

The step that separates this from a report is the gating. A single command
builds an HTML report, CI uploads it as a build artifact, and a thresholds file
holds the numbers that decide pass or fail — so a regression stops a build
instead of sitting in a document. The gold set is small and deliberately
adversarial: a few dozen question-and-answer rows, several of which are traps
where the correct behaviour is to refuse.

Running through the whole plan is one argument about why the ladder has to have
more than one rung. A single headline number invites optimisation of that
number, so the harness is required to show a trade-off across several metrics
rather than a scoreboard.
