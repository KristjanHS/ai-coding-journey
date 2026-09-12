#!/usr/bin/env python3
"""Regenerate content/timeline.json, content/journey/README.md and missing chapter stubs from git.

Usage: python3 scripts/timeline-from-git.py [PROJECTS_DIR]   (default ~/projects)

Deterministic for a fixed set of repos: rerunning rewrites timeline.json and the index
byte-identically. Chapter stubs and 00-experiments.md are created only when absent, but
the four GENERATED frontmatter fields (start/end/commits/stage) are re-synced into every
existing chapter on each run, so a regen surfaces upstream commit drift as a reviewable
diff in the tree. Chapters that carry no `repo:` key (the reserved 90- band: chapters
that belong to no repo) are never opened -- main() enumerates repos, not chapter files --
but they are listed in the index so it is not silently incomplete. Author-owned frontmatter (title/tools/deck/artifact,
and any other key) and the chapter body are never touched.
`stage` is assigned mechanically by first-commit date (STAGE_SEAMS below);
hand-maintain scripts/repos.json and STAGE_OVERRIDES only, and never hand-edit the generated files.
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
REPOS_CONFIG = ROOT / "scripts" / "repos.json"
# Below this a repo is an experiment line, not a chapter. One source, shared with
# src/lib/timeline.ts: both read scripts/timeline-config.json, so neither carries a
# hand-copied mirror of the other.
MIN_COMMITS: int = json.loads((ROOT / "scripts" / "timeline-config.json").read_text())[
    "minCommits"
]


def is_chapter(row: dict) -> bool:
    """A repo earns a chapter when it cleared MIN_COMMITS AND lived past one day.

    The second half is the inc-era-labels ruling: a repo whose first and last
    commit fall on the same date is a spike, not a project -- nine commits in an
    afternoon buy a line in 00-experiments.md, never a chapter and never a bar on
    the chart. `src/lib/timeline.ts` carries the same predicate for the site;
    `tests/timeline-lib.test.ts` pins the two readings equal against the JSON.
    """
    return row["commits"] >= MIN_COMMITS and row["last_commit"] > row["first_commit"]


# Which repos are scanned is an explicit ALLOWLIST in scripts/repos.json, never a
# directory scan: a scan made content/timeline.json a function of whatever else sat
# under ~/projects, so an unrelated repo's commits staled it. Admission rule for that
# file -- the author's OWN builds only. Out: tooling dirs, learning/course repos (work
# done while learning someone else's material -- 01-claude-code-pm-course has 121
# commits, many the author's, and is still out on that ground), other people's repos,
# this repo, and git worktrees. A listed repo missing from disk is skipped with a
# warning, so the generator still runs on a machine holding a subset.
def allowlist() -> list[str]:
    return sorted(json.loads(REPOS_CONFIG.read_text())["repos"])


# Paths that do not count as real work when dating a repo's last activity.
# A `chore(claude):` deny-list sweep landed across the projects dir on 2026-09-06
# touching only AI-config: it made 13 repos claim activity on that day where 2 had
# any. Each entry needs BOTH the root-anchored and the `**/`-prefixed form --
# `.claude/**` alone misses llm-eng-template's nested cookiecutter `.claude/`, and
# `**/.claude/**` alone misses every root-level one.
AI_CONFIG_PATHS = [
    ":(exclude).claude/**",
    ":(exclude)**/.claude/**",
    ":(exclude).claudeignore",
    ":(exclude)**/.claudeignore",
    ":(exclude).gitignore",
    ":(exclude)**/.gitignore",
]

# Several git repos that are ONE project on the journey. The group name becomes the
# row's `repo` key and its chapter slug; it is not a directory under ~/projects.
# dewpoint: the Python original (dewpoint-app) plus the later Node port made to
# deploy on Vercel (dewpoint-ts).
REPO_GROUPS = {
    "dewpoint": ["dewpoint-app", "dewpoint-ts"],
    # The 08 repo's directory was renamed; the public row key is the chapter slug.
    "fte-budget-planner": ["budget-planner"],
}

# The six-rung ladder (design §7), assigned MECHANICALLY by a repo's first-commit
# date against ruled seams -- not a hand-maintained table. This is the `stage` the
# repo OPENED on. `stage_peak` (the highest rung it reached) is author-owned
# per-chapter frontmatter and is NOT generated here: it defaults to `stage` and is
# raised only with a git-dated in-repo artifact, so it is never re-synced by this
# script (it is absent from GENERATED_KEYS below).
#
# Ladder, low to high: asking -> suggesting -> delegating -> planning ->
# configuring -> governing. Each SEAMS entry is the FIRST date NO LONGER in the
# rung to its left; a repo opens on the first rung whose seam its first commit
# precedes, else `governing`.
#   asking       -- before 2025-07-01
#   suggesting   -- 2025-07-01 .. 2025-08-31
#   delegating   -- 2025-09-01 .. 2026-02-27
#   planning     -- 2026-02-28 .. 2026-04-04
#   configuring  -- 2026-04-05 .. 2026-07-08
#   governing    -- 2026-07-09 onward
STAGE_SEAMS = [
    ("2025-07-01", "asking"),
    ("2025-09-01", "suggesting"),
    ("2026-02-28", "delegating"),
    ("2026-04-05", "planning"),
    ("2026-07-09", "configuring"),
]
STAGE_DEFAULT = "governing"

# design §8: token-monitor's first commit is 2026-04-04, one day inside the
# `planning` band, but it is ruled `configuring` -- the spend-measurement tool is
# the first artifact OF the configuring rung (you cannot govern a budget before you
# can see it), dated a day ahead of `dotfiles`, which came to hold it. This is a
# named ruling, encoded explicitly rather than by fudging the 4->5 seam date.
STAGE_OVERRIDES = {
    "token-monitor": "configuring",
}


def stage_for(repo: str, first_commit: str) -> str:
    """Rung a repo opened on, by first-commit date -- with §8's named overrides."""
    if repo in STAGE_OVERRIDES:
        return STAGE_OVERRIDES[repo]
    for seam, rung in STAGE_SEAMS:
        if first_commit < seam:  # ISO dates sort lexically
            return rung
    return STAGE_DEFAULT


def git(repo: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", str(repo), *args], check=True, capture_output=True, text=True
    ).stdout.strip()


def last_real_commit(d: Path, fallback: str) -> str:
    """Date of the newest commit touching anything outside AI_CONFIG_PATHS.

    Falls back to the raw last-commit date when the exclusion leaves no commits at
    all (no repo hits this today, but a config-only repo would).
    """
    out = git(d, "log", "-1", "--format=%as", "--", ".", *AI_CONFIG_PATHS)
    return out or fallback


def group_of(name: str) -> str:
    """The journey row a repo belongs to -- its group name, or itself."""
    for group, members in REPO_GROUPS.items():
        if name in members:
            return group
    return name


def merge(rows: list[dict]) -> list[dict]:
    """Collapse each REPO_GROUPS member set into one row keyed by the group name.

    Widest span across members, summed commits, stage keyed on the group. A member
    that is absent from disk is simply never in `rows`, which is not an error.
    """
    merged: dict[str, dict] = {}
    for r in rows:
        key = group_of(r["repo"])
        cur = merged.get(key)
        if cur is None:
            merged[key] = {**r, "repo": key, "stage": stage_for(key, r["first_commit"])}
            continue
        cur["first_commit"] = min(cur["first_commit"], r["first_commit"])
        cur["last_commit"] = max(cur["last_commit"], r["last_commit"])
        cur["commits"] += r["commits"]
        # A merged row opens on the rung of its EARLIEST member's first commit.
        cur["stage"] = stage_for(key, cur["first_commit"])
    return list(merged.values())


def scan(projects: Path) -> list[dict]:
    rows = []
    missing = []
    for name in allowlist():
        d = projects / name
        if not (d / ".git").is_dir():
            missing.append(name)
            continue
        try:
            dates = git(d, "log", "--reverse", "--format=%as").splitlines()
        except subprocess.CalledProcessError:  # repo with zero commits
            continue
        rows.append(
            {
                "repo": name,
                "first_commit": dates[0],
                "last_commit": last_real_commit(d, dates[-1]),
                "commits": int(git(d, "rev-list", "--count", "HEAD")),
                "stage": stage_for(name, dates[0]),
            }
        )
    if missing:
        print(
            f"skipped (not found under {projects}): " + ", ".join(missing),
            file=sys.stderr,
        )
    rows = merge(rows)
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
        (
            f"Repos with fewer than {MIN_COMMITS} commits, or whose whole life was a single day: "
            "one line each, no chapter.\n"
        ),
    ]
    for r in rows:
        span = (
            "one day"
            if r["last_commit"] == r["first_commit"]
            else f"{r['first_commit']} → {r['last_commit']}"
        )
        lines.append(
            f"- **{r['repo']}** · {r['first_commit']} · {r['commits']} commits · {span} · outcome: pending"
        )
    return "\n".join(lines) + "\n"


def no_repo_chapters() -> list[Path]:
    """Chapter files carrying no `repo:` frontmatter key, sorted by filename.

    main() enumerates repos and resolves each through chapter_file(), so a chapter
    that belongs to no repo is invisible to every other part of this script -- and
    would be silently missing from the generated index. 00-experiments.md is the
    sub-5-commit round-up: it carries no frontmatter at all and already has its own
    rows, so it is excluded by name rather than by the no-repo test.
    """
    out = []
    for path in sorted(JOURNEY.glob("[0-9][0-9]-*.md")):
        if path.name == EXPERIMENTS.name:
            continue
        m = re.match(r"---\n(.*?\n)---\n", path.read_text(), re.S)
        if m and not re.search(r"^repo: *\S", m.group(1), re.M):
            out.append(path)
    return out


def index(chapters: list[tuple[int, dict]], small: list[dict]) -> str:
    out = [
        "# Journey index\n",
        "Generated by `scripts/timeline-from-git.py` from `content/timeline.json`. Do not hand-edit.\n",
        "| # | repo | start | end | commits | stage | chapter |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for n, r in chapters:
        f = chapter_file(n, r["repo"]).name
        # The number comes off the FILE when one exists, never off the position:
        # demoting a repo mid-spine (inc-era-labels dropped 06 and 09) would
        # otherwise renumber every chapter after it and break every inbound link.
        n = int(f[:2])
        out.append(
            f"| {n:02d} | {r['repo']} | {r['first_commit']} | {r['last_commit']} | "
            f"{r['commits']} | {r['stage']} | [{f}]({f}) |"
        )
    for r in small:
        out.append(
            f"| 00 | {r['repo']} | {r['first_commit']} | {r['last_commit']} | "
            f"{r['commits']} | {r['stage']} | [00-experiments.md](00-experiments.md) |"
        )
    # Non-repo chapters last: the numbered repo rows and the 00 experiment rows both
    # come from git, these come from the tree. Every git-derived column renders as an
    # em dash -- there is no repo to derive it from.
    for path in no_repo_chapters():
        out.append(
            f"| {path.name[:2]} | — | — | — | — | — | [{path.name}]({path.name}) |"
        )
    return "\n".join(out) + "\n"


def main() -> int:
    projects = Path(sys.argv[1] if len(sys.argv) > 1 else "~/projects").expanduser()
    rows = scan(projects)
    JOURNEY.mkdir(parents=True, exist_ok=True)
    TIMELINE.write_text(json.dumps(rows, indent=2) + "\n")

    big = [r for r in rows if is_chapter(r)]
    small = [r for r in rows if not is_chapter(r)]
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
