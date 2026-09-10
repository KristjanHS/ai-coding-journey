---
title: The log says whether the model fit, not the spec sheet
topic: models-on-the-home-box
rung: asking
question: Once you have picked a model on paper, how do you know the box can actually run it?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 3
level: show
source_chapter: 01-hands-on-llm
slot: climb
quote_from: content/journey/01-hands-on-llm.md
---

# The log says whether the model fit, not the spec sheet

At the asking rung the loop is paste a question, read what comes back. The
artifact you read is rarely the answer prose — here it is the server-startup
log, where the runner states in its own words whether the model it was told to
load fit the card. The decision was made on paper from published figures and an
8 GB budget; the log is the first place that paper is tested against hardware.

The line below is the scheduler's verdict. It computed the model's full
requirement against the VRAM it could see and committed to a single GPU before
loading a layer. Reading it is the whole skill: the number that matters is the
requirement beside the available, not the card's advertised total.

## Evidence

> [2025-07-01] new model will fit in available VRAM in single GPU, loading ... required="5.9 GiB"

A 4-bit 7-billion-parameter model needs well under the card's ceiling, which is
why a model chosen on paper loaded without a second attempt.
