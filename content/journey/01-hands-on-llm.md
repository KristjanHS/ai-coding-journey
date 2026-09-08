---
title: hands-on-llm
repo: hands-on-llm
start: 2025-06-19
end: 2026-04-11
commits: 170
stage: asking
stage_peak: asking
tools: [copilot, gemini-code-assist, continue, cursor, claude-code]
deck: true
artifact: present
---

# 01 · hands-on-llm

## What I was trying to do

Rebuild a working development environment from nothing, and prove at each step that it worked —
after twenty years away from writing code. The repo is organised as numbered phases rather than
features: `phase0/` environment, `phase1/` local LLM experimentation, `phase2/` RAG, `phase3/`
AI-safety and quantisation.

The plan that produced that structure came from a prompt, not from a syllabus. I asked for
checkpoints because I did not trust myself to notice a skipped prerequisite:

> Create a detailed hands-on learning path for Phase 0 only - with free video courses that help me
> to learn and practice. Each step needs to have a check-point that validates I have understood
> enough and I have not missed a step that is necessary to continue.

The repo holds 170 commits between 2025-06-19 and 2026-04-11. The early ones are not impressive and
that is the point — `test2 for vscode wsl 2 venv verification`, then `cwd debug`, then `removed ready`.

Those 170 are a count of *this repo*. The tool I was using is recorded separately and does not line up
with it: across all my workspaces, Copilot Chat left a chat history in only 6 of 18. Those logs carry
no token field at all, so the chat stage is the one era with nothing to measure but its dates — not a
small number, a missing one.

## What didn't work

- **Compiling Oobabooga against CUDA Toolkit 12.6 on Windows.** Never got it working; my note reads
  *"Seda ma ei saanud Win all kunagi tööle"*. The workaround was to keep both toolkits (12.1 and 12.6)
  side by side, selecting per project. Abandoning it was correct; I spent too long on it first.
- **GitHub Copilot Coding Agent on the free plan.** It does not run there, and nothing in the UI said
  so — I found out by trying. Same class of discovery with Gemini's free tier truncating long answers,
  which I worked around by appending *"Give me shorter answer so it would not exceed the maximum
  allowable output in Gemini Code Assist free tier"* rather than by understanding the cap.
- **A course I picked without checking its toolchain.** I got into a JetBrains Academy Python track
  before realising it assumed PyCharm throughout, while everything else I ran was VS Code and WSL.
  My note: `WRONG IDE!`
- **Letting pip resolve dependencies.** Installing `xformers` repeatedly and silently upgraded Torch
  out from under a pinned CUDA build. The fix was a flag and a comment I had to write to myself:
  `--no-deps  # prevents pip from "helpfully" upgrading Torch`.
- **`code .` from WSL stopped working** partway through, for reasons I never established. Recovery was
  re-adding VS Code to PATH, then reinstalling VS Code and the Remote-WSL extension. Never
  root-caused.
- **A run that silently used no GPU at all.** Re-running the Windows setup later that day, I dropped
  `--n-gpu-layers` with only 1.2 GiB of VRAM free. Ollama offloaded nothing and ran the whole model
  on CPU — `layers.offload=0`, `CPU model buffer size = 3922.02 MiB` — and reported no
  error. A second setting in that run was rejected just as quietly:
  `msg="quantized kv cache requested but flash attention disabled"`, because flash attention was off.
  Both were one log line each in a log I skimmed.

## What I learned

**Pick the model from a benchmark, not from a vibe.** Published figures recorded at decision time made
the choice mechanical: DeepSeek-Coder 6.7B (88–90 % HumanEval pass@1, ≈3.5 GB at 4-bit) over
StarCoder2 7B (78–80 %, ≈3.8 GB) and Code Llama 7B (67 %, ≈4 GB). Those are numbers I copied, not
measurements of my own — and the 8 GB of VRAM on the machine capped the shortlist at roughly
7-billion-parameter models before any quality argument ran.

**I believed a benchmark I never ran.** My README states Windows Ollama was fastest of four local
setups. Going back for the numbers behind it, there are none — four server-startup logs that cannot
be compared:

| setup | Ollama | model | GPU offload | first `/api/generate` |
| --- | --- | --- | --- | --- |
| Ollama / Windows | 0.6.1 | Mistral-7B-**Instruct** | 33/33 layers | 1.42 s |
| Ollama / WSL 2 | 0.9.2 | Mistral-7B-**Instruct** | 33/33 layers | 49.47 s |
| Ollama / Windows redo | 0.6.1 | Mistral-7B-**Instruct** | **0/33 — CPU only** | 1.40 s |
| Oobabooga / Windows | n/a | Mistral-7B-**base** | 33/33 layers | never ran |

1.42 s against 49.47 s reads like Windows being thirty-five times faster. It is load time, not
generation: Windows ran with `--no-mmap` and read weights up front, WSL cold-read 3.83 GiB from disk —
`llama runner started in 1.26 seconds` against `49.02 seconds`, and I read neither line. Subtract the
load and each generated for a fraction of a second. The versions differ, the Oobabooga run used base
weights and produced nothing, and the fourth setup was never logged. "X is fastest" survived in my own
README for months because I never asked which number said so.

**Pin the tool, not just the library.** After being broken by an upgrade I pinned the agent CLI the
same way I pin a dependency, with a standing instruction not to update it globally.

## Artifact

A review comment on this repo caught a bug that was passing. The `pyproject.toml` package discovery
used a glob that resolved correctly only because no directory happened to match it — working code,
for a reason that had nothing to do with intent. Commit `53c5f5f` (2026-04-11):

```text
Fix review issue: use explicit empty packages list in setuptools config

Replace glob-based find (which worked by coincidence of no matching
directory name) with explicit packages = [] for clear intent.
```

That is the argument for the review step in one commit. The test suite was green before and after;
nothing observable changed. A reviewer reading for intent found it, and no amount of running the
code would have.
