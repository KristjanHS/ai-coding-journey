---
title: The wheel hunt, and the answer that corrected its premise
source: a private ChatGPT thread, 2025-12-07 — the CUDA-enabled CTranslate2 wheel hunt
kind: prompt
captured: "2025-12-07"
---

# Prompt · a research brief whose best answer was "wrong premise"

The thread opens on the same research scaffold quoted in
[A research-scaffold prompt that recurs verbatim](prompt-scoped-research.md) — word-for-word the
same opener, then five research goals of its own — and every goal presumed the diagnosis: find the
CUDA-enabled CTranslate2 wheel for Python 3.12 and CUDA 12.x. The useful move in the reply was not
an answer to any of the five. It corrected the premise, verbatim:

> On **x86_64 Linux/WSL2 with Python 3.12** you do *not* need a special `+cu125`/`+cu129` CTranslate2 wheel. The **standard PyPI wheels for Linux/Windows already include CUDA support** (compiled with CUDA ≥ 11, targeting CUDA 12.x at runtime). If you're seeing "CPU-only" behaviour, it's almost certainly because:
>
> - You're **not actually running the PyPI wheel** (e.g. Nix/conda/distro package compiled without CUDA), or
> - CUDA libs are **not visible inside WSL**, so the GPU backend can't initialize.

The fix was a reinstall, not a download:

```bash
pip install --upgrade --force-reinstall --no-cache-dir "ctranslate2==4.6.2"
```

## What didn't work

The framing the thread was given. Hours went into hunting a `+cu125`/`+cu129` download URL for a
wheel that does not exist, because the question asked was "where is the CUDA wheel?" instead of
"which CTranslate2 is actually imported?". The thread also ended on the model's diagnosis, without
a reply confirming the GPU came up.

## Where it came from

A private ChatGPT export — the thread is self-dated 2025-12-07 and has no public address. The repo
confirms the diagnosis took hold anyway: the same `4.6.2` force-reinstall (as `uv pip`) is the
repair command printed by the stt-faster repo's `scripts/check_gpu.py`, whose pin was bumped from
`4.4.0` on 2026-05-21 — the fix is baked in where the next failing machine will read it.
