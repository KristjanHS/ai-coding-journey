---
title: A deny list the harness enforces, replacing one nobody read
source: public repo `KristjanHS/kri-local-rag` — `.claude/settings.json`, commit of 2026-09-06
kind: settings
captured: "2026-09-06"
---

# Settings · what the agent may not open

A rule asks the model to stay out of a directory. A **settings file** doesn't ask: the harness refuses the
read before the model sees the file. This is the `could see` ledger field set by configuration, not by
instruction.

The commit that introduced this file (2026-09-06) says why it had to exist:

```text
.claudeignore was never implemented by Claude Code (anthropics/claude-code#4160),
so its patterns were inert. Translate them (plus .aiignore/.cursorignore where
present) into permissions.deny Read() rules, gitignore-style: patterns with a
path component become ./path/**, bare names become **/name/**. Delete the now
redundant .claudeignore; .cursorignore/.aiignore stay for Cursor and others.
```

An excerpt of the file it wrote (the full list has 33 entries):

```json
{
  "permissions": {
    "deny": [
      "Read(**/__pycache__/**)",
      "Read(**/.venv/**)",
      "Read(**/.cursor/**)",
      "Read(**/.gemini/**)",
      "Read(**/AGENTS.md)",
      "Read(**/logs/**)",
      "Read(**/data/**)",
      "Read(./docs/plans/archive/**)"
    ]
  }
}
```

Three of those entries keep one agent from reading another agent's instruction files.

## What didn't work

The ignore file it replaced. It sat in the repo and looked like a control, but the tool never read it. The
same commit subject lands in several repos on 2026-09-06: one policy change, applied across the set.

## Where it came from

`.claude/settings.json` in the **public** repo `KristjanHS/kri-local-rag`, as added on 2026-09-06, so a
reader can check it. The commit message above is quoted verbatim from the same commit.
