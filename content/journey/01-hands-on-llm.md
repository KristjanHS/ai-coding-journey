---
title: hands-on-llm
repo: hands-on-llm
start: 2025-06-19
end: 2026-04-11
commits: 169
stage: chat
tools: [copilot, gemini-code-assist, continue, cursor, claude-code]
deck: false
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

169 commits between 2025-06-19 and 2026-04-11. The early ones are not impressive and that is the
point — `test2 for vscode wsl 2 venv verification`, then `cwd debug`, then `removed ready`.

## What didn't work

**Compiling Oobabooga against CUDA Toolkit 12.6 on Windows.** Never got it working — my note at the
time reads *"Seda ma ei saanud Win all kunagi tööle"*. The workaround was to stop trying and keep
two toolkits (12.1 and 12.6) installed side by side, selecting per project. Abandoning it was the
correct call; I spent too long on it first.

**GitHub Copilot Coding Agent on the free plan.** It simply does not run there. Nothing in the UI
said so up front — I found out by trying to use it. Same class of discovery with Gemini's free tier
truncating long answers, which I worked around by appending a line to prompts rather than by
understanding the cap:

> Give me shorter answer so it would not exceed the maximum allowable output in Gemini Code Assist
> free tier.

**A course I picked without checking its toolchain.** I got some way into a JetBrains Academy Python
track before realising it assumed PyCharm throughout, while everything else I ran was VS Code and
WSL. My note is one line: `WRONG IDE!`

**Letting pip resolve dependencies.** Installing `xformers` repeatedly and silently upgraded Torch
out from under a pinned CUDA build. The fix was a flag and a comment I had to write to myself:

```text
--no-deps  # prevents pip from "helpfully" upgrading Torch
```

**`code .` from WSL stopped working** partway through, for reasons I never established. Recovery was
re-adding VS Code to PATH, and when that failed, reinstalling VS Code and the Remote-WSL extension.
I did not root-cause it.

**A run that silently used no GPU at all.** Re-running the Windows setup later the same day, I
dropped `--n-gpu-layers` from the launch command while only 1.2 GiB of VRAM was free. Ollama offloaded
nothing and ran the whole model on CPU — `layers.offload=0`, `CPU model buffer size = 3922.02 MiB` —
and reported no error. A second setting in that same run was rejected just as quietly:

```text
msg="quantized kv cache requested but flash attention disabled" type=heap
```

The `OLLAMA_KV_CACHE_TYPE=heap` I had set did nothing, because flash attention was off. Both were
one log line each in a log I skimmed.

## What I learned

**Pick the model from a benchmark, not from a vibe.** Comparing coding models against HumanEval
pass@1 alongside their 4-bit VRAM footprint made the choice mechanical:

| model | HumanEval pass@1 | 4-bit VRAM |
| --- | --- | --- |
| DeepSeek-Coder 6.7B | 88–90 % | ≈3.5 GB |
| StarCoder2 7B | 78–80 % | ≈3.8 GB |
| Code Llama 7B | 67 % | ≈4 GB |

The 8 GB VRAM on the machine is the real constraint: it caps local work at roughly 7-billion-parameter
models, which decided the shortlist before any quality argument did.

**I believed a benchmark I never ran.** My README states that Windows Ollama was fastest of four
local setups. Going back through the logs to find the numbers behind it, there are none. What the
notes actually contain is four server-startup logs, and they cannot be compared:

| setup | Ollama | model | GPU offload | first `/api/generate` |
| --- | --- | --- | --- | --- |
| Ollama / Windows | 0.6.1 | Mistral-7B-**Instruct** | 33/33 layers | 1.42 s |
| Ollama / WSL 2 | 0.9.2 | Mistral-7B-**Instruct** | 33/33 layers | 49.47 s |
| Ollama / Windows redo | 0.6.1 | Mistral-7B-**Instruct** | **0/33 — CPU only** | 1.40 s |
| Oobabooga / Windows | n/a | Mistral-7B-**base** | 33/33 layers | never ran |

That 1.42 s against 49.47 s reads like Windows being thirty-five times faster. It is not a generation
measurement at all — it is model load time. The Windows runner was launched with `--no-mmap`, so
weights were read up front; the WSL runner used `mmap = true` and cold-read 3.83 GiB from disk. Both
logs even say so directly, and I did not read them:

```text
msg="llama runner started in 1.26 seconds"
msg="llama runner started in 49.02 seconds"
```

Subtract the load and each run generated for a fraction of a second. On top of that the two Ollama
versions differ, the Oobabooga run used base weights rather than Instruct and produced no generation
at all, and the fourth setup — Oobabooga under WSL — was never logged. The lesson is not about
Ollama. It is that "X is fastest" survived in my own README for months because I never asked which
number said so.

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
