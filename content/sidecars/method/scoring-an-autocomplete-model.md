---
title: How to score an autocomplete model
topic: evaluating-code-models
type: method
summary: A recipe for turning "is this completion model any good" into a number, built from public benchmarks and their own harnesses.
---

# How to score an autocomplete model

The source laid out an evaluation recipe rather than a tool pick. The first
decision is breadth versus depth: isolated function stubs with doctests measure
a single algorithmic idea, fill-in-the-blank corpora over real files measure the
IDE-style next-token feel, and full-program challenges measure whether the model
can carry control flow and library use across a whole task. Each layer answers a
different question, so the choice is which question you are asking.

The mechanics are the same across layers. Generate several completions per
prompt at a low temperature, then score them with the benchmark's own harness —
functional pass@k where unit tests exist, token-level accuracy where the task is
a masked span. Wire the score into continuous integration and gate a release on
it not dropping, and rotate a slice of the prompts periodically so the test set
stays unseen by the model under test.

## What didn't work

Treating a single headline benchmark as the verdict. A model that tops a
stub-completion set can still be the weaker choice for multi-file work, because
that set never exercises the thing you actually feel in an editor. The recipe
only means something once the layer matches the use.
