---
title: The EU AI Act checklist the scan produced
topic: rag-simplify-align
type: artifact
summary: A twelve-item compliance checklist, each row naming the article, the repo location and the edit — produced by pointing the same whole-repo ask at a regulation instead of at over-engineering.
---

# The EU AI Act checklist the scan produced

The proposals-not-edits ask was pointed at a regulation rather than at the code's
shape: scan the repository against the EU AI Act and GDPR and list what needs to
change. What came back was a twelve-item checklist with a fixed row shape — the
change, why it mattered, where in the repository it lived, and how to make it.

The items were concrete rather than advisory. Database access control meant
requiring an API key instead of leaving Weaviate open to anonymous access.
Disclosure meant a visible banner stating the system was AI-driven. The rest
covered a privacy notice at the point of collection, logging hygiene (mask
personal data, set a retention default), and a deletion endpoint so retention
was something an operator could act on rather than a claim. Some rows were
forward-looking: a synthetic-media policy in case audio or video generation were
ever added.

What made it usable was the quick-win section — four changes separated out
because each was a single edit: turn on Weaviate auth, set the Streamlit
telemetry flags, add a scrubber to the log path, and write a PRIVACY.md carrying
a lawful-basis statement. The other eight rows were real work; these four were
not, and the list said which was which.

## What didn't work

Reading the checklist as a to-do list. Twelve rows that each cite an article
look equally obligatory, and they are not — the four quick wins and the
forward-looking synthetic-media row sat in the same numbered sequence with
nothing but the section heading to separate a config flag from a policy the
project did not yet need.
