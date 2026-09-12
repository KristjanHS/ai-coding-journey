---
title: The rule that raised dewpoint's peak, written the day governance arrived
source: journey repo `dewpoint` — `.claude/rules/api-routes.md`, first committed in `ca0f68d` on 2026-06-24
kind: rule
captured: "2026-06-24"
---

# Rule · a path-gated convention written for one app's routes

The project-authored rule that raises chapter 03's peak to `configuring` — not in the global config
baseline; it names this app's routes, its upstream weather services and its own error shape. Verbatim
as first committed on 2026-06-24, the one day an eleven-month-old project got its first tests, a
`CLAUDE.md`, four rules and two skills in twenty-one commits:

```markdown
---
paths:
  - "app/api/**/route.ts"
last_verified: 2026-06-24
---
# API Route Conventions

## Conventions

App Router `GET` handlers (`app/api/<name>/route.ts`) proxying external weather APIs. No dynamic `[id]` routes yet — when added, params are a Promise: `await context.params`.

- **Live data**: set `export const dynamic = "force-dynamic"`, else Next caches the response at build time.
- **External fetch**: `fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" })`, then `if (!response.ok) throw new Error(...)`.
- **Required env vars**: guard before use — `if (!apiKey) return NextResponse.json({ error: "Missing X" }, { status: 500 })`.
- **Errors**: `NextResponse.json({ error, detail? }, { status })`. No `{ success, data }` envelope — keep success payloads route-specific.
- **XML parsing** (`humidity`/`beach` via `xml2js`): prefer a typed shape over widening to `any`.
```

Every line can be held against a route file: the caching directive, the fetch shape, the error
envelope it forbids. Nothing in it could have come from a baseline, because a baseline does not know
this app's routes.

## What didn't work

The rule arrived eleven months in, on the same day as the first tests — nothing it names was guarded
during the repo's first two lives, and the first boundary test found a seven-month-old production bug.

## Where it came from

The journey repo `dewpoint`, file `.claude/rules/api-routes.md`, at its first commit `ca0f68d`
(2026-06-24). No public address is claimed for it here; the excerpt is reproduced verbatim from that
commit and quoted in chapter 03.
