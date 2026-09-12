---
title: Three numbered rules on the repo's first day
source: journey repo `token-monitor` — the rules section of `CLAUDE.md` as committed in `baba13a` on 2026-04-04
kind: memory
captured: "2026-04-04"
---

# Memory · an instruction file that predates the code it governs

Chapter 10's repo opens with a 55-line `CLAUDE.md` carrying three numbered rules — the day-one
artifact that makes its peak `configuring`, in a tool whose purpose was to measure what the other
repos' governance cost. The rules section, verbatim from the first commit:

```markdown
## Critical Rules

1. **Stdlib only** — no external dependencies. JSON parsing, file I/O, argparse only.
2. **After every change, run `pytest tests/ -q`** and verify all pass.
3. **JSONL log format is not ours to control** — be defensive about missing fields, never crash on unexpected data.
```

Thirty-one minutes later the file was rewritten (`3ea4845`) into a two-level disclosure scheme — the
instruction file was iterated on faster than the code under it.

## What didn't work

Rule 2 was green while the core lookup was broken: the "comprehensive test suite" passed, and the fix
for the slug bug it never exercised landed sixteen minutes after it.

## Where it came from

The journey repo `token-monitor`, `CLAUDE.md` at its first commit `baba13a` (2026-04-04). No public
address is claimed for it here; the excerpt is quoted in chapter 10.
