---
title: stt-faster
repo: stt-faster
start: 2025-10-05
end: 2026-05-29
commits: 274
stage: delegating
stage_peak: delegating
could_see: path-gated-rules
retrieved: grep-on-demand
versioned: code-and-rules
verified_by: tests
cost_to_look: floor
tools: []
deck: false
artifact: present
---

# 05 · stt-faster

## What I was trying to do

This is one of the longer-running repos in the journey: batch speech-to-text for Estonian
meeting recordings — phone-mic audio with quiet and far speakers, silence and room
noise — running faster-whisper over a CTranslate2 build of an Estonian Whisper model.
By December 2025 the pipeline transcribed fine on CPU, but I wanted it on the GPU: an
RTX 3070 under WSL2, for the speed a longer backlog of recordings needed. The GPU
tests were the blocker.

## What didn't work

On 2025-12-07 the GPU tests failed: `get_cuda_device_count()` returned 0 and the
`ctranslate2.cuda` module was missing, so faster-whisper could not load on the GPU —
even though `nvidia-smi` saw the RTX 3070 and CUDA 12.x was installed. I read that as
a missing wheel and framed the whole search around it: find the CUDA-enabled
CTranslate2 wheel for Python 3.12 and CUDA 12.x, the `+cu125`/`+cu129` download URL, the
S3 or GitHub asset path. That wheel does not exist. The standard PyPI CTranslate2 wheels
for Linux and WSL2 already include CUDA; the CPU-only behaviour came from a CTranslate2
in the venv that was *not* the PyPI wheel — a conda/distro build compiled without CUDA —
shadowing the one that would have worked. The hours spent hunting a download were spent
on the wrong problem.

## What I learned

How a bug is framed can send the entire search down a dead end. I asked "where is the
CUDA wheel?" when the question that resolved it was "which CTranslate2 is actually
imported?" — one force-reinstall from PyPI, not a download. A model that searches the
web earned its place here by correcting the false premise before I acted on it: there
is no separate CUDA wheel to find. And the durable form of a fix is to put it back into
the repo where the next machine will hit the same wall: the recommended
`ctranslate2==4.6.2` reinstall is now a printed repair step in `scripts/check_gpu.py`,
whose pin was bumped 4.4.0 → 4.6.2 on 2026-05-21.

## Artifact

The research thread was dated 2025-12-07. Its useful move was not an answer but a
correction of the premise — verbatim:

> On **x86_64 Linux/WSL2 with Python 3.12** you do *not* need a special `+cu125`/`+cu129` CTranslate2 wheel. The **standard PyPI wheels for Linux/Windows already include CUDA support** (compiled with CUDA ≥ 11, targeting CUDA 12.x at runtime). If you're seeing "CPU-only" behaviour, it's almost certainly because:
>
> - You're **not actually running the PyPI wheel** (e.g. Nix/conda/distro package compiled without CUDA), or
> - CUDA libs are **not visible inside WSL**, so the GPU backend can't initialize.

The fix was a reinstall, not a download:

```bash
pip install --upgrade --force-reinstall --no-cache-dir "ctranslate2==4.6.2"
```

The thread ended on the model's diagnosis, without a reply confirming the GPU came up.
The repo confirms it took hold anyway: the same `4.6.2` force-reinstall (as `uv pip`) is
the repair command printed by `scripts/check_gpu.py`, whose pin was bumped from `4.4.0` on
2026-05-21 — the fix is baked in where the next failing machine will read it.

## Atoms

Over its seven months the same repo produced a separate lesson at the planning rung.
Asked one line — "audit the project for unnecessary complexity and overengineering, and create .md plan for 10 highest value refactors" — the model returned a ranked plan file rather than a patch: the hard count is what forced the ranking.

- [A hard count forces the ranking](../atoms/planning--a-hard-count-forces-the-ranking.md)
