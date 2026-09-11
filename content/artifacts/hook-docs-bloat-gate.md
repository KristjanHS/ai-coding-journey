---
title: A writing-quality hook that learned to warn instead of block
source: public repo `KristjanHS/claudeconf` — `.claude/hooks/docs-bloat-gate.py`, synced 2026-07-09
kind: hook
captured: "2026-07-09"
---

# Hook · a quality check at the moment of writing

Instruction files get read into every later session, so padding in them costs something every day. This
hook runs before each write to a `.md` file and checks the text being added. The header of the file,
as synced on 2026-07-09:

```text
docs-bloat-gate — PreToolUse hook on Write/Edit/Bash.

Why it saves context: docs and rules that grow unchecked get read into context
on every future session. This gate watches .md writes and nudges (or, for the
opt-in size ratchet, blocks) the bloat at write time. Signals:
  S2: AI-slop stoplist phrase in net-added text         ADVISORY (warns, never blocks)
  S3: lexical density < 0.45 on >100-char addition      ADVISORY (warns, never blocks)
  W1: new docs/*.md root file with audit/analysis/report/research keywords
      (Write only, requires project's docs/ dir to exist) ADVISORY (warns, never blocks)
  S1: char-delta exceeds tier cap (rule<50ln=150,
      doc=800, spec=2000)                               BLOCKS, bypassable, opt-in per project

S2/S3/W1 are advisory: the write proceeds and a one-line nudge is fed back via
PreToolUse additionalContext, throttled to once per signal per session so the
nudge itself can't become a token drain.
```

## What didn't work

Blocking on the style signals. The commit that brought this version over (2026-07-09) records the change:

```text
S2 slop / S3 density / W1 new-doc signals now warn via a throttled
PreToolUse additionalContext nudge instead of blocking; only the S1
size ratchet still blocks (opt-in, bypassable, override cap N=3).
```

Only the size cap still stops the write. Anything that judges wording now just warns.

## Where it came from

`.claude/hooks/docs-bloat-gate.py` in the **public** repo `KristjanHS/claudeconf`, at the commit of
2026-07-09 titled `sync(docs-bloat-gate): adopt advisory semantics from dotfiles`. A reader can check it.
The version it was synced from lives in a private repo.
