#!/usr/bin/env python3
"""Fill the stt-faster experimentation corpus block in sources/measurements/eras-full.json.

Usage: python3 scripts/measurements-stt.py [CORPUS_DIR]
       (default: /mnt/c/Users/PC/Downloads/transcribe)

SANITISATION GUARD — the most sensitive source in the increment. The `.aac` inputs and
`.txt`/`.json` transcripts are personal Teams and desk recordings. Nothing from them is
copied, quoted, excerpted or summarised: this script reads FILE NAMES only to bucket
extensions, and emits AGGREGATE COUNTS only. No filename, no transcript text and nothing
naming a person may reach an emitted field; tests/measurements.test.ts asserts that.

SCHEMA PROBE (decision D7) — one `.json` was read, not all 38. It is raw faster-whisper
transcription output: `segments[]` of `{start, end, text, no_speech_prob, avg_logprob}`
plus `duration`, a two-field `metrics` block and `transcribe_kwargs`. It carries NO
per-variant timing or accuracy comparison, so the corpus is a VARIANT/GENERATION COUNT,
not a benchmark, and the `05-stt-faster` chapter gets no benchmark artifact from it.
`schemaSampledFrom` records that this rests on one sampled file.

The measured-waste evidence here is NOT a failure log — `failed/` is empty, stated
explicitly so a later session does not go hunting. What did not work is visible as
SUPERSEDED GENERATIONS: `old_bat/`, `OLD_compare_variants.bat`, and the abandoned
`_docker` / `_32bit_cpu` runtime variants.

Deterministic: sorted keys, no timestamps of its own.
"""

from __future__ import annotations

import datetime as dt
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ERAS = ROOT / "sources" / "measurements" / "eras-full.json"
DEFAULT_CORPUS = Path("/mnt/c/Users/PC/Downloads/transcribe")
REPO = Path.home() / "projects" / "stt-faster"
ERA_ID = "claude-code"


def git(repo: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", str(repo), *args], check=True, capture_output=True, text=True
    ).stdout.strip()


def measure(corpus: Path) -> dict:
    # Three generations of the same batch harness, accumulated and never deleted — the
    # stacked-iteration pattern the kri-local-rag config dirs show. The split is the
    # measurement: collapsing the three into one total loses the iteration story.
    generations = {
        "root": len(list(corpus.glob("*.bat"))),
        "bat": len(list((corpus / "bat").glob("*.bat"))),
        "old_bat": len(list((corpus / "old_bat").glob("*.bat"))),
    }
    files = {ext: len(list(corpus.rglob(f"*.{ext}"))) for ext in ("txt", "aac", "json")}
    stamps = sorted(
        dt.datetime.fromtimestamp(p.stat().st_mtime).strftime("%Y-%m-%d")
        for p in corpus.rglob("*")
        if p.is_file()
    )
    failed = corpus / "failed"
    return {
        "batGenerations": generations,
        "batTotal": sum(generations.values()),
        "files": files,
        "mtimeStart": stamps[0] if stamps else None,
        "mtimeEnd": stamps[-1] if stamps else None,
        "failedDirEmpty": failed.is_dir() and not any(failed.iterdir()),
        "supersededGenerations": ["old_bat", "OLD_compare_variants.bat"],
        "abandonedRuntimeVariants": ["_docker", "_32bit_cpu"],
        "isBenchmark": False,
        "schemaSampledFrom": 1,
        "schemaFinding": (
            "Raw faster-whisper output (segments, duration, a two-field metrics block); "
            "no per-variant timing or accuracy, so this is a generation count, not a "
            "benchmark."
        ),
    }


def main() -> int:
    corpus = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_CORPUS
    if not corpus.is_dir():
        print(f"error: {corpus} is not a directory", file=sys.stderr)
        return 1
    if not ERAS.exists():
        print(
            "error: eras.json missing — run scripts/measurements-git.py first",
            file=sys.stderr,
        )
        return 1

    measured = measure(corpus)
    # Cross-check, per the kri-local-rag precedent: a disagreement between the corpus
    # mtime span and the repo's own commit span is a finding the page shows, never a
    # gate that must reconcile to zero.
    dates = git(REPO, "log", "--format=%ad", "--date=short").splitlines()
    measured["repo"] = {
        "commits": int(git(REPO, "rev-list", "--count", "HEAD")),
        "gitStart": dates[-1],
        "gitEnd": dates[0],
    }

    document = json.loads(ERAS.read_text())
    document["sttFaster"] = measured
    ERAS.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n")
    g = measured["batGenerations"]
    print(
        f"stt-faster: {measured['batTotal']} .bat "
        f"({g['root']} root / {g['bat']} bat / {g['old_bat']} old_bat), "
        f"{measured['files']['txt']} txt / {measured['files']['aac']} aac / "
        f"{measured['files']['json']} json, failed/ empty={measured['failedDirEmpty']}, "
        f"corpus {measured['mtimeStart']}..{measured['mtimeEnd']} vs repo "
        f"{measured['repo']['gitStart']}..{measured['repo']['gitEnd']}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
