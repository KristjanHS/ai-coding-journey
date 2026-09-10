---
paths:
  - "docs/**/*.md"
---
# Plan / Doc Hygiene

Adapted from crash-dash's rule of the same name; project-specific doc names stripped.

## Archiving and deleting a plan doc

- **Archive at ship** — every stage committed, only a USER-owed manual/eye/live confirm left. User-owed
  *decisions* go to `journey-backlog.md`'s `## Open calls` (docs/plans/); assistant-owed follow-ups go to
  its `## Backlog`, and are deleted in the commit that ships them. `journey-backlog.md`'s `## Shipped` gets
  one line + commit subject.
- **A carry is a re-admission, never a relocation** — an item moved into the backlog re-clears its
  admission row (`content-writing.md`) at the move; evidence, measurements and ship narrative stay in the
  archived plan and the commit message.
- `git add` uncommitted edits to the doc **first** (`git mv` stages against HEAD and silently drops them),
  and **pathspec both halves of the rename** — naming only the archive path leaves the doc at both paths.
- Never `git rm` a plan doc — archiving keeps every stem cite resolving. Commit a staged plan doc before the
  session ends.

## Where plan docs actually live

`docs/plans` is a symlink into `~/projects/dotfiles/docs/plans/ai-coding-journey/`, gitignored here — commit
a plan doc in the *dotfiles* repo, pathspec'd to that dir, and lint it: only `docs/plans/archive` is ignored.
Because `make check` runs markdownlint through the symlink, an agent-authored plan doc reds the gate on
MD060/MD040/MD004 — lint it before the burst, not after.

## Cite plan docs by stem, not path

Cite `<stem>.md (docs/plans/)` — never a `docs/plans/`-prefixed path, and never into `docs/plans/archive/`
(a repoint there re-breaks on the next move). Archiving then dangles nothing.

## Claims

Everything you write down is a claim. The moves:

- **Cite constants by SYMBOL, never `file:LINE`** — line cites rot within a day.
- **A coverage claim owes a grep of the named test** — including the negative form: "nothing pins X" means
  grepping the VALUE, not just a symbol.
- **A recorded SHA owes `git merge-base --is-ancestor <sha> main`.** Prove landing by subject
  (`git log --oneline main --grep '<stem-or-symbol>'`) or by the symbol in the tree.
- **An audit or review finding is true at capture only** — re-grep the mechanism before acting on it later.
- **Moving a section RE-ASSERTS every claim inside it.** Grep the moved text for `this file`,
  `above`/`below`, counts and its outbound cites; resolve each locator to the file that now holds its
  referent; diff against the original for silently dropped gates.
- **A gate or quantifier you author owes the population it must admit** — run it as written, and sum the
  sections a numeric threshold will measure; both can be unsatisfiable by construction.
- **Closing a decision or shipping an owed item owes a stem-grep of its staged copies** (`journey-backlog.md`,
  `project_state`) in the same burst: **delete the entry; a ✅/CLOSED marker written into the file is the
  defect** — the commit message is the closure record. (Exception: `journey-backlog.md`'s `## Shipped` is the
  one sanctioned ✅ line.)

## Deleting a SECTION HEADING dangles refs exactly like deleting a file

Nothing warns — the file still resolves. On a rename, merge or deletion of a `##`, sweep the bare STEM
repo-wide and re-read every hit against the surviving text, **in the same commit** (`docs/plans/archive/`
included):

```
grep -rn '<file-stem>' --include=*.md --include=*.ts --include=*.astro --include=*.py --include=*.sh
```

The bare stem subsumes every `§`-anchored form. **A `§` cite must always carry its stem.** Before citing a
`§`, confirm the target is a real `##` — `grep -n '^#\+ ' <file>`; a **bold paragraph** reads like a
heading in every other respect, so a cite onto one dangles from birth.
