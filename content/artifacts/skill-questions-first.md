---
title: A skill, and why it asks before it builds
source: a private dotfiles repo — `skills/qimpag/SKILL.md` (excerpted here)
kind: skill
captured: "2026-09-08"
---

# Skill · a named procedure the agent can be told to follow

A skill is a markdown file the agent loads on demand and then follows as its procedure for a class
of task. It is the cheapest way to make a working method reproducible: the method stops living in
whatever the person happened to type that day.

`qimpag` is a thin one, and its thinness is the point. It does not implement anything. It launches
another skill (`impag`, the full-auto plan executor) with one instruction inserted at one moment:

```md
Questions-first variant of `impag`. It does **not** run a questions stage itself — it launches
`impag` with a directive to pause for one interactive questions round at the right moment:
**after** `impag` has resolved the target plan/stage (its steps 1–2), **before** it starts
executing tasks (its step 3).
```

## Why the moment matters

The obvious design is to ask the questions first, then start. `qimpag` refuses that, and says why:

```md
## Why this exists
`impag` is full-auto and never stops to ask. `qimpag` keeps `impag` fully in charge of plan/stage
resolution and the entire build — it only injects a single interactive checkpoint once `impag`
knows *what* it's about to build, so the questions are grounded in the actual resolved target
rather than guessed up front.
```

Questions asked before the plan is resolved are questions about an imagined task. Questions asked
after it are questions about named files. The difference shows up as re-work: an answer given
against the wrong mental model gets executed faithfully and thrown away.

The other rule in the file is about the *cost* of grounding those questions:

```md
- **Ground the questions with a brief, not the subsystem.** Recon to ground the questions round
  runs via `Explore`(Haiku) → a condensed brief (line anchors + rule/function signatures + design
  conflicts) — do **NOT** inline-read the subsystem into the parent to "ask better questions."
```

That is a context-engineering rule in the strict sense: it does not change what gets built, only
what is in the window while the decision is made. A file read into the main session is re-billed on
every subsequent turn of that session; a brief returned by a sub-agent is billed once.

## What didn't work

The first version asked its questions as prose and then stopped, waiting for a reply in the next
message. That reliably burned a turn and, worse, sometimes ended the turn having *announced* a
question round without ever asking one. The file now says so in as many words — *writing "ready to
put this to you as a round" IS the failure mode: emit the tool call instead.*

Also refused, after trying it: a "shall I proceed?" confirmation after the answers came back. The
answers are the go-ahead. A separate confirmation is a whole round-trip that cannot change the
outcome.

## Where it came from

`skills/qimpag/SKILL.md` in a private dotfiles repository — 103 lines. `qimpag` is not among the
skills published at [KristjanHS/claudeconf](https://github.com/KristjanHS/claudeconf), so there is
no public address to link to: the excerpts above are the whole evidence, quoted verbatim, cut for
length rather than to improve the argument. (`impag`, the skill `qimpag` wraps, *is* published
there.)

Ledger field it evidences: **retrieved**.
