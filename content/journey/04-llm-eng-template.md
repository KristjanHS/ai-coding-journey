---
title: llm-eng-template
repo: llm-eng-template
start: 2025-09-03
end: 2025-10-20
commits: 70
stage: delegating
stage_peak: delegating
could_see: path-gated-rules
retrieved: grep-on-demand
versioned: code-and-rules
verified_by: tests
cost_to_look: floor
tools: [cursor]
deck: false
artifact: present
---

# 04 · llm-eng-template

## What I was trying to do

Package the setup I had converged on — Python 3.12, backend, frontend, Docker tooling, agent-facing
docs — so other people could start from it instead of rebuilding it. It exists because I was going to
Cursor meetup group meetings and wanted to hand over my working configs and workflows rather than
describe them.

That goal changed the problem. A setup that only has to work for me can hardcode my own project name;
one that other people generate from cannot.

## What didn't work

The template's own tooling was the part that kept breaking, not the code it generated. The commit log
across 69 commits reads `makefile syntax fix`, then `makefile fixes 2`, then
`pre-commit fixed for unit tests`, and `pip-audit fix` twice. Shipping a scaffold means its build,
hooks and audit step have to be green on someone else's machine on the first try, and mine repeatedly
were not.

## What I learned

Sharing something forces a specific kind of rigour that private work never asks for. Every hardcoded
value is a defect the moment a second person generates from it, and every broken hook is their first
impression of the project rather than a minor annoyance of mine.

## Artifact

The turning point was a question about my own repo, asked while four files still had my project name
baked into them:

> right now i have "llm-eng-template" hardcoded in the 4 open files. How can I enable the user of this
> github repo template, to easily use his own project name in all these files? should I remove my
> hardcoded names from these, or are there other best-practice alternatives?

The answer was to stop treating it as a repo to copy and make it a Cookiecutter template. The
hardcoded names became generation-time variables, and the README now opens with the prompts a user
answers instead of the name I happened to pick:

```text
cookiecutter gh:<user>/llm-eng-template

  project_name  – human readable title (`My LLM Project`)
  project_slug  – directory/package name
  author_name   – used in licensing and docs
```
