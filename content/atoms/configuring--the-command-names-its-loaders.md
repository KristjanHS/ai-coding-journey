---
title: The command names the loaders it must call
topic: the-governance-layer
rung: configuring
concern: quality
question: How do you tell an authored command from an adopted baseline?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 2
level: govern
source_chapter: 07-proj-mgmt
slot: toolkit
quote_from: content/artifacts/prompt-pm-conflict-check.md
---

# The command names the loaders it must call

The proj-mgmt repo authored seven `/pm:` commands in twenty minutes on 2026-03-29, and they are
checkable procedures: the loader functions to call, the order of the checks, where errors stop. That
specific shape is what makes a command authored rather than adopted — and it is also why a rules layer
copied in from another repo five months later read as progress when it was not: the shape matched,
the authorship did not.

## Evidence

> [2026-03-29] "Read `data/people.json` via `pm.loader.load_people`, then load the project via `pm.loader.load_project`. Stop on validation errors — schema issues are reported here, not below."
