#!/usr/bin/env python3
"""Regenerate content/measurements/data/instruction-history.json from the repos' git histories.

Usage: python3 scripts/instruction-history.py [PROJECTS_DIR]   (default ~/projects)

Reads every repo in scripts/repos.json to its live HEAD, so a regen moves the figures whenever an
active repo gains commits; the mirror pins in tests/measurements-instruction-history.test.ts then
red until 06-instruction-history.md and the atoms quoting it carry the new values. Deterministic
for fixed histories. A listed repo missing from disk is skipped with a warning. Never hand-edit
the output; no private file content, path or SHA enters it -- dates, counts and repo names only.
"""

from __future__ import annotations

import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "content" / "measurements" / "data" / "instruction-history.json"
REPOS_CONFIG = ROOT / "scripts" / "repos.json"

# One pathspec per class of agent-instruction file. `:(glob)**/` also matches the repo
# root, so each spec covers root-level and nested copies (llm-eng-template's cookiecutter).
CLASSES = [
    (".gemini/", ":(glob)**/.gemini/**"),
    (".cursorrules", ":(glob)**/.cursorrules"),
    (".cursor/rules/", ":(glob)**/.cursor/rules/**"),
    ("gemini.md", ":(icase,glob)**/gemini.md"),
    ("AGENTS.md", ":(glob)**/AGENTS.md"),
    ("copilot-instructions.md", ":(glob)**/.github/copilot-instructions.md"),
    ("CLAUDE.md", ":(glob)**/CLAUDE.md"),
    (".claude/rules/", ":(glob)**/.claude/rules/**"),
    (".claude/skills/", ":(glob)**/.claude/skills/**"),
    (".claude/agents/", ":(glob)**/.claude/agents/**"),
    (".claude/commands/", ":(glob)**/.claude/commands/**"),
    (".claude/hooks/", ":(glob)**/.claude/hooks/**"),
    (".claude/settings*.json", ":(glob)**/.claude/settings*.json"),
]
ALL_SPECS = [spec for _, spec in CLASSES]

# The global instruction file every session loads: repo + path live here only, so the
# public JSON carries the repo name and the dated line counts, never the private path.
GLOBAL_REPO = "dotfiles"
GLOBAL_PATH = "claude/.claude/CLAUDE.md"

# A fleet sweep is one calendar day on which instruction files changed in at least this
# many repos -- a third of the 15-repo allowlist, so ordinary same-day work in two or
# three active repos never reads as one policy pushed across the fleet.
FLEET_MIN_REPOS = 5


def git(repo: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", str(repo), *args], check=True, capture_output=True, text=True
    ).stdout


def dates(repo: Path, *specs: str) -> list[str]:
    """Author dates (YYYY-MM-DD), oldest first, of commits touching any of `specs`."""
    return git(repo, "log", "--reverse", "--format=%as", "--", *specs).split()


def repos(projects: Path) -> dict[str, Path]:
    found = {}
    for name in sorted(json.loads(REPOS_CONFIG.read_text())["repos"]):
        path = projects / name
        if (path / ".git").exists():
            found[name] = path
        else:
            print(
                f"warning: {name} not found under {projects}, skipped", file=sys.stderr
            )
    return found


def first_appearances(found: dict[str, Path]) -> list[dict]:
    rows = []
    for label, spec in CLASSES:
        firsts = {
            name: d[0] for name, path in found.items() if (d := dates(path, spec))
        }
        if not firsts:
            continue
        repo = min(firsts, key=lambda name: (firsts[name], name))
        rows.append(
            {"class": label, "first": firsts[repo], "repo": repo, "repos": len(firsts)}
        )
    return sorted(rows, key=lambda r: (r["first"], r["class"]))


def global_series(found: dict[str, Path]) -> list[dict]:
    """Line count of the global CLAUDE.md at the last commit of each day that touched it."""
    if GLOBAL_REPO not in found:
        sys.exit(f"error: {GLOBAL_REPO} is required for the global CLAUDE.md series")
    repo = found[GLOBAL_REPO]
    log = git(
        repo, "log", "--follow", "--name-only", "--format=%as %H", "--", GLOBAL_PATH
    )
    by_day: dict[str, int] = {}
    entries = [line for line in log.splitlines() if line]
    for header, path in zip(entries[::2], entries[1::2]):
        day, sha = header.split()
        if day in by_day:  # newest first: the first commit seen per day is its last
            continue
        shown = subprocess.run(
            ["git", "-C", str(repo), "show", f"{sha}:{path}"],
            capture_output=True,
            text=True,
        )
        if shown.returncode == 0:  # a deleting commit has no blob to count
            by_day[day] = shown.stdout.count("\n")
    return [{"date": day, "lines": by_day[day]} for day in sorted(by_day)]


def fleet_sweeps(found: dict[str, Path]) -> list[dict]:
    per_day = Counter(
        day for path in found.values() for day in set(dates(path, *ALL_SPECS))
    )
    return [
        {"date": day, "repos": n}
        for day, n in sorted(per_day.items())
        if n >= FLEET_MIN_REPOS
    ]


def main() -> int:
    projects = (
        Path(sys.argv[1]).expanduser()
        if len(sys.argv) > 1
        else Path.home() / "projects"
    )
    found = repos(projects)
    document = {
        "note": "Generated by scripts/instruction-history.py from the scripts/repos.json "
        "histories at live HEAD -- never hand-edit.",
        "repos": len(found),
        "classes": first_appearances(found),
        "globalClaudeMd": {"repo": GLOBAL_REPO, "series": global_series(found)},
        "fleetSweeps": {"minRepos": FLEET_MIN_REPOS, "days": fleet_sweeps(found)},
    }
    OUT.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
