---
title: The rule names its own routes
topic: the-governance-layer
rung: configuring
concern: quality
question: What does a rule authored for one app, rather than adopted from a baseline, look like?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 2
level: govern
source_chapter: 03-dewpoint
slot: toolkit
quote_from: content/artifacts/rule-api-routes.md
---

# The rule names its own routes

The dewpoint repo's API-route rule was written on 2026-06-24 — the one day, eleven months in, when
governance arrived together with the first tests. It is not an adopted baseline: it names this app's
routes, its upstream weather services and its own error shape, and each line can be held against a
route file rather than interpreted. The caching directive below is the clearest case — disobey it and
the deployed page serves stale weather.

## Evidence

> [2026-06-24] "**Live data**: set `export const dynamic = "force-dynamic"`, else Next caches the response at build time."
