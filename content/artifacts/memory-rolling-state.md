---
title: A memory entry, and the admission test that keeps it short
source: this project's auto-memory — `project_state.md` (not published; excerpted here)
kind: memory
captured: "2026-09-08"
---

# Memory · the one file the next session reads first

The other four artifacts shape a session while it runs. A memory entry is the only one that crosses
the boundary between sessions — it is what survives when the window is thrown away.

The failure mode is obvious once you have seen it: a memory file becomes a diary. Every session
appends what it did, nothing is ever deleted, and within a month the file costs more to load than it
saves. The defence is a single admission test, applied at every write:

```md
A line enters ONLY if it is OPEN or OWED, the next session is *wrong* without it, and no cheaper
source has it. ≤200 chars per item, no evidence, no rationale, never a paragraph — if it needs a
paragraph it needs a doc, and the line here is that doc's name.
```

*No cheaper source has it* is the clause that does the work. The commit log already records what was
done; the plan document already records why. What neither records is what is still open.

## What one actually looks like

A live entry from this project's own state file, reproduced verbatim:

```md
**`stage_peak` defaults to `stage` by CONVENTION, not in Zod.** `.default()` was rejected so an
unset value stays visible. Anything reading the key must apply `peak ?? stage` itself. The
`/journey/` ledger table sidesteps this by filtering to `repo !== undefined`; nothing else
reads it.
```

Four lines, and every one of them is load-bearing. A session that reads the Zod schema will see no
default and reasonably conclude the key is required. The next session is *wrong* without this note —
which is the admission test, passed.

Compare it against what does **not** get written: "Stage 3 shipped the governance generator." That
is true, it is in the commit log, and it is therefore refused.

The test also re-applies to lines already in the file. Carrying a line forward is a fresh admission,
not a free ride — an item stops being OPEN the moment the thing it warned about ships, and it is
deleted in that same write rather than marked done.

## What didn't work

Appending. The file is rewritten whole on every write, because an append-only file cannot delete,
and a state file that cannot delete is a log. Related: marking an item `✅ DONE` instead of removing
it. A closed item that stays in the file is pure cost, and the commit that closed it is a better
record than the checkmark.

Also refused: putting the rationale next to the pointer. Rationale belongs in the plan document; the
state file carries the document's name. That single substitution is most of the difference between a
file that stays under a screen and one that does not.

## Where it came from

This project's auto-memory directory, which is **not** part of this repository and has no public
address — it is per-machine, per-project state. Unlike the other four artifacts on this page, you
cannot diff this one against anything; the excerpt above is the whole evidence.

Ledger field it evidences: **versioned**.
