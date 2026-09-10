---
title: Self-hosted inference
summary: Keeping the coding-agent experience while the model that answers it stays inside a private network perimeter.
---

# Self-hosted inference

A source thread on a question that arrives once an agent is useful enough to
want everywhere: can you keep the coding-agent workflow while the inference that
powers it never leaves a private perimeter? The subject is the boundary, not the
model — what has to be true about the network and the protocol for the client to
talk to a model you host yourself.

The threads grouped here share that shape: the client speaks a fixed interface,
and everything behind it is an infrastructure choice. The sidecar below
describes the patterns the source laid out.
