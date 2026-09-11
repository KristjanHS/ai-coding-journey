---
title: Moving the rules found a dead one
topic: the-governance-layer
rung: governing
concern: provenance
question: How do you find out that an instruction file no longer matches the code?
audience: [university, rnd-engineers]
evidence: artifact
minutes: 2
level: govern
source_chapter: 02-kri-local-rag
slot: toolkit
quote_from: content/artifacts/rule-migration-cursor-to-claude.md
---

# Moving the rules found a dead one

When the RAG repo's Cursor rules moved into Claude Code, each one was read again. One of them still
sent the agent to a directory that had been deleted, and told it to use pip in a repo that had moved to `uv`. Nothing had
checked it. The migrated rules now carry a `last_verified:` date.

## Evidence

> [2026-06-23] "delete uv-sandbox.mdc (tools/uv_sandbox absent; root pyproject is uv-native)"
