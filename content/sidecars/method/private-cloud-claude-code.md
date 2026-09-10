---
title: Keeping inference inside the perimeter
topic: self-hosted-inference
type: method
summary: Three patterns for a private coding-agent path, and the one requirement they all reduce to — the client speaks a fixed interface and nothing more.
---

# Keeping inference inside the perimeter

The source separated three workable patterns by what "private" is being asked
to mean. The first keeps a managed frontier model but routes the traffic over a
cloud provider's private networking, so requests never touch the public
internet. The second adds hardware-backed confidential inference, for a threat
model where even the operator must not see the prompt. The third is true
self-hosting: the model runs on your own cluster and the client reaches it
through a gateway.

All three reduce to one technical requirement. The client is not wired to a
vendor; it is wired to an interface — a messages endpoint, a token-counting
endpoint, and streaming. Put a gateway in front of an open model that speaks
that interface and the client cannot tell the difference. The controls that make
the private claim real are network, not policy: lock egress so developer
machines can reach only the gateway, and the gateway only the model.

## What didn't work

Relying on a translation layer to bridge a different API shape. The bridges are
lossy exactly where a coding agent lives — tool calls, token counting, and the
query parameters the client sends — so a setup that answers a plain chat cleanly
can still stall on the agent features. Validate streaming, tool round-trips, and
token counting before trusting the path.
