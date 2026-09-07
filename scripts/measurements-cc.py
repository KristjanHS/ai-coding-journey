#!/usr/bin/env python3
"""Fill the Claude Code era in content/measurements/data/eras.json from its own logs.

Usage: python3 scripts/measurements-cc.py [PROJECTS_ROOT]   (default ~/.claude/projects)

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

Money comes from `cost-state` records, which are CUMULATIVE per session -- the last one
in a session carries the running total, so summing every cost-state in a file
double-counts. We take the last per session and sum across sessions; the same record's
`modelUsage` gives the per-model split, cross-checked against its own total.

Deterministic: sorted keys, no timestamps of its own.
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ERAS = ROOT / "content" / "measurements" / "data" / "eras.json"
DEFAULT_LOG_ROOT = Path.home() / ".claude" / "projects"
ERA_ID = "claude-code"

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
    costs: dict[str, dict],
    *,
    sidechain: bool,
) -> None:
    """Accumulate one set of transcripts. `costs` is keyed by session so the last
    cost-state per session replaces, never adds to, its predecessors.

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
                elif kind == "cost-state":
                    costs[record.get("sessionId") or session] = record


def cost_summary(costs: dict[str, dict]) -> dict:
    total = 0.0
    per_model: dict[str, float] = defaultdict(float)
    unknown_model_cost = False
    for record in costs.values():
        total += record.get("totalCostUSD") or 0.0
        if record.get("hasUnknownModelCost"):
            unknown_model_cost = True
        for model, usage in (record.get("modelUsage") or {}).items():
            per_model[model] += (usage or {}).get("costUSD") or 0.0
    return {
        "totalUSD": round(total, 4),
        "perModelUSD": {
            model: round(value, 4) for model, value in sorted(per_model.items())
        },
        "sessionsWithCostState": len(costs),
        "hasUnknownModelCost": unknown_model_cost,
    }


def main() -> int:
    log_root = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_LOG_ROOT
    if not log_root.is_dir():
        print(f"error: {log_root} is not a directory", file=sys.stderr)
        return 1
    if not ERAS.exists():
        print(
            "error: eras.json missing — run scripts/measurements-git.py first",
            file=sys.stderr,
        )
        return 1

    main_files = sorted(log_root.glob("*/*.jsonl"))
    subagent_files = sorted(log_root.glob("*/*/subagents/*.jsonl"))
    if not main_files:
        print(f"error: no main transcripts under {log_root}", file=sys.stderr)
        return 1

    dates: list[str] = []
    parent, subagent = Totals(), Totals()
    parent_costs: dict[str, dict] = {}
    subagent_costs: dict[str, dict] = {}
    scan(main_files, parent, dates, parent_costs, sidechain=False)
    scan(subagent_files, subagent, dates, subagent_costs, sidechain=True)

    document = json.loads(ERAS.read_text())
    for era in document["eras"]:
        if era["id"] != ERA_ID:
            continue
        era["logStart"] = min(dates) if dates else None
        era["logEnd"] = max(dates) if dates else None
        era["metrics"] = {
            "main": parent.as_json("sessions"),
            "subagent": subagent.as_json("parentSessions"),
            # Money is only ever attributed to the main session: cost-state records live
            # in the parent transcript and already price the work its subagents did.
            "cost": cost_summary(parent_costs),
        }
        era["provenance"]["logs"] = "~/.claude/projects/**/*.jsonl (snapshots excluded)"
        break
    else:
        print(f"error: no '{ERA_ID}' era in eras.json", file=sys.stderr)
        return 1

    ERAS.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n")
    print(
        f"claude-code: {len(parent.sessions)} main sessions ({parent.files} files), "
        f"{subagent.files} subagent transcripts across {len(subagent.sessions)} parent sessions"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
