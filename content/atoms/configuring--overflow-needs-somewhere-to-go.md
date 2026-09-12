---
title: A rule that caps text needs somewhere for the overflow to go
topic: the-config-tree
rung: configuring
concern: provenance
question: Why does a file-based rule hold where the same correction typed into chat did not?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 3
level: govern
source_chapter: 11-dotfiles
slot: climb
quote_from: content/artifacts/rule-prose-budget.md
---

# A rule that caps text needs somewhere for the overflow to go

At the configuring rung the correction you kept retyping becomes a file the
agent reads before its first token, in every project the path matches. The rule
below caps agent-written prose at two lines per unit. Nothing enforces it but
the model reading it.

What makes it hold is the second clause. A cap alone asks the model to drop
information, and it resists. A cap that names where the extra text goes — the
commit message — gives the model somewhere to put it.

## Evidence

> [2026-08-09] "Overflow does not become a third line, a nested bullet, a sibling unit, or a new doc that inherits the paragraph. It goes to the **commit message**: durable, greppable, attached to the diff, free to every future reader."
