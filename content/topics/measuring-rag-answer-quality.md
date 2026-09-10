---
title: Measuring RAG answer quality
summary: The ladder from string overlap to a judge model, and what it takes to turn any of it into a gate that can fail a build rather than a number in a report.
---

# Measuring RAG answer quality

A retrieval system that returns something plausible for every question is
indistinguishable, from the outside, from one that is right. Deciding which you
have means measuring the answer, and the measurements form a ladder: exact
string overlap is cheap and blunt, embedding similarity is softer and harder to
read, and a model scoring against a rubric is expressive and needs its own
validation.

The material grouped here is about that ladder and about the step after it —
turning a metric into a threshold a build checks, so a regression stops the
pipeline instead of appearing in a report nobody opens.
