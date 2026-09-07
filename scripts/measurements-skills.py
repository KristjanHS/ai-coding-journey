#!/usr/bin/env python3
"""Fill the Claude Code era's `skills` block in sources/measurements/eras-full.json.

Usage: python3 scripts/measurements-skills.py [SKILLS_DIR]
       (default: ~/projects/dotfiles/skills)

READ-ONLY GUARD. This script never writes to, deletes from, or even opens
`~/projects/claude_skills/` (a marketplace shell wired into settings.json and a
devcontainer mount) or `~/.claude/plugins/cache/` (the live skill source). It runs two
read-only `git` queries plus a `find` against the versioned skills dir, and writes only
this repo's eras.json.

The measurement is GIT, not diffing (decision D6). Two figures carry the whole claim:
the live `SKILL.md` count, and the number of commits touching `skills/` — the latter IS
the "heavily modified over time" evidence, so no similarity heuristic is computed and
the unchanged/modified/original bucket split is deliberately not built.

The commit count is a FLOOR, for the same reason the Cursor token figure is: skills
authored before the dir entered version control contribute zero commits for their whole
pre-git life. `detect-ai-text-cl-op` is the worked example — a Downloads snapshot dates
it to 2026-06-18, yet it has exactly one commit, from 2026-08-20. Dates here are
adoption-into-version-control, never authoring.

Only skill NAMES and COUNTS are emitted; no skill body text reaches eras.json.

Deterministic: sorted keys, no timestamps of its own.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ERAS = ROOT / "sources" / "measurements" / "eras-full.json"
DEFAULT_SKILLS = Path.home() / "projects" / "dotfiles" / "skills"
ERA_ID = "claude-code"
# The original-bucket worked example: no `superpowers/` upstream ancestor, invented as a
# detector and later grown a humanization mode.
EXAMPLE = "detect-ai-text-cl-op"


def git(repo: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", str(repo), *args],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()


def measure(skills: Path) -> dict:
    repo = skills.parent
    rel = skills.name
    # Scoped to the skills dir on BOTH halves: counting SKILL.md repo-wide, or counting
    # every commit rather than those touching `skills/`, is the mutation the red demo
    # uses — each inflates a pinned figure.
    live = len(list(skills.glob("*/SKILL.md")))
    commits = int(git(repo, "rev-list", "--count", "HEAD", "--", rel))
    dates = git(repo, "log", "--format=%ad", "--date=short", "--", rel).splitlines()
    example_commits = int(
        git(repo, "rev-list", "--count", "HEAD", "--", f"{rel}/{EXAMPLE}")
    )
    example_dates = git(
        repo, "log", "--format=%ad", "--date=short", "--", f"{rel}/{EXAMPLE}"
    ).splitlines()
    return {
        "liveSkillFiles": live,
        "commits": commits,
        "commitsAreFloor": True,
        "datesAre": "adopted-into-vc",
        "vcStart": dates[-1] if dates else None,
        "vcEnd": dates[0] if dates else None,
        "example": {
            "name": EXAMPLE,
            "bucket": "original",
            "commits": example_commits,
            "firstCommit": example_dates[-1] if example_dates else None,
            "snapshotDate": "2026-06-18",
        },
        "caveat": (
            "Dates are adoption-into-version-control, not authoring. The commit count "
            "covers the git era only and undercounts pre-git iteration — it is a floor."
        ),
    }


def main() -> int:
    skills = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_SKILLS
    if not skills.is_dir():
        print(f"error: {skills} is not a directory", file=sys.stderr)
        return 1
    if not ERAS.exists():
        print(
            "error: eras.json missing — run scripts/measurements-git.py first",
            file=sys.stderr,
        )
        return 1

    measured = measure(skills)

    document = json.loads(ERAS.read_text())
    for era in document["eras"]:
        if era["id"] != ERA_ID:
            continue
        era["skills"] = measured
        era["provenance"]["skills"] = (
            f"git log/rev-list over {skills.name}/ in the dotfiles repo (read-only); "
            "counts and names only, no skill bodies"
        )
        break
    else:
        print(f"error: no '{ERA_ID}' era in eras.json", file=sys.stderr)
        return 1

    ERAS.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n")
    print(
        f"skills: {measured['liveSkillFiles']} live SKILL.md, "
        f"{measured['commits']} commits (FLOOR) {measured['vcStart']}..{measured['vcEnd']}, "
        f"example {EXAMPLE} = {measured['example']['commits']} commit(s)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
