---
title: "GitHub Copilot Chat — the era with no numbers"
summary: "The first tool era: the logs record what was said and nothing about what it took, so this era has no share to take."
---

# GitHub Copilot Chat

The first era of the journey. The chat transcripts survive as workspace-scoped
JSON, but they record only what was said, never what it took — so this era is
counts-only in private and, in public, an absence.

- Chat sessions survive in **6 of 18** workspace-storage directories. That
  fraction is the finding: most workspaces of that period have no chat history
  at all.
- Measured how: count the session JSONs under
  `Code/User/workspaceStorage/*/chatSessions/*.json`, count `requests[]` per
  file for turns, and read dates from `creationDate` / `lastMessageDate`.

## What could not be measured

- **Tokens: `none`.** Grepped every session JSON: there is **no token field**
  anywhere, so no token figure exists at all — not even a floor. This era takes
  no share of the cross-era floor, and its row shows an em-dash. That is an
  absence, not a zero, and the two are different claims.
- **No cost field either.** This was the free tier; the logs bill nothing and
  record nothing about price.

Copilot Chat overlaps the tools that follow it rather than handing off to them —
its 2025-06-20 → 2025-12-08 span runs straight through the Continue, Cursor and
Codex eras.

## What is not published

Turn and session counts exist and are not published here. They measure how much
one person used a tool, which is not what this page is for; the private store
keeps them.
