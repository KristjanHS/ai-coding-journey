"""Fill the Claude Code era in sources/measurements/eras-full.json from its own logs.

Usage: python3 scripts/measurements.py cc [PROJECTS_ROOT]   (default ~/.claude/projects)
       python3 scripts/measurements.py cc --onset-only       (era-start dates, no rescan)

`--onset-only` refreshes just the `onset` block. It exists because the transcript scan
and the onset dates age at different rates: the scan's totals move every session (and
DROP as Claude Code prunes old transcripts), while the onset dates are fixed history.
Re-running the full scan to correct a start date would drag an unrelated data refresh
into the same commit.

The richest of the five eras: token classes, money and session counts all derive from the
jsonl transcripts. stdlib only. Field paths follow ~/projects/token-monitor's parser by
hand -- that is a separate repo and is deliberately never imported.

Three shapes of file live under the root, and only two of them are transcripts:

    <project>/<session>.jsonl                    a MAIN session
    <project>/<session>/subagents/*.jsonl        that session's subagents
    <project>/snapshots/<stamp>/transcript.jsonl a COPY of a main session

Snapshots are byte copies taken by the snapshot skill; counting them would double-count
sessions that are already in the main set, so the walk takes main sessions from a
single-level glob that cannot reach them.

Decision D1 (inc5a): parent and subagent totals are emitted as DISTINCT fields, never
merged here -- the page prints both side by side and the JSON must be able to feed
either without a regeneration.

Decision D2 / cache classes: all four token classes stay separate in the JSON. The
headline is a view over them (input + cache_creation + output, with cache_read shown
beside it as reuse); no lossy sum is ever baked into the data.

Money is NOT derived here. `cost-state` records sit in these transcripts and price the
work exactly, but a per-account spend figure is personal material under the repo's
redaction policy, so the derivation lives in the private
dotfiles copy (`docs/private-sources/ai-coding-journey/measurements/measurements-cc-cost.py`)
and never in this tree. This script emits token classes and counts only.

Deterministic: sorted keys, no timestamps of its own.
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import measlib

DEFAULT_LOG_ROOT = Path.home() / ".claude" / "projects"
ERA_ID = "claude-code"

# Onset sources. The transcripts under DEFAULT_LOG_ROOT are pruned by Claude Code
# itself, so `logStart` is a floor on the era and cannot date its beginning. These two
# files survive that pruning and do: the config carries the first-token stamp, the
# prompt history carries the first prompt ever typed. Only dates are read out of them --
# never the account identifiers that sit in the same config.
CONFIG_JSON = Path.home() / ".claude.json"
HISTORY_JSONL = Path.home() / ".claude" / "history.jsonl"

# message.usage.* on `type == "assistant"` records. Kept as four separate classes all
# the way into the JSON (see the module docstring).
CLASSES = {
    "input": "input_tokens",
    "cacheCreation": "cache_creation_input_tokens",
    "cacheRead": "cache_read_input_tokens",
    "output": "output_tokens",
}


def empty_tokens() -> dict[str, int]:
    return {name: 0 for name in CLASSES}


class Totals:
    """Token + session accumulator for one side of the parent/subagent split."""

    def __init__(self) -> None:
        self.tokens = empty_tokens()
        self.per_model: dict[str, dict[str, int]] = defaultdict(empty_tokens)
        self.sessions: set[str] = set()
        self.files = 0

    def add_assistant(self, record: dict) -> None:
        message = record.get("message") or {}
        usage = message.get("usage") or {}
        model = message.get("model") or "unknown"
        for name, field in CLASSES.items():
            value = usage.get(field) or 0
            self.tokens[name] += value
            self.per_model[model][name] += value

    def as_json(self, session_field: str) -> dict:
        # `session_field` is named by the caller because the two sides count different
        # things: a main transcript's sessionId IS the session, while a subagent
        # transcript carries its PARENT's sessionId -- so the subagent side's distinct
        # count is the number of sessions that used subagents, not a subagent count.
        # The subagent count is `files`.
        return {
            session_field: len(self.sessions),
            "files": self.files,
            "tokens": dict(self.tokens),
            "perModel": {
                model: dict(counts) for model, counts in sorted(self.per_model.items())
            },
        }


def scan(
    paths: list[Path],
    totals: Totals,
    dates: list[str],
    *,
    sidechain: bool,
) -> None:
    """Accumulate one set of transcripts.

    `sidechain` says which side of the parent/subagent split these files are, and it is
    load-bearing: EVERY assistant record in a subagent transcript carries
    `isSidechain: true`, so a filter written to drop sidechain records everywhere zeroes
    the whole subagent side. Main transcripts keep the filter defensively -- a sidechain
    record there would be a subagent turn already counted in its own file -- while
    subagent transcripts require its inverse."""
    for path in paths:
        totals.files += 1
        session = path.stem
        with path.open(errors="replace") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if not isinstance(record, dict):
                    continue
                record_session = record.get("sessionId") or session
                kind = record.get("type")
                if kind == "assistant":
                    if bool(record.get("isSidechain")) != sidechain:
                        continue
                    totals.add_assistant(record)
                    totals.sessions.add(record_session)
                    stamp = record.get("timestamp")
                    if stamp:
                        dates.append(stamp[:10])


def onset() -> dict | None:
    """Date the era from the two artifacts log pruning does not touch.

    `claudeCodeFirstTokenDate` is the first token ever spent in Claude Code on this
    account; `firstStartTime` is when the binary first ran, which is NOT the same event
    -- here they are six months apart, an installed-but-unused stretch. The first record
    of history.jsonl corroborates the token stamp from a second file: a first prompt
    minutes after the first token is two independent sources agreeing.
    """
    if not CONFIG_JSON.exists():
        return None
    try:
        config = json.loads(CONFIG_JSON.read_text())
    except (json.JSONDecodeError, OSError):
        return None
    first_token = config.get("claudeCodeFirstTokenDate")
    first_start = config.get("firstStartTime")
    if not first_token:
        return None

    first_prompt = first_prompt_project = None
    if HISTORY_JSONL.exists():
        try:
            with HISTORY_JSONL.open(errors="replace") as handle:
                record = json.loads(handle.readline() or "{}")
            stamp = record.get("timestamp")
            if stamp:
                first_prompt = (
                    datetime.fromtimestamp(stamp / 1000, tz=timezone.utc)
                    .isoformat()
                    .replace("+00:00", "Z")
                )
                # basename only: the full path is a local machine detail.
                project = record.get("project")
                first_prompt_project = Path(project).name if project else None
        except (json.JSONDecodeError, OSError, TypeError, ValueError):
            pass

    return {
        "firstToken": first_token[:10],
        "firstTokenStamp": first_token,
        "firstStart": first_start[:10] if first_start else None,
        "firstStartStamp": first_start,
        "firstPromptStamp": first_prompt,
        "firstPromptProject": first_prompt_project,
        "logsArePruned": True,
        "source": (
            "~/.claude.json claudeCodeFirstTokenDate + firstStartTime; "
            "~/.claude/history.jsonl first record (dates only)"
        ),
    }


def write_onset_only() -> int:
    block = onset()
    if block is None:
        print(f"error: no onset dates in {CONFIG_JSON}", file=sys.stderr)
        return 1
    document = json.loads(measlib.ERAS.read_text())
    era = measlib.find_era(document, ERA_ID)
    if era is None:
        return 1
    era["onset"] = block
    era["provenance"]["onset"] = block["source"]
    measlib.write_store(document)
    print(
        f"claude-code onset: first start {block['firstStart']}, "
        f"first token {block['firstToken']}"
    )
    return 0


def measure(argv: list[str]) -> int:
    if argv and argv[0] == "--onset-only":
        return write_onset_only()
    log_root = Path(argv[0]).expanduser() if argv else DEFAULT_LOG_ROOT
    if not log_root.is_dir():
        print(f"error: {log_root} is not a directory", file=sys.stderr)
        return 1
    document = measlib.load_store()
    if document is None:
        return 1

    main_files = sorted(log_root.glob("*/*.jsonl"))
    subagent_files = sorted(log_root.glob("*/*/subagents/*.jsonl"))
    if not main_files:
        print(f"error: no main transcripts under {log_root}", file=sys.stderr)
        return 1

    dates: list[str] = []
    parent, subagent = Totals(), Totals()
    scan(main_files, parent, dates, sidechain=False)
    scan(subagent_files, subagent, dates, sidechain=True)

    era = measlib.find_era(document, ERA_ID)
    if era is None:
        return 1
    era["logStart"] = min(dates) if dates else None
    era["logEnd"] = max(dates) if dates else None
    era["metrics"] = {
        "main": parent.as_json("sessions"),
        "subagent": subagent.as_json("parentSessions"),
    }
    era["provenance"]["logs"] = "~/.claude/projects/**/*.jsonl (snapshots excluded)"
    onset_block = onset()
    if onset_block:
        era["onset"] = onset_block
        era["provenance"]["onset"] = onset_block["source"]

    measlib.write_store(document)
    print(
        f"claude-code: {len(parent.sessions)} main sessions ({parent.files} files), "
        f"{subagent.files} subagent transcripts across {len(subagent.sessions)} parent sessions"
    )
    return 0
