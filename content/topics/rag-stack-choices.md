---
title: RAG stack choices
summary: Asking a model which frontend and stack to build a local RAG app on returns a ranked catalogue of frameworks, not a measurement of your own workload.
---

# RAG stack choices

A source thread that opened with a single asking-rung question: which modern
frontend framework to build a local retrieval-augmented-generation app on. What
came back was a ranked field — React with Next.js, SvelteKit, SolidJS, Vue,
Angular, Qwik, and Streamlit as the Python-native alternative — each with a
one-line case drawn from published benchmarks and vendor blogs.

The subject of this topic is what that kind of answer is and is not. It is a map
of the options and the axes that separate them — bundle size, cold-start,
offline packaging, ecosystem maturity — synthesised from sources the model cited
but never ran. It is not a measurement of the one workload that matters, yours.
The thread bore that out: once the question narrowed to a concrete stack serving
a local model on 8 GB of VRAM, the deciding constraint turned out to be the GPU
memory wall, which no framework comparison had touched. The sidecar describes the
comparison; the atom names what the asking rung actually hands you.
