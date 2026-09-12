---
title: The question that turned a repo into a template
source: a private chat thread from the llm-eng-template era, quoted at authoring time
kind: prompt
captured: 2025-09-03/2025-10-20
---

# Prompt · ask what the second user does with your name

The prompt is undated in its source; `captured` is the template repo's git span. It was asked while
four open files still carried the author's own project name:

```text
right now i have "llm-eng-template" hardcoded in the 4 open files. How can I enable the user of this github repo template, to easily use his own project name in all these files? should I remove my hardcoded names from these, or are there other best-practice alternatives?
```

What it was for: deciding whether the repo stayed a repo-to-copy or became something a stranger
generates from. The answer was to stop treating it as a repo and make it a Cookiecutter template —
the hardcoded names became generation-time variables (`project_name`, `project_slug`,
`author_name`), and the README now opens with the prompts a user answers instead of the name the
author happened to pick. It was a one-time question: the conversion it triggered is the reason it
does not recur.

## What didn't work

The shape the question ended: a repo to copy, where every hardcoded value is a defect the moment a
second person generates from it. Removing the four names by hand would have fixed four files, not
the class.

## Where it came from

A private conversation export — undated in source, with no public address, so the quoted question
is the whole evidence here. The Cookiecutter conversion it led to is in the template repo's own
history and README.
