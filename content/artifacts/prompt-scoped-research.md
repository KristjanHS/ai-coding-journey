---
title: A research-scaffold prompt that recurs verbatim
source: a private ChatGPT thread, 2025-12-07 — "WSL POSIX semaphore issue"
captured: "2025-12-07"
kind: prompt
---

# Prompt · turn a blocker into a bounded research brief

A reusable opening the author pastes over a concrete technical blocker: it fixes the tone
(best practices, not over-engineered), asks for web-grounded answers, then hands the model a
list of questions to pursue rather than a single "how do I fix this". Still used as-is.

## The scaffold

From the semaphore thread, the framing sentence — leading export bullet removed, verbatim
otherwise:

```text
Search the web for answers, then provide clear (but not restrictive) answers that I can lean on when creating my next step plan. I want my solution to be aligned with best practices but not over-engineered.
```

The issue statement then ends on a fixed header and its own numbered questions:

> Research questions to pursue:
>
> Does your WSL (version 1 vs 2) support POSIX named semaphores, and are there known limitations/bugs causing SemLock permission errors?
>
> Are there recommended mount options or remount steps for /dev/shm on WSL to allow SemLock …

Four more questions follow the same shape, each naming one thing to verify.

## The same shape, next thread

The scaffold is not a one-off. A second thread the same day — a hunt for a CUDA-enabled
`ctranslate2` wheel — opens on the same framing sentence and then lists its own five research
goals under a *Research goals* header. The opener is word-for-word the same; only the header and the
questions change with the problem. That second instance is not quoted here, per the corpus rules.

## Why it holds

The list is the work. Turning "fix my semaphore error" into six named questions forces the model to
separate what is known (WSL2 supports the feature) from what must be checked (mount options, sandbox
confinement), and the answer comes back as a decision tree rather than one confident guess.

## Where it came from

A private ChatGPT export under `sources/chatgpt_conversations2/` — gitignored, not in this repo.
A reader cannot open either thread or verify the quotes; the live thread URLs are withheld as a
corpus leak class. The quoted lines are reproduced verbatim from the semaphore export, with the one
marked elision.
