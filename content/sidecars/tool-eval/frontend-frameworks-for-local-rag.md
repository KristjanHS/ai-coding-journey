---
title: Frontend frameworks weighed for a local RAG app
topic: rag-stack-choices
type: tool-eval
summary: Six JavaScript frameworks plus Streamlit, ranked for a local-first RAG UI on the model's reading of published benchmarks — not a build anyone measured.
---

# Frontend frameworks weighed for a local RAG app

What was compared: React with Next.js, SvelteKit, SolidJS, Vue with Nuxt,
Angular, and Qwik as candidate frontends for a local-first RAG interface, with
Streamlit set beside them as the Python-native option that collapses the UI and
the pipeline into one process. The axes were bundle size, cold-start and
time-to-interactive, offline and desktop packaging, long-term API stability, and
the size of the hiring pool and plugin ecosystem.

The basis matters more than the ranking. Every figure in the comparison — the
roughly twenty-kilobyte Svelte bundle, the faster mount for SolidJS, the
maturity of the React AI tooling — came from benchmarks and vendor posts the
model cited, not from a build measured on the target hardware. That is an opinion
catalogue assembled from other people's numbers: useful for drawing the
shortlist, weak as a verdict. The model said so itself, closing with a caution
that such benchmarks are cherry-picked and the reader should measure their own
workload.

## What didn't work

Expecting the framework choice to be the decision. The same thread narrowed to a
Streamlit UI over a separate vector database serving a 7-billion-parameter model
locally, and the binding limit turned out to be GPU memory for ten concurrent
sessions on an 8 GB card — a constraint no frontend comparison had raised.
