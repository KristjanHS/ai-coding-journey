---
title: A rule file, and the path gate that loads it
source: this repo — `.claude/rules/content-writing.md`
kind: rule
captured: "2026-09-08"
---

# Rule · a path gate decides what the model reads

A rule file is not a document the agent is told to consult. It is a document that **loads itself**
when a matching path is touched, and stays out of the window otherwise. The `paths:` block is the
whole mechanism:

```yaml
---
name: Content writing — evidence, not hype
description: What each content/ target admits and refuses; the evidence rule and the anti-hype rule as path-gated instructions
paths:
  - "content/**/*.md"
---
```

Edit `src/pages/index.astro` and none of this is in context. Edit `content/journey/04-llm-eng-template.md`
and all of it is, before the first line is written. That is the `could see` ledger field with a
concrete implementation: not "the agent knows the house style", but *this file, on these paths.*

## What it governs

The body it gates is two rules and a table. The rules:

```md
## Evidence rule
Every journey chapter carries **≥1 artifact block** — a real prompt, a rule/skill excerpt, a defect a
reviewer sub-agent caught (with the fix commit's subject), or a measured number *with how it was
measured*. A chapter without one is not done; the content test (from inc3) reds on it.

## Anti-hype rule
- **No claim without an artifact or a number.** "X worked" names the repo, the date and the evidence.
- **Failures get equal billing.** Every chapter has a `## What didn't work` before `## What I learned`.
```

A third bullet lists ten banned marketing words. It is not quoted here, and the reason is worth
more than the list: the content suite greps every file under `content/` for those words, this page
lives under `content/`, and quoting the list red the gate on the first run. The rule caught its own
documentation. The list is in the file at the path below.

The table is the part that does the most work per line: one row per writable target, each with an
`admits` column and a `refuses` column. A target absent from the table is not writable.

Note the last clause of the evidence rule — *the content test reds on it*. The rule does not rely on
being obeyed. Both halves are also asserted by the `vitest` suite in `tests/content.test.ts`, so a
chapter that ignores the rule fails `make check` rather than shipping.

## What didn't work

Writing the same constraints into `CLAUDE.md` instead. `CLAUDE.md` loads on **every** session in the
project, so every constraint there is paid for on every turn whether or not the session touches
`content/`. Moving them behind a `paths:` gate cost nothing to write and removed them from the
window of every session that builds the site instead of writing prose.

The second thing that didn't work: leaving the rule as the only enforcement. A rule is an
instruction, and an instruction is a request. The banned-vocabulary list only became reliable once
the same list existed as a grep in the test suite — and only once that grep had been mutated and
confirmed red, because a check that cannot fail proves nothing.

## Where it came from

`.claude/rules/content-writing.md` in **this repository** — 43 lines, and diffable against what you
just read. It is the only one of the five artifacts here with a public address; the other four are
excerpted from private or per-machine files and have to be taken as quoted.

Ledger field it evidences: **could see**.
