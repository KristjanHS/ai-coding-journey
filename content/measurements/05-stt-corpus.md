---
title: "stt-faster corpus — a generation count, not a benchmark"
summary: "The stt-faster experimentation corpus: stacked harness generations counted, schema sampled from one file, no benchmark claim."
---

# stt-faster experimentation corpus

The `05-stt-faster` repo accumulated a corpus of transcription experiments. It is
counted, not benchmarked — the distinction is the point.

- **23** `.bat` harness generations, in three stacked layers that were never
  deleted (root 8, `bat/` 8, `old_bat/` 7), plus 175 `.txt`, 120 `.aac` and
  38 `.json`.
- Measured how: count files by extension and by generation layer; read the
  corpus mtimes (2025-12-04 → 2026-09-01) and cross-check them against the
  repo's git span.

## Not a benchmark

The 38 `.json` were **not** bulk-read. Exactly **one** file was sampled for its
schema, and it is raw transcription output with no per-variant comparison. So the
corpus stays a generation count; it is not promoted to a benchmark it cannot
support.

## What was abandoned, and what was not

The `failed/` directory is **empty** — there is no failure log here, so no later
session should hunt for one. The "what didn't work" evidence is the superseded
generations instead: the `old_bat/` layer and the abandoned `_docker` and
`_32bit_cpu` runtime variants.

Sanitisation: only aggregate counts leave the corpus. The transcripts are personal
recordings; none is copied, quoted or summarised, and nothing derived from them
names a person.
