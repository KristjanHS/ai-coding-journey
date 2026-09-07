#!/usr/bin/env python3
"""Fill the Copilot Chat era in sources/measurements/eras-full.json.

Usage: python3 scripts/measurements-copilot.py [WORKSPACE_STORAGE_ROOT]
       (default: the measured Windows-side path below)

VS Code stores Copilot Chat history per workspace:

    <workspaceStorage>/<workspace-hash>/chatSessions/<session>.json

Each file is one chat session: `requests[]` are the turns, `creationDate` and
`lastMessageDate` are epoch ms. The workspace hashes are opaque, so the count of
workspaces that ever held a chat is itself the only per-project signal this era offers.

This is the thinnest era of the five and the honest reason is in the data: there is no
token field and no cost field anywhere in these files. Cost is `absent` rather than
`unknown` (decision D4) — the free tier billed nothing, which is a different claim from
Cursor's server-side unknown.

The recon brief's Copilot turn count (86) collided with a Continue figure, so it is a
QUOTED EXPECTATION here and never a fixture: the count below is recomputed from
`requests[]` and pinned only after it reproduced.

Deterministic: sorted keys, no timestamps of its own.
"""

from __future__ import annotations

import datetime as dt
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ERAS = ROOT / "sources" / "measurements" / "eras-full.json"
DEFAULT_ROOT = Path("/mnt/c/Users/PC/AppData/Roaming/Code/User/workspaceStorage")
ERA_ID = "copilot"


def day(epoch_ms) -> str | None:
    if not epoch_ms:
        return None
    return dt.datetime.fromtimestamp(int(epoch_ms) / 1000, dt.timezone.utc).strftime(
        "%Y-%m-%d"
    )


def scan(paths: list[Path]) -> dict:
    turns = 0
    days: list[str] = []
    workspaces: set[str] = set()
    for path in paths:
        try:
            session = json.loads(path.read_text(errors="replace"))
        except json.JSONDecodeError:
            continue
        turns += len(session.get("requests") or [])
        # chatSessions/<file>.json — the workspace hash is two levels up.
        workspaces.add(path.parent.parent.name)
        for field in ("creationDate", "lastMessageDate"):
            stamp = day(session.get(field))
            if stamp:
                days.append(stamp)
    return {
        "sessions": len(paths),
        "turns": turns,
        "workspacesWithChat": len(workspaces),
        "start": min(days) if days else None,
        "end": max(days) if days else None,
    }


def main() -> int:
    root = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_ROOT
    if not root.is_dir():
        print(f"error: {root} is not a directory", file=sys.stderr)
        return 1
    if not ERAS.exists():
        print(
            "error: eras.json missing — run scripts/measurements-git.py first",
            file=sys.stderr,
        )
        return 1
    paths = sorted(root.glob("*/chatSessions/*.json"))
    if not paths:
        print(f"error: no chat sessions under {root}", file=sys.stderr)
        return 1

    measured = scan(paths)
    start, end = measured.pop("start"), measured.pop("end")
    workspaces_total = len([p for p in root.iterdir() if p.is_dir()])

    document = json.loads(ERAS.read_text())
    for era in document["eras"]:
        if era["id"] != ERA_ID:
            continue
        era["logStart"], era["logEnd"] = start, end
        era["metrics"] = {
            **measured,
            "workspacesTotal": workspaces_total,
            # Stated as data, not left to the reader to infer from a missing key: this
            # era has no token or cost field at all.
            "tokenFieldPresent": False,
            "costFieldPresent": False,
        }
        era["provenance"]["logs"] = (
            "VS Code workspaceStorage/*/chatSessions/*.json (no token or cost field)"
        )
        break
    else:
        print(f"error: no '{ERA_ID}' era in eras.json", file=sys.stderr)
        return 1

    ERAS.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n")
    print(
        f"copilot: {measured['sessions']} sessions / {measured['turns']} turns across "
        f"{measured['workspacesWithChat']} of {workspaces_total} workspaces, {start}..{end}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
