---
title: what I got wrong
tools: []
deck: true
artifact: present
---

# 90 · what I got wrong

## What I was trying to do

Answer a question I had assumed was answerable at any time: what has this cost, and which tool cost the
most for what it returned. I went looking for the number two years in, expecting to read it off, and
found instead that the answer depends entirely on what each tool happened to write to disk while I was
not paying attention.

The measurement pass that produced `content/measurements/` is the repair job. It is also the clearest
evidence of the mistake, because most of what it found is absence.

## What didn't work

Assuming the tools were keeping the receipts. They were not, and each one failed differently.

GitHub Copilot Chat wrote no token field and no cost field at all: what survives is 86 turns across 7
sessions, found in 6 of 18 VS Code workspaces. Cursor logged <redacted> sessions but prices only 4.86% of its
message bubbles — <redacted> of <redacted>, every one of them an assistant turn — so its token totals are a floor
and its spend is unknown-server-side. The Codex plugin started logging tokens partway through, on
2025-09-23, so its total is a floor too.

Only Claude Code carries enough per-session state to derive an actual figure: $<redacted>.

## What I learned

Four eras, four different answers to "what did this cost", and only one of them is a number: derived,
near-zero-local, unknown-server-side, absent. Those are states, not missing values, and treating them
alike would have produced a tidy chart that was mostly fiction.

What I got wrong was the ordering. I picked tools on how they felt to work with and expected to
reconstruct the economics afterwards. The economics are only reconstructable for the tool that decided,
on its own, to write them down. If a number matters, the time to check that it is being recorded is
before the two years, not after.

## Artifact

The finding, as the generator emits it — an availability matrix rather than a metrics table, because
the honest content of three of these rows is a named absence:

```json
{ "id": "cursor",  "cost": "unknown-server-side", "tokens": "floor" }
{ "id": "copilot", "cost": "absent",              "tokens": "none"  }
```

A chart cannot render "absent". A table of states can, and that constraint is what kept the
measurements page truthful.
