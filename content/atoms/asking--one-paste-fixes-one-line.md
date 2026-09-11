---
title: One paste fixes one line, not the class
topic: the-template-repo
rung: asking
concern: quality
question: When you paste an error and apply the fix that comes back, why does the same error keep returning?
audience: [university, rnd-engineers]
evidence: defect
minutes: 3
level: show
source_chapter: 04-llm-eng-template
slot: open
---

# One paste fixes one line, not the class

At the asking rung the loop is paste the error, read the fix, apply it. The fix
that comes back is usually right — and scoped to exactly the line you pasted.
When the real fault is a whole class of file, not one line, each correct fix
clears one instance and the identical error returns from the next file that has
the same problem and no coverage yet.

The template collision is the clean case. Every file carrying a double-curly
brace for some later tool trips the same engine error, but the traceback only
ever names the one file being rendered when it stops. Fixing that file is
progress you cannot see, because the next render fails the same way on a
different file. What breaks the loop is reading the error as a class — every
file with those braces — rather than as the single line in front of you.

## Evidence

> [2025-10-20] After each targeted fix the same error returns unchanged — `File "Makefile", line 187 ... TemplateSyntaxError: unexpected '.'` at the Docker `{{.State.Running}}` brace, now from a file the last fix did not cover.
