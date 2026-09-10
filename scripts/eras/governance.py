"""Fill the Claude Code era's `governance` block in sources/measurements/eras-full.json.

Usage: python3 scripts/measurements.py governance [CLAUDE_DIR]
       (default: ~/.claude)

Two figures, both COUNTS of live files on this workstation, feeding the two context
dimensions that no other generator reaches: `20 · cross-session memory` and
`23 · compaction handling`.

READ-ONLY. Parses `settings.json` and globs `projects/*/memory/`; writes only this
repo's eras.json.

`hookCommands` counts hook COMMANDS wired in settings.json — not the matcher groups
that carry them, and not the scripts sitting in `hooks/`. The three disagree: 10
groups hold 12 commands, while `hooks/` holds 11 executables plus a README. Only the
wired count answers "how many gates does a session actually run", so it is the one
that crosses.

`memoryFiles` counts `.md` under `projects/*/memory/`, and `memoryProjects` the dirs
holding at least one. A project dir with an empty memory dir contributes to neither.

NAMES NEVER CROSS. No project slug, no memory-file name and no hook command string
reaches eras.json — the same rule measurements-skills.py applies to skill bodies.
These are per-workstation counts with no history: hooks and memory dirs did not exist
before the Claude Code era, so the block is a snapshot, not a series.

Deterministic: sorted keys, no timestamps of its own.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import measlib

DEFAULT_CLAUDE = Path.home() / ".claude"
ERA_ID = "claude-code"


def scan(claude: Path) -> dict:
    settings = json.loads((claude / "settings.json").read_text())
    hooks = settings.get("hooks", {})
    # Three counts that disagree; the docblock says why only the first crosses.
    commands = sum(
        len(group.get("hooks", [])) for groups in hooks.values() for group in groups
    )
    memory_dirs = sorted(claude.glob("projects/*/memory"))
    per_dir = [len(list(d.glob("*.md"))) for d in memory_dirs]
    return {
        "hookEvents": len(hooks),
        "hookCommands": commands,
        "memoryFiles": sum(per_dir),
        "memoryProjects": sum(1 for n in per_dir if n),
        "caveat": (
            "Counts of live files on one workstation, not a series: neither hooks nor "
            "memory dirs existed before this era. `hookCommands` counts wired commands, "
            "not matcher groups and not scripts on disk."
        ),
    }


def measure(argv: list[str]) -> int:
    claude = Path(argv[0]).expanduser() if argv else DEFAULT_CLAUDE
    if not (claude / "settings.json").is_file():
        print(f"error: {claude}/settings.json not found", file=sys.stderr)
        return 1
    document = measlib.load_store()
    if document is None:
        return 1

    measured = scan(claude)

    era = measlib.find_era(document, ERA_ID)
    if era is None:
        return 1
    era["governance"] = measured
    era["provenance"]["governance"] = (
        "settings.json hook table plus a glob of projects/*/memory/ under the "
        "Claude Code config dir (read-only); counts only, no names"
    )

    measlib.write_store(document)
    print(
        f"governance: {measured['hookCommands']} hook commands across "
        f"{measured['hookEvents']} events, {measured['memoryFiles']} memory files "
        f"across {measured['memoryProjects']} projects"
    )
    return 0
