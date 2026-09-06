# ai-coding-journey — Claude instructions

Public, **markdown-first** knowledge base of one person's journey from a 20-year coding pause to shipping
a ~5k-commit app with AI coding agents. The markdown under `content/` IS the product (readable on GitHub
as-is); an Astro site on Vercel (from inc3) renders it as a browsable journey, a web-native lecture deck
(TalTech, 19 Nov 2026) and, later, interactive explorers. Long horizon: a book from the same files.

## Where things live
- **Living spec** (north star, binding constraints, increment backlog, shipped log, open calls):
  `2026-09-06-journey-design.md` (docs/plans/). Read it before any content or design change; it is the
  single source of the *evidence rule* and the *anti-hype rule*. Never inline build detail there — each
  increment gets a thin `docs/plans/YYYY-MM-DD-<inc>-spec.md`, run via `/qimpag`, then `git mv`'d to
  `docs/plans/archive/` on ship.
- `content/journey/NN-<repo>.md` — one chapter per repo · `content/prompts/` — sanitised reusable prompts ·
  `content/case-study/crash-dash/` — sanitised `.md` layer of a private repo · `content/course/` — course
  skeleton · `content/timeline.json` — **generated** by `scripts/timeline-from-git.py`, never hand-edited.
- `sources/` — gitignored OneNote exports (`.docx` per page) + pandoc output. Read via a cheap sub-agent
  brief, never whole files into the main session.

**Writable `.md` targets** — `content/**`, `docs/plans/**`, `README.md`, `CLAUDE.md`; admission rows per
target → `.claude/rules/content-writing.md`. `docs/plans/archive/**` is read-only.

## Workflow
- **Evidence over tone.** A chapter ships only with ≥1 artifact block (prompt / rule excerpt / defect a
  reviewer caught / measured number) and a *What didn't work* line. Banned vocabulary and the sceptic
  review gate → `content-writing.md`. A claim about a private repo names the lesson, never code, live
  links or colleagues.
- **One verification gate, run once per step** (from inc3: `npm run check`; until then `python3
  scripts/timeline-from-git.py` must regenerate `timeline.json` + the journey index byte-identically).
  Never gate a commit on `cmd | tail` — the pipe reports tail's exit status.
- **Every new assertion owes a mutate-and-confirm-red demo** before a stage is called verified — including
  the content tests (evidence rule, banned words): a check that cannot fail proves nothing.
- **Token budget is the binding resource.** Thin increments (≤1 session, visible on GitHub the same day);
  bulk reads (OneNote digests, crash-dash `.md` sweeps) go to a sub-agent; only its brief returns.
- Stay on `main`; no worktrees unless asked. Public repo — never commit `sources/`, `.env*`, or anything
  naming a colleague or a private deployment URL.

## Rules
Path-gated conventions live in `.claude/rules/`, each auto-loaded by its own `paths:` frontmatter
(`plan-hygiene.md` on `docs/**/*.md`, `content-writing.md` on `content/**/*.md`). Global rules in
`~/.claude/rules/` (prose budget, instruction-file discipline, testing, large-file reads) fire here too.
