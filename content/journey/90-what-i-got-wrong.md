---
title: what I got wrong
tools: []
deck: true
artifact: present
---

# 90 · what I got wrong

## What I was trying to do

Answer a question I had assumed was answerable at any time: how much of this work went through which
tool. I went looking two years in, expecting to read it off, and found instead that the answer depends
entirely on what each tool happened to write to disk while I was not paying attention.

The measurement pass that produced `content/measurements/` is the repair job. It is also the clearest
evidence of the mistake, because most of what it found is absence.

## What didn't work

Assuming the tools were keeping the receipts — and, for one afternoon, assuming they were doing the
work they reported doing. They were not, and each one failed differently.

GitHub Copilot Chat wrote no token field at all — what survives is a chat history in 6 of 18 VS Code
workspaces and nothing quantitative in any of them. Cursor logs every session but prices only 4.86% of
its message bubbles, all of them assistant turns, so its totals are a floor and a client-side estimate
besides. The Codex plugin started logging partway through, on 2025-09-23, and only in a third of its
rollouts, so its total is a floor too.

Only Claude Code writes enough per-session state to answer properly — and it prunes the transcripts,
so even there the logs start 161 days after the era does.

The behavioural half is a single afternoon, 2025-12-05, in Cursor. Every command the agent sent through
its Shell tool came back `exit -1` with a terminal state reading `pid: -1`, no stdout and no stderr — the
agent's own shell wrapper, not the WSL2 environment underneath it. The same day its edit tools reported
success on files they had left untouched on disk, the behaviour catalogued as CVE-2025-59944. A plan file
appeared in the reply as a `+380`-line diff and did not exist on disk until I pressed Apply. And the
agent's plans themselves lived in the editor's internal application data, not as files beside the code
they described.

Four failures, one class: the tool told me what it had done and the disk said otherwise. That is the
receipts problem in the present tense, two years before I went looking for it in the logs.

## What I learned

Four tools, four different answers to "what went through here", and only one of them is trustworthy:
exact, floor-because-partial, floor-because-sampled, absent. Those are states, not missing values, and
treating them alike would have produced a tidy chart that was mostly fiction.

What I got wrong was the ordering. I picked tools on how they felt to work with and expected to
reconstruct the record afterwards. The record is only reconstructable for the tool that decided, on its
own, to write it down. If a number matters, the time to check that it is being recorded is before the
two years, not after.

The second thing I got wrong was assuming a measurement is publishable because it is true. Most of this
pass measures one person's private usage; what generalises is the *availability* of the evidence, so
that is what ships and the volumes stay private.

Leaving Cursor had a date and a stated cause. On 2026-02-08 I asked what its subagents could actually do
and got a straight answer: *"tool-use only (within the same conversation context)"* — no separate context
to hand work to, which was the whole reason I wanted them. The day before, on 2026-02-07, I had mapped
what free agents could do instead: OpenCode, Cline and Aider, each checked against the capabilities I
cared about. So the switch was priced before it was made, which is the part that matters. The failures of
2025-12-05 are a complaint on their own; the limitation I could name, and the free alternatives I had
already costed, are what make them an argument.

## Artifact

The finding, as the generator emits it — an availability matrix rather than a metrics table, because
the honest content of two of these rows is a named absence:

```json
{ "id": "cursor",  "tokens": "floor", "share": 0.267 }
{ "id": "copilot", "tokens": "none",  "share": null   }
```

A chart cannot render `null`. A table of states can, and that constraint is what kept the measurements
page truthful — before there was any reason to redact it.
