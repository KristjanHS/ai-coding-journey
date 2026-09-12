---
title: The command that names the loaders it must call
source: journey repo `proj-mgmt` — `.claude/commands/pm/conflict-check.md`, committed 13:27 on 2026-03-29
kind: prompt
captured: "2026-03-29"
---

# Prompt · a repo-local command written as a checkable procedure

One of the seven `/pm:` commands chapter 07's repo authored between 13:09 and 13:29 on 2026-03-29,
and the artifact that raises that chapter's peak to `configuring`. It was for asking the project data
one question — dependency conflicts and date inconsistencies — and it is not still used: the tool was
finished three hours after the command was written, and nobody ran any of the seven again. The
opening, verbatim:

```markdown
Detect dependency conflicts and date inconsistencies within a project.

$ARGUMENTS — project slug. If omitted and multiple projects exist, ask which one.

## Steps

1. **Load and validate data.**
   Read `data/people.json` via `pm.loader.load_people`, then load the project via `pm.loader.load_project`. Stop on validation errors — schema issues are reported here, not below.

2. **Check dependency chains.**
   - **Circular dependencies**: walk the dependency graph (DFS). Report each cycle found. (The schema validator already catches these, but confirm and explain them in plain language.)
   - **Finish-to-start violations**: for every `finish-to-start` dependency, verify the predecessor's end date is before the dependent task's start date. Flag violations with both task names and dates.
```

It names the loader functions it must call and the order it must check in, and it says where errors
stop. That is the shape the later rules layer has too — which is exactly why adopting that layer read
as progress when it was not: the commands are authored and count, the rules were consumed from another
repo and do not.

## What didn't work

The policy layer outlived the tool: seven commands and a 62-line `CLAUDE.md` were written in twenty
minutes, and after that afternoon none of them was ever load-bearing.

## Where it came from

The journey repo `proj-mgmt`, file `.claude/commands/pm/conflict-check.md`, at the commit of 13:27 on
2026-03-29. No public address is claimed for it here; the excerpt is quoted in chapter 07.
