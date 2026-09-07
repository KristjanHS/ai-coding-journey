#!/usr/bin/env python3
"""Derive the era ladder's git spine into sources/measurements/eras-full.json.

Usage: python3 scripts/measurements-git.py [CONFIG_REPO]   (default ~/projects/kri-local-rag)

This is the cheapest number on the measurements page and the only one needing no log
parsing at all: ~/projects/kri-local-rag accumulated one AI-config dir per tool
generation and deleted none, so `git log -- <dir>` dates each generation from git alone.
Every log-derived range a later stage adds is cross-checked against the range here; a
disagreement is a finding the page shows, not a rounding error to smooth away.

The script owns ONLY the git-derived fields (gitStart/gitEnd/gitCommits) plus the era
list's shape. Later stages' generators fill logStart/logEnd/metrics into the same file,
so an existing eras.json is MERGED, never clobbered: rerunning this script leaves every
field it does not own exactly as it found it -- falling back to the value THIS spec
declares when the store has no previous entry, so a spec-authored `metrics` survives a
regeneration onto a fresh store instead of being wiped to `{}`.

One era (`chat`) has neither a config dir nor a tool log: ChatGPT's web app wrote nothing
to this machine. Its dates are therefore a BRACKET authored here rather than a range
derived from a record, and it carries `dateMethod: "estimated"` to say so. The other five
carry `dateMethod: "measured"` -- their spans come from git commits and session logs, and
nothing on the page may present the two kinds of date as the same claim.

Deterministic: no timestamps, sorted keys, so a rerun with unchanged git history
rewrites the file byte-identically.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "sources" / "measurements" / "eras-full.json"
DEFAULT_CONFIG_REPO = Path.home() / "projects" / "kri-local-rag"

SCHEMA = 1

# The eras, in the order the spec's era table lists them (chronological by onset).
# `group` is a VISUAL
# layer only (inc5a decision D5): the list stays one entry per tool and nothing
# downstream may collapse them into their groups -- the eras overlap heavily in time
# and hiding that overlap would be a false claim under the anti-hype rule.
#
# `configDir` is the dir in the config repo that dates the era. Copilot Chat never had
# one (it stores nothing in the project tree), so its git range stays null and is filled
# from its own logs in a later stage -- a genuinely absent range, not a zero. The chat
# era has neither, so its span comes from `dateLow`/`dateHigh` alone.
#
# `availability` is the per-metric matrix the page renders. Cost is a TYPED STATE, never
# a nullable number (decision D4): the four states are distinct findings and the page
# must not flatten them into one "unknown".
#   tokens: "yes" | "floor" | "none"
#   cost:   "derived" | "near-zero-local" | "unknown-server-side" | "absent"
#   counts: "yes"
#   skills: "yes" | "none"      -- a Claude-Code-era-only attribute; the emptiness of
#                                  every earlier era is part of the ladder story.
#
# `logsProvenance` seeds provenance.logs for an era no scanner covers. Every other era
# gets that field written by its own scripts/measurements-<tool>.py, which run after
# this one.
ERAS = [
    {
        "id": "chat",
        "tool": "ChatGPT (pre-agent)",
        "group": "chat",
        "configDir": None,
        "availability": {
            "tokens": "none",
            "cost": "absent",
            "counts": "yes",
            "skills": "none",
        },
        # No git range and no log: the bracket IS the record. Lower bound from the
        # earliest thread citation, upper bound from export mtime -- see
        # docs/sources-chatgpt-conversations.md.
        "dateLow": "2025-06-14",
        "dateHigh": "2025-07-06",
        "dateMethod": "estimated",
        # The one publishable number of the era: the home machine's VRAM ceiling, a
        # hardware fact rather than a usage volume. Every count the corpus supports is
        # a usage volume and stays out (commit eb972ec).
        "metrics": {"vramCeilingGiB": 8},
        "logsProvenance": (
            "no local log of any kind — the web app kept nothing on this machine"
        ),
    },
    {
        "id": "copilot",
        "tool": "GitHub Copilot Chat",
        "group": "vscode-plugin",
        "configDir": None,
        "dateMethod": "measured",
        "availability": {
            "tokens": "none",
            "cost": "absent",
            "counts": "yes",
            "skills": "none",
        },
    },
    {
        "id": "continue",
        "tool": "Continue (VS Code)",
        "group": "vscode-plugin",
        "configDir": "Continue_AI_coder",
        "dateMethod": "measured",
        "availability": {
            "tokens": "yes",
            "cost": "near-zero-local",
            "counts": "yes",
            "skills": "none",
        },
    },
    {
        "id": "codex",
        "tool": "OpenAI Codex plugin",
        "group": "vscode-plugin",
        "configDir": ".codex",
        "dateMethod": "measured",
        "availability": {
            "tokens": "none",
            "cost": "unknown-server-side",
            "counts": "yes",
            "skills": "none",
        },
    },
    {
        "id": "cursor",
        "tool": "Cursor",
        "group": "cursor",
        "configDir": ".cursor",
        "dateMethod": "measured",
        "availability": {
            "tokens": "floor",
            "cost": "unknown-server-side",
            "counts": "yes",
            "skills": "none",
        },
    },
    {
        "id": "claude-code",
        "tool": "Claude Code",
        "group": "claude-code",
        "configDir": ".claude",
        "dateMethod": "measured",
        "availability": {
            "tokens": "yes",
            "cost": "derived",
            "counts": "yes",
            "skills": "yes",
        },
    },
]

# Fields this script does NOT own. When the store already exists, these are carried over
# from it verbatim so a `make measurements` rerun never wipes a later stage's work. On a
# FRESH store there is nothing to carry, and the fallback is this spec's own value before
# the empty default -- otherwise a regeneration from scratch would silently wipe the
# spec-authored `metrics` of an era no scanner ever fills (`chat`).
CARRIED = ("logStart", "logEnd", "metrics")
CARRIED_DEFAULT = {"metrics": {}}


def git_dates(repo: Path, config_dir: str) -> tuple[str | None, str | None, int]:
    """Return (first, last, commits) for the commits touching config_dir, as ISO dates."""
    proc = subprocess.run(
        [
            "git",
            "-C",
            str(repo),
            "log",
            "--format=%ad",
            "--date=short",
            "--",
            config_dir,
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    dates = [line for line in proc.stdout.splitlines() if line]
    if not dates:
        return None, None, 0
    return dates[-1], dates[0], len(dates)


def main() -> int:
    repo = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_CONFIG_REPO
    if not (repo / ".git").exists():
        print(f"error: {repo} is not a git repository", file=sys.stderr)
        return 1

    previous = {}
    if OUT.exists():
        for era in json.loads(OUT.read_text()).get("eras", []):
            previous[era.get("id")] = era

    eras = []
    for spec in ERAS:
        entry = dict(spec)
        if spec["configDir"] is None:
            entry["gitStart"], entry["gitEnd"], entry["gitCommits"] = None, None, None
        else:
            start, end, commits = git_dates(repo, spec["configDir"])
            if commits == 0:
                print(
                    f"error: no commits touch {spec['configDir']} in {repo} — "
                    "the config repo moved or the dir was renamed",
                    file=sys.stderr,
                )
                return 1
            entry["gitStart"], entry["gitEnd"], entry["gitCommits"] = (
                start,
                end,
                commits,
            )
        entry["provenance"] = {
            "git": None
            if spec["configDir"] is None
            else f"git log -- {spec['configDir']}",
            "configRepo": repo.name,
        }
        # An era no scanner covers would otherwise reach the page with no `logs`
        # provenance at all, rendering as a blank rather than as a stated absence.
        logs = entry.pop("logsProvenance", None)
        if logs is not None:
            entry["provenance"]["logs"] = logs
        old = previous.get(spec["id"], {})
        for field in CARRIED:
            default = CARRIED_DEFAULT.get(field)
            entry[field] = old.get(field, entry.get(field, default))
        eras.append(entry)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"schema": SCHEMA, "eras": eras}, indent=2, sort_keys=True) + "\n"
    )
    print(f"wrote {OUT.relative_to(ROOT)} — {len(eras)} eras")
    return 0


if __name__ == "__main__":
    sys.exit(main())
