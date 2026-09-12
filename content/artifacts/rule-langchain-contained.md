---
title: The rule that keeps LangChain contained, and names what was dropped
source: public repo `KristjanHS/kri-local-rag` — `.claude/rules/langchain.md`, migrated from `.cursor/rules/` on 2026-06-23
kind: rule
captured: "2026-06-23"
---

# Rule · a dependency rule that can be checked against the lockfile

The RAG repo's LangChain rule, as it stood after the 2026-06-23 move into `.claude/rules/`:

```text
LangChain is used **only in `backend/ingest.py`** (the `Document` type + text
splitting); deps: `langchain-core`/`-text-splitters`, NOT `langchain-community`
(dropped — PDFs load via `pypdf`, text via stdlib) and NOT the `langchain`
umbrella. `qa_loop.py` uses custom Weaviate/Ollama clients.
Keep API keys and endpoints in environment variables (`.env`), never hardcoded.
Wrap external calls (Ollama, Weaviate, LangChain) in explicit error handling.
Log the app↔LangChain interaction so retrieval and generation steps are traceable.
```

The parenthetical is the load-bearing part. It does not say "prefer fewer dependencies" — it names the
packages that were dropped and what replaced them, so the rule can be checked against the lockfile
rather than interpreted. Still in use at the repo's last commit (2026-06-25).

## What didn't work

The last three lines are the generic kind every rule file grows: hard to disobey, impossible to check.
Only the first sentence has a falsifier.

## Where it came from

The **public** repo `KristjanHS/kri-local-rag`, file `.claude/rules/langchain.md` at the 2026-06-23
migration commit. A reader can open the file and the lockfile side by side.
