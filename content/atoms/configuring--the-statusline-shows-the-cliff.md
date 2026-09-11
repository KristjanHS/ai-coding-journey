---
title: The statusline shows the cliff
topic: the-config-tree
rung: configuring
concern: cost
question: How does a live agent run stay inside its context budget?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 10
level: show
source_chapter: 12-claudeconf
slot: live
quote_from: content/artifacts/hook-budget-warning.md
---

# The statusline shows the cliff

The live agent runs against the budget hook: a statusline fills toward the context cliff,
and a hook fires after every tool call so the wrap-up is a policy, not a memory of one.

![statusline filling toward the budget cliff](../media/statusline.gif)

Recording: owed

The animation is from the public repo `KristjanHS/claudeconf`, `docs/statusline.gif`,
committed 2026-06-18.

## Evidence

> [2026-09-08] "130k is the /impag wrap-up threshold."
