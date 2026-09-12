---
title: The second user turns a name into a variable
topic: the-template-repo
rung: delegating
concern: control
question: What changes about a repo the moment someone else generates a project from it?
audience: [university, rnd-engineers, meetup]
evidence: transcript
minutes: 2
level: show
source_chapter: 04-llm-eng-template
slot: climb
quote_from: content/artifacts/prompt-template-own-name.md
---

# The second user turns a name into a variable

A setup that only has to work for its author can hardcode the author's project name; one that
other people generate from cannot. The question below was asked while four open files still
carried the name, and the answer — make it a Cookiecutter template — moved the names out of the
files and into generation-time variables a user fills in.

Sharing is what forces that rigour. Every hardcoded value is a defect the moment a second person
generates from it, and every broken hook is their first impression of the project rather than the
author's minor annoyance.

## Evidence

> [2025-09..2025-10] "How can I enable the user of this github repo template, to easily use his own project name in all these files?"

The thread is undated in its source; the bracket is the template repo's git span.
