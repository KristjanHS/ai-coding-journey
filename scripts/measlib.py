"""Shared store plumbing for the era metric-fillers under scripts/eras/.

The eight fillers used to duplicate this file's whole job: locate
sources/measurements/eras-full.json, refuse to run before measurements-git.py has
created the era-list shape, find their era by id, and write the store back
deterministically. A store-format change now lands here (plus measurements-git.py,
which creates the shape and deliberately does not import this module — nor does
measurements-public.py, the redaction boundary).

Merge-don't-clobber: fillers mutate fields of the era dict `find_era` returns (or a
top-level key) and re-serialise the WHOLE document — no filler ever replaces an era
wholesale, so every other generator's fields survive each run.

Deterministic write: sorted keys, two-space indent, trailing newline, no timestamps.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ERAS = ROOT / "sources" / "measurements" / "eras-full.json"


def load_store() -> dict | None:
    """Parse the full store; None (after the canonical error) if git.py has not run."""
    if not ERAS.exists():
        print(
            "error: eras.json missing — run scripts/measurements-git.py first",
            file=sys.stderr,
        )
        return None
    return json.loads(ERAS.read_text())


def find_era(document: dict, era_id: str) -> dict | None:
    """The era dict for `era_id`, or None (after the canonical error)."""
    for era in document["eras"]:
        if era["id"] == era_id:
            return era
    print(f"error: no '{era_id}' era in eras.json", file=sys.stderr)
    return None


def write_store(document: dict) -> None:
    """Serialise the whole document back — sorted keys, indent 2, trailing newline."""
    ERAS.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n")
