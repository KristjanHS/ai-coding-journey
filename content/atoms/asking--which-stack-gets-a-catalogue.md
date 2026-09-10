---
title: Ask which stack to build on and you get a catalogue
topic: rag-stack-choices
rung: asking
question: When you ask a model which framework or stack to build on, what does the answer actually give you?
audience: [university, rnd-engineers]
evidence: transcript
minutes: 2
level: orient
source_chapter: 02-kri-local-rag
slot: climb
---

# Ask which stack to build on and you get a catalogue

At the asking rung you do not yet know the terrain, so the natural first move is
to ask the model which tool to pick. The answer to "best frontend for a local
RAG app" came back as a ranked field — React, SvelteKit, SolidJS, Vue, Angular,
Qwik, and Streamlit — each with a crisp one-line case.

What is easy to miss is what that answer is made of. Every claim in it is
synthesised from benchmarks and vendor posts the model had read, none of them
run against the workload in front of you. It is a map of the options and the
axes that separate them, which is exactly what the asking rung is good for — and
it is not a verdict. The model made that point itself, in its own closing line.

## Evidence

> [2025-06..2025-08] "Keep a skeptical eye on marketing hype — benchmarks can be cherry-picked. Run your own measurements against your workload, and remember the best framework is the one your team can maintain."

The line is quoted from a private source, so the atom carries no `quote_from` and
the verbatim gate skips it by name rather than checking it against a public file.
The date is a bracketed span: the thread is placed by its family, not an exact
commit.
