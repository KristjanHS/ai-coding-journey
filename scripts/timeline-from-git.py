#!/usr/bin/env python3
"""Regenerate content/timeline.json, content/journey/README.md and missing chapter stubs from git.

Usage: python3 scripts/timeline-from-git.py [PROJECTS_DIR]   (default ~/projects)

Deterministic for a fixed set of repos: rerunning rewrites timeline.json and the index
byte-identically. Chapter stubs and 00-experiments.md are created only when absent, but
the four GENERATED frontmatter fields (start/end/commits/stage) are re-synced into every
existing chapter on each run -- so upstream commit drift shows up as a diff in `make
check` instead of rotting silently. Author-owned frontmatter (title/tools/deck/artifact,
and any other key) and the chapter body are never touched.
Hand-maintain STAGE and EXCLUDE below; never hand-edit the generated files.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
JOURNEY = CONTENT / "journey"
TIMELINE = CONTENT / "timeline.json"
INDEX = JOURNEY / "README.md"
EXPERIMENTS = JOURNEY / "00-experiments.md"
MIN_COMMITS = 5  # below this a repo is an experiment line, not a chapter

# Repos never scanned: tooling dirs, learning/course repos (work done while learning
# someone else's material, not the author's own build -- 01-claude-code-pm-course has
# 121 commits, many the author's, and is still excluded on that ground), other people's
# repos, this repo, and git worktrees (any name ending in -wt).
EXCLUDE = {
    "ai-coding-journey",
    "bin",
    "mybrain",
    "claude_skills",
    "arxiv-paper-curator",
    "01-claude-code-pm-course",
    "03-learn-claude-code",
    "09-learn-claude-code",
    "cookie-test1",
    "cafe-cursor-lab-materials",
    "Locked-Shields-PR-BT06-2026",
    "ls-sitrep",
    "autoresearch-ks",
    "Closaria",
    "Closaria-FE",
}

# Hand-maintained stage per repo. Unknown repos get "unassigned".
STAGE = {
    "hands-on-llm": "chat",
    "dewpoint-app": "chat",
    "dewpoint-ts": "chat",
    "docs-generator": "chat",
    "llm-eng-template": "chat",
    "kri-local-rag": "local-llm",
    "stt-faster": "local-llm",
    "xls-analyser": "first-agent",
    "gitlab-standup": "first-agent",
    "proj-mgmt": "first-agent",
    "token-monitor": "config-engineering",
    "dotfiles": "config-engineering",
    "claudeconf": "config-engineering",
    "edf-budget-planner": "production-app",
    "crash-dash": "production-app",
}


def git(repo: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", str(repo), *args], check=True, capture_output=True, text=True
    ).stdout.strip()


def scan(projects: Path) -> list[dict]:
    rows = []
    for d in sorted(projects.iterdir()):
        name = d.name
        if name in EXCLUDE or name.endswith("-wt") or not (d / ".git").is_dir():
            continue
        try:
            dates = git(d, "log", "--reverse", "--format=%as").splitlines()
        except subprocess.CalledProcessError:  # repo with zero commits
            continue
        rows.append(
            {
                "repo": name,
                "first_commit": dates[0],
                "last_commit": dates[-1],
                "commits": int(git(d, "rev-list", "--count", "HEAD")),
                "stage": STAGE.get(name, "unassigned"),
            }
        )
    rows.sort(key=lambda r: (r["first_commit"], r["repo"]))
    return rows


def chapter_file(number: int, repo: str) -> Path:
    """Existing stub for this repo wins (whatever its number); else the positional name."""
    existing = sorted(JOURNEY.glob(f"[0-9][0-9]-{repo}.md"))
    return existing[0] if existing else JOURNEY / f"{number:02d}-{repo}.md"


def stub(number: int, r: dict) -> str:
    return (
        "---\n"
        f"title: {r['repo']}\n"
        f"repo: {r['repo']}\n"
        f"start: {r['first_commit']}\n"
        f"end: {r['last_commit']}\n"
        f"commits: {r['commits']}\n"
        f"stage: {r['stage']}\n"
        "tools: []\n"
        "deck: false\n"
        "artifact: pending\n"
        "---\n\n"
        f"# {number:02d} · {r['repo']}\n\n"
        "## What I was trying to do\n\n"
        "## What didn't work\n\n"
        "## What I learned\n\n"
        "## Artifact\n"
    )


# The four frontmatter keys derived from git. Everything else in a chapter's
# frontmatter is author-owned and must survive a resync untouched.
GENERATED_KEYS = ("start", "end", "commits", "stage")


def sync_frontmatter(path: Path, r: dict) -> bool:
    """Rewrite the generated frontmatter keys of an existing chapter in place.

    Returns True if the file changed. Only the four GENERATED_KEYS are rewritten,
    and only keys already present -- a chapter with hand-removed keys is reported
    by the caller rather than silently re-grown.
    """
    text = path.read_text()
    m = re.match(r"---\n(.*?\n)---\n", text, re.S)
    if not m:
        return False
    want = {
        "start": r["first_commit"],
        "end": r["last_commit"],
        "commits": str(r["commits"]),
        "stage": r["stage"],
    }
    block = m.group(1)
    for key, value in want.items():
        block, n = re.subn(
            rf"^{key}: *.*$", f"{key}: {value}", block, count=1, flags=re.M
        )
        if n == 0:
            print(
                f"  WARNING: {path.name} has no '{key}:' frontmatter key",
                file=sys.stderr,
            )
    new = text[: m.start(1)] + block + text[m.end(1) :]
    if new == text:
        return False
    path.write_text(new)
    return True


def experiments(rows: list[dict]) -> str:
    lines = [
        "# 00 · Experiments\n",
        f"Repos with fewer than {MIN_COMMITS} commits: one line each, no chapter.\n",
    ]
    for r in rows:
        lines.append(
            f"- **{r['repo']}** · {r['first_commit']} · {r['commits']} commits · outcome: pending"
        )
    return "\n".join(lines) + "\n"


def index(chapters: list[tuple[int, dict]], small: list[dict]) -> str:
    out = [
        "# Journey index\n",
        "Generated by `scripts/timeline-from-git.py` from `content/timeline.json`. Do not hand-edit.\n",
        "| # | repo | start | end | commits | stage | chapter |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for n, r in chapters:
        f = chapter_file(n, r["repo"]).name
        out.append(
            f"| {n:02d} | {r['repo']} | {r['first_commit']} | {r['last_commit']} | "
            f"{r['commits']} | {r['stage']} | [{f}]({f}) |"
        )
    for r in small:
        out.append(
            f"| 00 | {r['repo']} | {r['first_commit']} | {r['last_commit']} | "
            f"{r['commits']} | {r['stage']} | [00-experiments.md](00-experiments.md) |"
        )
    return "\n".join(out) + "\n"


def main() -> int:
    projects = Path(sys.argv[1] if len(sys.argv) > 1 else "~/projects").expanduser()
    rows = scan(projects)
    JOURNEY.mkdir(parents=True, exist_ok=True)
    TIMELINE.write_text(json.dumps(rows, indent=2) + "\n")

    big = [r for r in rows if r["commits"] >= MIN_COMMITS]
    small = [r for r in rows if r["commits"] < MIN_COMMITS]
    chapters = list(enumerate(big, start=1))

    created = []
    synced = []
    for n, r in chapters:
        p = chapter_file(n, r["repo"])
        if not p.exists():
            p.write_text(stub(n, r))
            created.append(p.name)
        elif sync_frontmatter(p, r):
            synced.append(p.name)
    if small and not EXPERIMENTS.exists():
        EXPERIMENTS.write_text(experiments(small))
        created.append(EXPERIMENTS.name)
    INDEX.write_text(index(chapters, small))

    print(
        f"{len(rows)} repos → {TIMELINE.relative_to(ROOT)}, {INDEX.relative_to(ROOT)}"
    )
    if created:
        print("created: " + ", ".join(created))
    if synced:
        print("frontmatter resynced: " + ", ".join(synced))
    return 0


if __name__ == "__main__":
    sys.exit(main())
