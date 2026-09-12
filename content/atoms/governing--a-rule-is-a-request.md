---
title: A rule is a request until a test enforces it
topic: the-governance-layer
rung: governing
concern: quality
question: What turns a writing rule for an agent into something that holds?
audience: [university, rnd-engineers, meetup, linkedin]
evidence: artifact
minutes: 2
level: govern
source_chapter: 91-the-close
slot: toolkit
quote_from: content/artifacts/rule-path-gated.md
---

# A rule is a request until a test enforces it

This site's content rule bans a list of marketing words. Written as a rule, the ban is only something
the model is asked to follow. It became reliable once the test suite checked for the same words and
failed the build on a match, and that check was broken on purpose once to prove it could fail.

## Evidence

> [2026-09-08] "A rule is an instruction, and an instruction is a request. The banned-vocabulary list only became reliable once the same list existed as a grep in the test suite"
