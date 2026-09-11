---
title: The completions came back, and the model never left the box
topic: self-hosted-inference
rung: suggesting
concern: control
question: Once the editor was offering completions, where was the model that produced them actually running?
audience: [university, rnd-engineers]
evidence: number
minutes: 2
level: show
source_chapter: 02-kri-local-rag
slot: open
quote_from: content/measurements/01-continue.md
---

# The completions came back, and the model never left the box

At the suggesting rung the editor offers the next lines and you keep or drop
them. The control question underneath is quieter: whose machine computed the
suggestion. For this era the answer is measured, not asserted — the token log
records which provider served each event, and almost all of them never crossed
the network perimeter.

The figure below is that count. The rest ran on a hosted Gemini key, so the
boundary was a choice the setup made per event, not a wall — but the default sat
on the home box, which is where the decision stayed too.

## Evidence

> [2025-07..2025-08] 98.8% of token events ran on the local Ollama provider
