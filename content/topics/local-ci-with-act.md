---
title: Local CI with act
summary: Running a uv-based GitHub Actions workflow locally with act means reconciling two behaviours the hosted runner hides — how to detect act, and how to persist caches across container cleanup.
---

# Local CI with act

A source thread about running a project's GitHub Actions workflow on the local
machine with act before pushing. The subject is the small set of places where
act and a hosted runner quietly disagree, each of which has to be reconciled for
one workflow file to behave the same in both.

Two came up here: detecting that the runner is act at all, where a brittle
actor-name check gives way to the variable act guarantees, and keeping uv's
download cache alive between runs without dragging the virtual environment
along, which act's cache server handles as long as it is pointed at a stable
host path. The sidecar weighs those choices and the one failure the thread
turned up; this topic is why they sit together — they are the friction of
treating act as a faithful local stand-in for CI.
