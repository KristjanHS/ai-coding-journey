---
title: kri-local-rag
repo: kri-local-rag
start: 2025-07-13
end: 2026-06-25
commits: 741
stage: local-llm
tools: [claude-code]
deck: false
artifact: present
---

# 02 · kri-local-rag

## What I was trying to do

Run a retrieval system entirely on my own machine — documents in, answers out, no hosted model in the
path. The stack is Python 3.13, Weaviate as the vector store, Ollama serving the model, and Streamlit
as the front end.

The interesting part of the repo is not that it works. It is what a review found in it after a year.

## What didn't work

**A 145-line fake `torchvision` module.** To stop `transformers` from importing torchvision, the repo
carried a hand-written stub standing in for the real package (`backend/models.py`, lines 26–170). It
worked. It was also a dependency problem solved inside the application instead of at the environment
boundary — the honest fixes are to pin the `transformers` version, install CPU-matched wheels, or set
`TRANSFORMERS_NO_TORCHVISION`. A brutal-honesty review dated 2026-06-24 rated it CRITICAL. Deleted the
same day.

**Metadata filtering that had never run.** The CLI built a filter as a plain dict — the shape Weaviate's
v3 GraphQL API took. The client underneath was v4, whose `.filter()` accepts `_Filters` objects and
rejects anything else. The mismatch spans `qa_loop.py` → `retriever.py`, and it survived because the
feature had zero test coverage. Nothing failed loudly; the code path was simply never exercised.

**Caching one value at three levels.** The embedding model is a singleton. It was cached three separate
times anyway. Every layer was individually defensible and the stack as a whole was maintenance cost for
no benefit.

**Sixty lines of Streamlit logging plumbing.** Per-thread handler gymnastics in `rag_app.py` — lines
51–79 and 185–226 as the 2026-06-24 review found them — to get log lines attributed correctly in the
UI. That file has since been refactored, so those line numbers locate the finding, not current code.

**A startup routine that was not load-bearing.** The bootstrap performed a warmup dance — a PDF
round-trip, a `delete_many`, a version fallback — on the theory that the embedder needed priming. It
does not: it lazy-loads and caches on first query, and the dance only ever ran against a fresh
database. It collapsed to a single `ensure_collection()` creating an empty schema.

## What I learned

**Constrain the framework's surface, in writing, before it spreads.** LangChain is genuinely useful for
document loading and text splitting and genuinely expensive if it becomes the architecture. The repo's
rule pins it to one file and names the packages that are *not* installed — so the constraint survives
the next person (including me) reaching for a convenient import.

**"It works" and "it has ever run" are different claims.** The broken metadata filter passed every
gate the repo had, because the repo had no gate that exercised it. Test coverage is not a quality
metric here; it is the difference between code that works and code whose behaviour is unknown.

**Complexity accretes where nobody is looking.** The review ranked 20 hotspots across roughly 2,100
lines of core code — 2 CRITICAL, 6 HIGH, 8 MEDIUM, 4 LOW. None of them broke anything. All of them
were written deliberately, one reasonable decision at a time.

## Artifact

The rule that keeps LangChain contained, from `.claude/rules/langchain.md` (2026-06-23):

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
three packages that were dropped and what replaced them, so the rule can be checked against the
lockfile rather than interpreted.
