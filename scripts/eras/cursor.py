"""Fill the Cursor era in sources/measurements/eras-full.json from its state.vscdb.

Usage: python3 scripts/measurements.py cursor [STATE_VSCDB]
       (default: the measured Windows-side path below)

Cursor keeps everything in one ~1.2 GB SQLite file. Two rules govern reading it, and
both are load-bearing rather than stylistic:

  1. NEVER open the source database directly. It belongs to another application that
     may be running; opening it writable (or even letting SQLite create a -wal) risks
     the user's own history. We copy it to a scratch file and open that copy through a
     read-only immutable URI, so the connection cannot write anything anywhere.
  2. AGGREGATE SQL ONLY. The `cursorDiskKV` table holds ~74k message rows whose values
     are JSON blobs; pulling them into Python would move hundreds of megabytes through
     the process for sums SQLite computes in one pass.

What the two key shapes mean:

    composerData:<uuid>              one Cursor session (its `createdAt` is epoch ms)
    bubbleId:<composer>:<bubble>     one message; `type` 1 = user, 2 = assistant

Nearly every bubble carries a `tokenCount: {inputTokens, outputTokens}` object, but only
under 5% of bubbles carry a NON-ZERO one, and every one of those is an assistant
turn. (The recon brief quoted ~19%; the recompute does not reproduce it and the measured
figure is reported rather than forced.) Cursor also computes these client-side, so they
are an estimate, not anything billed. Both facts ship as data flags
(`pricedBubbles`/`nonZeroBubbleFraction`, `estimateSource`) so the page cannot render the
number without them. There is no model name and no cost anywhere in this database:
availability.cost stays `unknown-server-side` per decision D4, and inc5a never estimates
a money figure it cannot derive.

Deterministic: sorted keys, no timestamps of its own.
"""

from __future__ import annotations

import shutil
import sqlite3
import sys
import tempfile
from pathlib import Path

import measlib

DEFAULT_DB = Path(
    "/mnt/c/Users/PC/AppData/Roaming/Cursor/User/globalStorage/state.vscdb"
)
ERA_ID = "cursor"

# One pass per question, all of them aggregates. `json_extract` runs inside SQLite, so
# no blob ever crosses into Python.
SESSION_SQL = """
SELECT COUNT(*),
       MIN(json_extract(value, '$.createdAt')),
       MAX(json_extract(value, '$.createdAt'))
FROM cursorDiskKV
WHERE key LIKE 'composerData:%'
"""

BUBBLE_SQL = """
SELECT COUNT(*),
       SUM(json_extract(value, '$.type') = 1),
       SUM(json_extract(value, '$.type') = 2),
       SUM(json_extract(value, '$.type') IS NULL),
       SUM(COALESCE(json_extract(value, '$.tokenCount.inputTokens'), 0)),
       SUM(COALESCE(json_extract(value, '$.tokenCount.outputTokens'), 0)),
       SUM(COALESCE(json_extract(value, '$.tokenCount.inputTokens'), 0)
           + COALESCE(json_extract(value, '$.tokenCount.outputTokens'), 0) > 0),
       SUM(json_extract(value, '$.type') = 2
           AND COALESCE(json_extract(value, '$.tokenCount.inputTokens'), 0)
             + COALESCE(json_extract(value, '$.tokenCount.outputTokens'), 0) > 0)
FROM cursorDiskKV
WHERE key LIKE 'bubbleId:%'
"""


def iso_day(epoch_ms: int | None) -> str | None:
    if epoch_ms is None:
        return None
    import datetime as dt

    return dt.datetime.fromtimestamp(epoch_ms / 1000, dt.timezone.utc).strftime(
        "%Y-%m-%d"
    )


def scan(db: Path) -> dict:
    """Copy the database, then read the copy read-only and immutable."""
    with tempfile.TemporaryDirectory(prefix="cursor-measure-") as tmp:
        copy = Path(tmp) / "state.vscdb"
        shutil.copy2(db, copy)
        uri = f"file:{copy}?mode=ro&immutable=1"
        with sqlite3.connect(uri, uri=True) as conn:
            sessions, created_min, created_max = conn.execute(SESSION_SQL).fetchone()
            (
                bubbles,
                user_bubbles,
                assistant_bubbles,
                untyped_bubbles,
                input_tokens,
                output_tokens,
                non_zero,
                non_zero_assistant,
            ) = conn.execute(BUBBLE_SQL).fetchone()

    return {
        "sessions": sessions,
        "messages": {
            "total": bubbles,
            "user": user_bubbles or 0,
            "assistant": assistant_bubbles or 0,
            "untyped": untyped_bubbles or 0,
        },
        "tokens": {"input": input_tokens or 0, "output": output_tokens or 0},
        # The two caveats, carried as data so the page is FORCED to render them: a
        # twentieth of the bubbles priced means the sum is a floor, and Cursor's own
        # client computed it, so it is not a billed figure.
        "pricedBubbles": non_zero or 0,
        "pricedBubblesAssistant": non_zero_assistant or 0,
        "nonZeroBubbleFraction": round((non_zero or 0) / bubbles, 4) if bubbles else 0,
        "estimateSource": "cursor-client",
        "isFloor": True,
        "_range": (iso_day(created_min), iso_day(created_max)),
    }


def measure(argv: list[str]) -> int:
    db = Path(argv[0]).expanduser() if argv else DEFAULT_DB
    if not db.is_file():
        print(f"error: {db} is not a file", file=sys.stderr)
        return 1
    document = measlib.load_store()
    if document is None:
        return 1

    measured = scan(db)
    log_start, log_end = measured.pop("_range")

    era = measlib.find_era(document, ERA_ID)
    if era is None:
        return 1
    era["logStart"] = log_start
    era["logEnd"] = log_end
    era["metrics"] = measured
    era["provenance"]["logs"] = (
        "Cursor state.vscdb (cursorDiskKV), read-only immutable copy"
    )

    measlib.write_store(document)
    print(
        f"cursor: {measured['sessions']} sessions, {measured['messages']['total']} messages, "
        f"{measured['tokens']['input']} input / {measured['tokens']['output']} output tokens "
        f"({measured['nonZeroBubbleFraction']:.0%} of bubbles priced) {log_start}..{log_end}"
    )
    return 0
