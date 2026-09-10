---
title: A hard count forces the ranking
topic: cutting-a-repo-back-to-one-job
rung: planning
question: Why does asking for a fixed number of changes get you something different from asking what to change?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 3
level: show
source_chapter: 05-stt-faster
quote_from: content/journey/05-stt-faster.md
---

# A hard count forces the ranking

At the planning rung the thing you ask for is a document, not a change. The ask
below is one sentence and does two jobs: it names the survey ("audit the project
for unnecessary complexity and overengineering") and then constrains the output
to ten items. The constraint is the working part. An unbounded "what should I
change here" returns an inventory, and an inventory has no opinion about which
row matters; ten forces every candidate past the tenth to be dropped, and
dropping is ranking.

What came back was uniform rather than long: ten sections, each with the
symptoms, why the current shape exceeds the job, the numbered steps, an effort
and risk sizing, and the impact. The uniformity is what lets you compare row
three against row eight without re-reading either, and the ranking is what makes
the comparison worth making. The plan opened by naming the three jobs the
repository had accumulated — the tool it was named for, a project template, and
an agent-configuration playground — which is the sentence the ten items are
downstream of.

## Evidence

> [2025-12-09] "audit the project for unnecessary complexity and overengineering, and create .md plan for 10 highest value refactors"
