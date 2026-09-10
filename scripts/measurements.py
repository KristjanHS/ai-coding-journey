#!/usr/bin/env python3
"""One CLI for the eight era metric-fillers.

Usage: python3 scripts/measurements.py <era> [era args]
       e.g.  python3 scripts/measurements.py cc --onset-only
             python3 scripts/measurements.py codex ~/.codex/sessions

Dispatches to scripts/eras/<era>.py, whose `measure(argv)` holds everything specific
to that era (sources, parsing, the fields it fills); the shared store plumbing lives
in scripts/measlib.py. Two measurement scripts stay standalone on purpose:
measurements-git.py CREATES the era-list shape the fillers merge into, and
measurements-public.py is the redaction boundary with its own audit() — neither is a
filler and neither imports measlib.

`eras.continue` is a keyword-named module, which is why dispatch goes through
importlib rather than an import table.
"""

from __future__ import annotations

import importlib
import sys

ERA_MODULES = (
    "cc",
    "codex",
    "continue",
    "copilot",
    "cursor",
    "governance",
    "skills",
    "stt",
)


def main() -> int:
    if len(sys.argv) < 2 or sys.argv[1] not in ERA_MODULES:
        print(
            f"usage: measurements.py {{{'|'.join(ERA_MODULES)}}} [era args]",
            file=sys.stderr,
        )
        return 2
    module = importlib.import_module(f"eras.{sys.argv[1]}")
    return module.measure(sys.argv[2:])


if __name__ == "__main__":
    sys.exit(main())
