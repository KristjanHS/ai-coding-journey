---
title: Signalling and cache persistence under act
topic: local-ci-with-act
type: tool-eval
summary: Two choices weighed for running a uv-based CI job locally with act — how to detect the act runner, and how to persist the uv download cache — on the model's reading of the act docs plus one reproduced failure.
---

# Signalling and cache persistence under act

What was compared, on how a composite action should know it is running locally
under act: the `github.actor != 'nektos/act'` guard against the `env.ACT`
variable act sets. The actor string lost — it can be overridden with `--actor`
and is implied by the event payload, so a step meant to be skipped locally still
ran. `env.ACT` is the documented, reliable signal for a step-level condition.

The second comparison was how to keep uv's download cache between local runs: a
`--bind` mount of the working directory against the standard actions/cache path
persisted by act's own cache server. `--bind` only mounts the workspace, not an
arbitrary cache directory, so it is the wrong tool; the durable path is setup-uv
with caching enabled plus a stable `--cache-server-path` in .actrc.

Both rulings rest on the model's reading of the act manual and project docs, not
on a benchmark. The one measured fact in the thread was a failure: act resolves
and fetches every `uses:` action up front, even one a later `if:` will skip, so a
conditional upload-artifact step made act re-clone an action already on disk and
bail with a "repository already exists" error. The fix was
`--action-offline-mode`.

## What didn't work

The `github.actor` check as an "am I under act" signal. It reads like a stable
flag and is not one, so the branch meant only for hosted runners fired locally;
moving the condition to `env.ACT` is what made the local and hosted runs diverge
where they were supposed to.
