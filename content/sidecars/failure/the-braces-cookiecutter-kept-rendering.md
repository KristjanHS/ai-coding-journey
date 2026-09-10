---
title: The braces cookiecutter kept rendering
topic: the-template-repo
type: failure
summary: A cookiecutter template failed to generate one file at a time — every fix for a double-curly collision uncovered the next file with the same collision and no coverage.
---

# The braces cookiecutter kept rendering

Generating a project from the template died on the first file with a
double-curly brace that was never meant for the templating engine. The Makefile
carried a Docker format string, and Jinja read it as an expression it had to
evaluate:

```text
File "Makefile", line 187
@if ! docker compose ps -q app | xargs -r docker inspect -f '{{.State.Running}}' ...
jinja2.exceptions.TemplateSyntaxError: unexpected '.'
```

The textbook fix is to tell cookiecutter not to render those files — a
copy-without-render list in the template config, or a raw block around the
offending lines. Either one is correct. The trouble was that neither was
complete, and the error read identically after each attempt, so it was easy to
believe the fix had not taken when in fact it had — for the one file named, and
no other.

## What didn't work

Each narrow pattern closed one file and revealed the next. A list entry under
the generated-project folder left the template's own root Makefile still
rendered. Widening it to a recursive glob matched nested Makefiles but not the
one at the root, because the recursive form does not match a file sitting
directly at the top. Naming the root file explicitly cleared the Makefile and
surfaced an actions file under a composite-action folder, whose double-curly
expression the workflow-only pattern never covered. A separate misstep called a
method on the values object — the one meant to format the current year into a
licence — when the engine exposes that only as a tag, not a method. The loop
ended only once the config copied the whole config-heavy directory verbatim
rather than chasing one glob per failure.
