"""Fill the Codex era in sources/measurements/eras-full.json from ~/.codex/sessions.

Usage: python3 scripts/measurements.py codex [CODEX_SESSIONS_ROOT]
       (default ~/.codex/sessions)

Rollouts live at `sessions/YYYY/MM/DD/rollout-*.jsonl`, and they come in TWO formats
that a single-shape parser silently half-reads:

    old   {"id": …, "timestamp": …}                       session header at top level
          {"type": "message", "role": "user", …}          a turn, unwrapped
    new   {"type": "session_meta", "payload": {"id": …}}   session header, wrapped
          {"type": "response_item", "payload": {"type": "message", "role": "user"}}

The plan's recon brief read only the old shape, which is why it reported 137 sessions
(exactly the old-format file count) and no tokens at all. Both are counted here.

Tokens: the new format emits `event_msg` → `token_count` → `info.total_token_usage`,
which is CUMULATIVE per session, so the last such event in a file is that file's total
and summing every event would multiply-count. Only ~a third of the rollouts carry them
(the feature arrived 2025-09-23), so the sum is a FLOOR on the era and ships with a
`partialLogging` flag naming that boundary — a different reason from Cursor's floor,
and the page has to say which is which.

`cached_input_tokens` is a SUBSET of `input_tokens`, and `reasoning_output_tokens` a
subset of `output_tokens` -- neither is a separate class like Claude Code's
`cache_creation`. The measured data satisfies `total_tokens == input + output` exactly,
which is the check the test pins. Both subsets are kept as their own fields and never
added into a headline; doing so would double-count.

There is no cost field anywhere in these logs, so cost stays `unknown-server-side`
(decision D4) and is never estimated from the token counts.

`~/.codex/history.jsonl` is a 3-line stub, NOT a prompt log — recorded in provenance so
no later session re-probes it.

Deterministic: sorted keys, no timestamps of its own.
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

import measlib

DEFAULT_ROOT = Path.home() / ".codex" / "sessions"
ERA_ID = "codex"

TOKEN_FIELDS = (
    "input_tokens",
    "cached_input_tokens",
    "output_tokens",
    "reasoning_output_tokens",
    "total_tokens",
)


def scan(paths: list[Path]) -> dict:
    sessions: set[str] = set()
    headers = Counter()  # which of the two formats each file used
    prompts = 0
    environment_prompts = 0
    assistant_messages = 0
    days: list[str] = []
    token_files = 0
    token_days: list[str] = []
    totals = Counter()

    for path in paths:
        session_id = None
        header_kind = None
        last_usage = None
        for line in path.open(errors="replace"):
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue
            if not isinstance(record, dict):
                continue
            kind = record.get("type")
            payload = (
                record.get("payload") if isinstance(record.get("payload"), dict) else {}
            )
            stamp = record.get("timestamp")
            if stamp:
                days.append(stamp[:10])

            if session_id is None:
                if kind == "session_meta" and payload.get("id"):
                    session_id, header_kind = payload["id"], "session_meta"
                elif kind is None and record.get("id") and record.get("timestamp"):
                    session_id, header_kind = record["id"], "top-level-id"

            # A turn is a message record in either shape.
            message = (
                record
                if kind == "message"
                else (payload if payload.get("type") == "message" else None)
            )
            if message:
                if message.get("role") == "user":
                    prompts += 1
                    text = json.dumps(message.get("content") or "")
                    # Codex injects its own context as a user turn; counted apart so
                    # "prompts" cannot silently mean "prompts plus tool preamble".
                    if "<environment_context>" in text or "<user_instructions>" in text:
                        environment_prompts += 1
                elif message.get("role") == "assistant":
                    assistant_messages += 1

            if kind == "event_msg" and payload.get("type") == "token_count":
                usage = (payload.get("info") or {}).get("total_token_usage")
                if usage:
                    last_usage = usage
                    if stamp:
                        token_days.append(stamp[:10])

        if session_id:
            sessions.add(session_id)
            headers[header_kind] += 1
        if last_usage:
            token_files += 1
            for field in TOKEN_FIELDS:
                totals[field] += last_usage.get(field) or 0

    return {
        "sessions": len(sessions),
        "files": len(paths),
        "headerFormats": dict(sorted(headers.items())),
        "prompts": prompts,
        "environmentPrompts": environment_prompts,
        "humanPrompts": prompts - environment_prompts,
        "assistantMessages": assistant_messages,
        "tokens": {
            **{field: totals[field] for field in TOKEN_FIELDS},
            # The floor's boundary, as data: the token_count event did not exist for
            # the first weeks of the era.
            "filesWithTokens": token_files,
            "partialLogging": True,
            "loggingStart": min(token_days) if token_days else None,
        },
        "start": min(days) if days else None,
        "end": max(days) if days else None,
    }


def measure(argv: list[str]) -> int:
    root = Path(argv[0]).expanduser() if argv else DEFAULT_ROOT
    if not root.is_dir():
        print(f"error: {root} is not a directory", file=sys.stderr)
        return 1
    document = measlib.load_store()
    if document is None:
        return 1
    paths = sorted(root.glob("*/*/*/rollout-*.jsonl"))
    if not paths:
        print(f"error: no rollout transcripts under {root}", file=sys.stderr)
        return 1

    measured = scan(paths)
    start, end = measured.pop("start"), measured.pop("end")

    era = measlib.find_era(document, ERA_ID)
    if era is None:
        return 1
    era["logStart"], era["logEnd"] = start, end
    era["metrics"] = measured
    # D2 as amended: Codex joins the token floor, with its own reason for being one.
    era["availability"]["tokens"] = "floor"
    era["provenance"]["logs"] = (
        "~/.codex/sessions/**/rollout-*.jsonl (two header formats); "
        "history.jsonl is a 3-line stub, not a prompt log"
    )

    measlib.write_store(document)
    tokens = measured["tokens"]
    print(
        f"codex: {measured['sessions']} sessions in {measured['files']} rollouts "
        f"({measured['prompts']} user turns, {measured['humanPrompts']} human), "
        f"{tokens['input_tokens']} input / {tokens['output_tokens']} output from "
        f"{tokens['filesWithTokens']} rollouts since {tokens['loggingStart']}, {start}..{end}"
    )
    return 0
