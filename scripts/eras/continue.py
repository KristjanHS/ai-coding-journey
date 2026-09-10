"""Fill the Continue era in sources/measurements/eras-full.json from ~/.continue.

Usage: python3 scripts/measurements.py continue [CONTINUE_ROOT]
       (default: the measured Windows-side path below)

Continue records the same token events twice, and this generator reads BOTH on purpose:

    dev_data/0.2.0/tokensGenerated.jsonl   one JSON event per generation
    dev_data/devdata.sqlite                a `tokens_generated` table mirroring them

The jsonl is the primary; the sqlite mirror is a cross-check, and a disagreement between
them is emitted as data (`crossCheck`) rather than reconciled away. The mirror is read
through the same read-only immutable scratchpad copy the Cursor generator uses -- never
the source database directly.

Two date ranges come out of this era and they genuinely differ: the 16 chat sessions in
`sessions/sessions.json` stop on 2025-07-09, while token events run on to 2025-08-16
(autocomplete keeps generating after the last chat). The page shows both; picking one
would silently shorten or lengthen the era.

Cost: Continue has no cost field, and unlike Cursor that is not an unknown. The provider
mix is overwhelmingly local `ollama`, so the marginal money is ≈$0 BY CONSTRUCTION --
decision D4's `near-zero-local` state, a finding in its own terms. The provider split
ships as data so the claim is checkable rather than asserted.

Deterministic: sorted keys, no timestamps of its own.
"""

from __future__ import annotations

import datetime as dt
import json
import shutil
import sqlite3
import sys
import tempfile
from collections import Counter, defaultdict
from pathlib import Path

import measlib

DEFAULT_ROOT = Path("/mnt/c/Users/PC/.continue")
ERA_ID = "continue"

MIRROR_SQL = """
SELECT COUNT(*), SUM(tokens_prompt), SUM(tokens_generated)
FROM tokens_generated
"""


def read_events(path: Path) -> dict:
    """Sum the jsonl token events, grouped by provider and by model."""
    prompt = generated = events = 0
    stamps: list[str] = []
    providers: Counter[str] = Counter()
    per_provider: dict[str, dict[str, int]] = defaultdict(
        lambda: {"prompt": 0, "generated": 0}
    )
    models: set[str] = set()
    with path.open(errors="replace") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue
            events += 1
            provider = event.get("provider") or "unknown"
            prompt_tokens = event.get("promptTokens") or 0
            generated_tokens = event.get("generatedTokens") or 0
            prompt += prompt_tokens
            generated += generated_tokens
            providers[provider] += 1
            per_provider[provider]["prompt"] += prompt_tokens
            per_provider[provider]["generated"] += generated_tokens
            if event.get("model"):
                models.add(event["model"])
            if event.get("timestamp"):
                stamps.append(event["timestamp"][:10])
    return {
        "events": events,
        "promptTokens": prompt,
        "generatedTokens": generated,
        "models": len(models),
        "eventsByProvider": dict(sorted(providers.items())),
        "tokensByProvider": {
            provider: dict(counts) for provider, counts in sorted(per_provider.items())
        },
        "start": min(stamps) if stamps else None,
        "end": max(stamps) if stamps else None,
    }


def read_mirror(db: Path) -> dict:
    with tempfile.TemporaryDirectory(prefix="continue-measure-") as tmp:
        copy = Path(tmp) / "devdata.sqlite"
        shutil.copy2(db, copy)
        with sqlite3.connect(f"file:{copy}?mode=ro&immutable=1", uri=True) as conn:
            rows, prompt, generated = conn.execute(MIRROR_SQL).fetchone()
    return {
        "events": rows,
        "promptTokens": prompt or 0,
        "generatedTokens": generated or 0,
    }


def read_sessions(path: Path) -> dict:
    sessions = json.loads(path.read_text())
    days = sorted(
        dt.datetime.fromtimestamp(
            int(entry["dateCreated"]) / 1000, dt.timezone.utc
        ).strftime("%Y-%m-%d")
        for entry in sessions
        if entry.get("dateCreated")
    )
    return {
        "count": len(sessions),
        "start": days[0] if days else None,
        "end": days[-1] if days else None,
    }


def measure(argv: list[str]) -> int:
    root = Path(argv[0]).expanduser() if argv else DEFAULT_ROOT
    events_path = root / "dev_data" / "0.2.0" / "tokensGenerated.jsonl"
    mirror_path = root / "dev_data" / "devdata.sqlite"
    sessions_path = root / "sessions" / "sessions.json"
    for path in (events_path, mirror_path, sessions_path):
        if not path.is_file():
            print(f"error: {path} is not a file", file=sys.stderr)
            return 1
    document = measlib.load_store()
    if document is None:
        return 1

    events = read_events(events_path)
    mirror = read_mirror(mirror_path)
    sessions = read_sessions(sessions_path)

    # A disagreement is a FINDING, never smoothed over: the deltas are emitted whether
    # they are zero or not, and `agrees` says which case this regeneration saw.
    deltas = {
        field: events[field] - mirror[field]
        for field in ("events", "promptTokens", "generatedTokens")
    }
    cross_check = {
        "source": "dev_data/devdata.sqlite tokens_generated",
        "mirror": mirror,
        "delta": deltas,
        "agrees": not any(deltas.values()),
    }

    era = measlib.find_era(document, ERA_ID)
    if era is None:
        return 1
    # The token-event range is the era's log range; the chat-session range is
    # shorter and is kept beside it rather than replacing it.
    era["logStart"] = events["start"]
    era["logEnd"] = events["end"]
    era["metrics"] = {
        "sessions": sessions,
        "tokens": {
            "events": events["events"],
            "promptTokens": events["promptTokens"],
            "generatedTokens": events["generatedTokens"],
            "models": events["models"],
            "start": events["start"],
            "end": events["end"],
        },
        "byProvider": {
            "events": events["eventsByProvider"],
            "tokens": events["tokensByProvider"],
        },
        "crossCheck": cross_check,
        # D4: not an unknown. Local inference has no marginal price, and the
        # provider split above is the evidence for saying so.
        "costFinding": "near-zero-local",
    }
    era["provenance"]["logs"] = (
        "~/.continue/dev_data/0.2.0/tokensGenerated.jsonl "
        "(+ devdata.sqlite mirror cross-check), sessions/sessions.json"
    )

    measlib.write_store(document)
    print(
        f"continue: {sessions['count']} sessions ({sessions['start']}..{sessions['end']}), "
        f"{events['events']} token events ({events['start']}..{events['end']}), "
        f"{events['promptTokens']} prompt / {events['generatedTokens']} generated, "
        f"sqlite mirror {'agrees' if cross_check['agrees'] else 'DISAGREES: ' + json.dumps(deltas)}"
    )
    return 0
