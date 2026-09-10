---
title: The template repo
summary: A cookiecutter scaffold that stamps out new project repos, and the trap that dominates building one — the templating engine and the generated project both claim the same double-curly braces.
---

# The template repo

A source thread built around a cookiecutter template: a repo whose job is to
generate other repos, prompted for a project name and an author and then
rendered into a fresh tree. The subject is the collision that dominates the
work. Cookiecutter renders every file through Jinja, which owns `{{ ... }}`,
while the files being generated carry their own double-curly braces for other
tools — a Docker format string in a Makefile, an actions expression in a
workflow. The engine reads those as its own and stops.

The threads grouped here share that shape: a template that is correct for the
generated project yet invalid as a template, because a brace meant for a later
tool looks like a brace meant for now. The sidecar walks the loop that finding
it took; the atom names what that loop teaches about the asking rung.
