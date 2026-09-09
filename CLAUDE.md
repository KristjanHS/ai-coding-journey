# ai-coding-journey — Claude instructions

Public, **markdown-first** knowledge base of one person's journey from a 20-year coding pause to shipping
a ~5k-commit app with AI coding agents. The markdown under `content/` IS the product (readable on GitHub
as-is); an Astro site on Vercel (from inc3) renders it as a browsable journey, a web-native lecture deck
(TalTech, 19 Nov 2026) and, later, interactive explorers. Long horizon: a book from the same files.

## Where things live

- **Living spec** (north star, binding constraints, increment backlog, shipped log, open calls):
  `2026-09-09-journey-vision.md` (docs/plans/). Read it before any content or design change; it is the
  single source of the *evidence rule* and the *anti-hype rule*. Never inline build detail there — each
  increment gets a thin `docs/plans/YYYY-MM-DD-<inc>-spec.md`, run via `/qimpag`, then `git mv`'d to
  `docs/plans/archive/` on ship.
- `content/journey/NN-<repo>.md` — one chapter per repo · `content/prompts/` — sanitised reusable prompts ·
  `content/case-study/crash-dash/` — sanitised `.md` layer of a private repo · `content/course/` — course
  skeleton · `content/timeline.json` — **generated** by `scripts/timeline-from-git.py`, never hand-edited.
- `sources/` — gitignored OneNote exports (`.docx` per page) + pandoc output. Read via a cheap sub-agent
  brief, never whole files into the main session.

**Writable `.md` targets** — `content/**`, `docs/plans/**`, `README.md`, `docs/creator.md`, `CLAUDE.md`;
admission rows per target → `.claude/rules/content-writing.md`. `docs/plans/archive/**` is read-only.
`README.md` addresses **readers** of the journey only — every build/verify/deploy/repo-layout detail lives
in `docs/creator.md`; never reintroduce it into the README.

## Workflow

- **Evidence over tone.** A chapter ships only with ≥1 artifact block (prompt / rule excerpt / defect a
  reviewer caught / measured number) and a *What didn't work* line. Banned vocabulary and the sceptic
  review gate → `content-writing.md`. A claim about a private repo names the lesson, never code, live
  links or colleagues.
- **One verification gate, run once per step**: `make check` — markdownlint over every `.md`, `astro
  build` (it carries the Zod frontmatter schema) and the `vitest` content suite, all three BLOCKING. The
  gate does NOT check timeline drift: `timeline-from-git.py` scans all of `~/projects`, so another repo's
  commits stale `timeline.json` and the report was noise. Run `make timeline` when the spine matters and
  commit the regen on its own. `make` with no argument lists every target; `dev`/`build`/`preview` are
  real as of inc3. Never gate a commit on `cmd | tail` — the pipe reports tail's exit status.
- **Every new assertion owes a mutate-and-confirm-red demo** before a stage is called verified — including
  the content tests (evidence rule, banned words): a check that cannot fail proves nothing.
- **Token budget is the binding resource.** Thin increments (≤1 session, visible on GitHub the same day);
  bulk reads (OneNote digests, crash-dash `.md` sweeps) go to a sub-agent; only its brief returns.
- Stay on `main`; release with `make ship` (gate against a HEAD copy + push HEAD — uncommitted work is
  ignored, never a blocker). **The push IS the deploy** — Vercel's git integration publishes every push to `main` once the repo is imported; there is no `vercel`
  CLI call and no second build. A green push is not a green site. No worktrees unless asked. Public
  repo — never commit `sources/`, `.env*`, or anything naming a colleague or a private deployment URL.

## Rules

Path-gated conventions live in `.claude/rules/`, each auto-loaded by its own `paths:` frontmatter
(`plan-hygiene.md` on `docs/**/*.md`, `content-writing.md` on `content/**/*.md`, `dev-workflow.md` on
`src/**`, the Astro/vitest configs and the `Makefile`, `testing-project.md` on `tests/**/*.test.ts`). Global rules in
`~/.claude/rules/` (prose budget, instruction-file discipline, testing, large-file reads) fire here too.
