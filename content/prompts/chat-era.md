---
title: The chat-only era
source: ChatGPT corpus
captured: 2025-06-14/2025-07-06
---

# Prompts · the chat-only era

These come from the ChatGPT threads of the first era, before any coding agent was installed —
no editor integration, no file access, no repo. The window is dated by bracketing, not measured:
the export dropped its timestamps, so `2025-06-14/2025-07-06` is a bracket derived in
`docs/sources-chatgpt-conversations.md`, and every date on this page is estimated. Individual
prompts are undated in the source and no date is inferred. Whether a given prompt would still be
used is not recorded either — entries are unmarked rather than guessed.

Reproduced as typed, sanitised only where a quote named a person, an employer, or a machine.
Typos are kept, because the point of the page is what was actually typed, not what should have
been.

Shapes that recur but that no single thread carries as one quotable line are **not on this page**.
They were dropped rather than reconstructed — a smoothed-out prompt would read better and prove
less.

## The learning-path request

The opening move of the era: state a goal that is well past current ability, then ask for the
ordered route to it. The interesting part is clause 2 — not "teach me", but "list the courses",
which treats the model as an index rather than a tutor.

> I want to set up a local LLM instance of LLM that provides searches over confidential data. 1. List, what AI skills and tools should I learn if I already have basic experience with oobabooga? 2. Create a comprehensive list of practical free courses that I should go through, in order to get the knowledge and experience of the necessary AI skills and tools.

## The constraint-scoped shortlist

The hardware ceiling is stated inside the question, so the answer arrives pre-filtered. This is the
era's characteristic move and the reason its tool choices look narrow in hindsight: the shortlist
was never the field, it was the field that fit 8 GB.

> Search the web, and find me top3 highest quality coding models for local ollama powered Autocomplete function, that would still fit into my 8GB VRAM.

The same shape with a feature requirement instead of a hardware one, which shows the constraint
slot is general — it takes whatever the limit happens to be:

> Search for top3 ollama gui that enables to see model parameters and delete model

## The beginner-dev framing

Recurring across several threads, usually as the first line of a longer question:

> I am a beginner python programmer on AI topics.

It is doing work. Declaring the level up front is what makes the answers usable at that level, and
it is the one habit from this era that survived into every later one — the agent rules and prompt
preambles written years afterward are the same move, formalised.

## Comparing tools on other people's experience

Not "which is better" but "find what people report" — the evaluation is delegated to the search,
and the model is asked to aggregate rather than to opine.

> Search for recent real life experience: Compare the agent mode capabilities, maturity and speed of Roo code and Cursor

## What recurs

Every shape on this page states a boundary before it asks for anything: the hardware ceiling, the
skill level, the feature the tool must have, the kind of evidence that counts. The request comes
second and is always for a *ranked shortlist* — top3, best, compare — never for an open survey.

This is the era's whole method, and it explains what came next. A chat that cannot see the machine
can only be steered by describing the machine, so the constraints go in the prompt. Once the tools
could read the repo themselves, that description moved out of the prompt and into config files —
but the habit of writing the limits down first was already there.

The era left almost nothing else behind. No repo, no commits, no tool logs — the threads are the
only artifact, which is why this page exists at all.
