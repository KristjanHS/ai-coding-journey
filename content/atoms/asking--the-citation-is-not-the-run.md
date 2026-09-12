---
title: A citation is not a run
topic: cursor-rules
rung: asking
concern: provenance
question: When a model explains how your own tool behaves, where did that explanation come from?
audience: [university, rnd-engineers, meetup]
evidence: transcript
minutes: 2
level: show
source_chapter: 04-llm-eng-template
slot: open
---

# A citation is not a run

Asked how Cursor's rules behave when the agent is driven by a bring-your-own-key
model, the answer came back specific: rules live in `.cursor/rules`, they are
prepended before the user message, `alwaysApply` gives a system-prompt effect,
and they are version-controlled. Every one of those points arrived with a link
to the vendor's documentation.

That link is the whole provenance. It makes the claim checkable — the page
exists, and it says what the answer says it says — and it is a different thing
from having watched the editor do it. Nothing in the exchange touched the
install on the desk. At the asking rung that is usually the best provenance
available, and the move is to notice which kind you are holding before you build
a setup on it.

## Evidence

> [2025-08] "They’re version-controlled, scoping is precise, and you can toggle **alwaysApply** for a true “system” effect [Cursor](https://docs.cursor.com/en/context/rules)."

The thread is a private export, so the atom carries no `quote_from`; the date is
bracketed from the corpus index rather than read off the file, which carries no
timestamp of its own.
