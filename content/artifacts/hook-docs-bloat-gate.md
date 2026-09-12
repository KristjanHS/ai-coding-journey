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

The copy rotted where the original moved on. The hook was first authored in the `fte-budget-planner`
repo (2026-04-25) and promoted to the global configuration in May; on 2026-07-27 that repo's
inherited test suite was still asserting the blocking contract this version had deleted two days
earlier. The diagnosis, verbatim from that repo's working notes (2026-07-27):

```text
`make check` is red on a clean tree — 57 pre-existing failures, all in
`tests/hooks/test_docs_bloat_gate_v2.py`. Verified pre-existing by stashing my changes (57 failed
/ 21 passed at clean HEAD). The cause: that suite asserts `rc == 2` (blocked) for writes to gated
paths, but the global `docs-bloat-gate.py` header now reads "Signals on .md writes (all advisory —
warn, never block)" — S2/S3 became advisory and the S1 tier caps were removed on 2026-07-25. The
suite pins a contract that was deliberately deleted.
```

## Where it came from

`.claude/hooks/docs-bloat-gate.py` in the **public** repo `KristjanHS/claudeconf`, at the commit of
2026-07-09 titled `sync(docs-bloat-gate): adopt advisory semantics from dotfiles`. A reader can check it.
The version it was synced from lives in a private repo.
