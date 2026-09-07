# ai-coding-journey — markdown-first knowledge base. The Makefile is the single
# memorable entry point for the repo's verification gate; CLAUDE.md points at
# `make check` as the one gate to run once per step.
#
# House style is shared with ~/projects/crash-dash and ~/projects/dotfiles: the
# help listing is GENERATED from the `## ` doc comment on each target line, so a
# new target documents itself by carrying one.

ASTRO := node_modules/.bin/astro
MDLINT := node_modules/.bin/markdownlint-cli2
VITEST := node_modules/.bin/vitest

# `make` with no argument lists the targets. Set explicitly — make otherwise
# takes the FIRST target it reads (help, here) only by accident of ordering, and
# the shared include at the bottom must not be able to steal the default goal.
.DEFAULT_GOAL := help

.PHONY: help check lint site test timeline measurements ship dev build preview

help: ## show this list of targets
	@printf 'Usage: make <target>\n\n'
	@grep -hE '^[a-zA-Z][a-zA-Z0-9_.-]*:.*## ' $(MAKEFILE_LIST) \
	  | sed -E 's/^([^:]+):.*## /\1\t/' \
	  | awk -F'\t' '{printf "  %-10s %s\n", $$1, $$2}'
	@printf '\nFrom the shared include ($(HOME)/.config/make/worktree.mk), run from anywhere:\n'
	@printf '  %-10s %s\n' \
	  syncwt   'rebase the linked worktree, run the gate, ff-merge it into the primary' \
	  commit   'make commit <message...>  — stage all + commit on the current branch' \
	  commitwt 'same, but in the linked worktree'

# THE gate (CLAUDE.md: "one verification gate, run once per step").
# Three parts, all blocking:
#   1. markdownlint-cli2 over every .md — BLOCKS (exit non-zero on a violation).
#   2. astro build — BLOCKS. It carries the Zod frontmatter gate: a bad `stage`
#      enum, a string `commits` or an out-of-enum `artifact` fails the build.
#   3. the vitest content suite — BLOCKS. The executable half of the two content
#      rules: `artifact: present` must have a body under `## Artifact`, every
#      chapter needs `## What didn't work`, and no content file may use the
#      banned vocabulary. It also mirror-checks the two hand-copied constants
#      (the banned list against content-writing.md, MIN_COMMITS against the
#      generator), so a divergence reds instead of rotting quietly.
# There is deliberately NO timeline drift probe here. It ran the generator on
# every gate to compare-and-restore, and the answer was almost always drift the
# repo could do nothing about: timeline-from-git.py scans all of ~/projects, so
# another repo's commits staled content/timeline.json and printed a diff nobody
# was meant to act on. `make timeline` regenerates on demand; that is the whole
# mechanism now.
check: ## THE gate: markdownlint + astro build + vitest, all blocking
	@$(MAKE) --no-print-directory lint
	@$(MAKE) --no-print-directory site
	@$(MAKE) --no-print-directory test

# The release: refuse a dirty tree, run THE gate, push. The push IS the deploy —
# Vercel's git integration builds and publishes every push to `main` once the
# repo is imported on vercel.com (README §Deploying it). There is deliberately no
# `vercel deploy` CLI call here: it would be a SECOND publish of the same commit,
# it needs a linked .vercel/ and an authenticated CLI that a fresh clone does not
# have, and it would bypass the build Vercel runs anyway.
#
# No separate build step either — `check` already runs `astro build` (see the
# `site` target), so dist/ is proven green before the push. A second build would
# verify nothing the gate did not.
#
# ⚠ Until the repo is imported on vercel.com, a push publishes nothing but the
# GitHub-rendered markdown. Confirm the deployment after a release; a green push
# is not a green site.
ship: ## the release: clean tree + make check (builds dist/) + push — the push is the Vercel deploy
	@[ -z "$$(git status --porcelain)" ] || { \
	  echo "error: working tree dirty — commit or stash before shipping" >&2; \
	  git status --short >&2; exit 1; }
	@$(MAKE) --no-print-directory check
	git push

# markdownlint-cli2 reads .markdownlint-cli2.jsonc for both rules and ignores
# (node_modules, sources, docs/plans/archive, .claude) — never re-list them here.
lint: ## run markdownlint-cli2 over every .md
	@[ -x $(MDLINT) ] || { echo "error: markdownlint-cli2 missing — run 'npm install'" >&2; exit 1; }
	@$(MDLINT) "**/*.md" && printf 'markdownlint ......... ok\n'

# The blocking half of the gate that the Zod schema rides on. Output is silenced
# on success and replayed in full on failure — never piped, so the exit status
# stays astro's own.
site: ## build the Astro site quietly; print the log only if it fails
	@[ -x $(ASTRO) ] || { echo "error: astro missing — run 'npm install'" >&2; exit 1; }
	@out=$$($(ASTRO) build 2>&1) || { printf 'astro build .......... FAILED\n'; printf '%s\n' "$$out"; exit 1; }
	@printf 'astro build .......... ok\n'

# The content suite, runnable on its own. `check` calls this target — it is an
# alias for convenience, never a second gate. Never piped: the exit status must
# stay vitest's own.
test: ## run the vitest content suite (evidence + anti-hype assertions)
	@[ -x $(VITEST) ] || { echo "error: vitest missing — run 'npm install'" >&2; exit 1; }
	@$(VITEST) run --reporter dot

# Regenerate the generated content: timeline.json, the journey index, and any
# missing chapter stubs. Writes into the tree — review and commit the result.
timeline: ## regenerate content/timeline.json + the journey index from git
	@python3 scripts/timeline-from-git.py

# Regenerate content/measurements/data/eras.json. Same contract as `timeline`, and
# deliberately NOT part of `make check` for the same reason: these generators read
# moving sources outside this repo (another repo's git history, and later the log
# trees), so a drift probe in the gate would report drift the repo cannot act on.
# Run it on demand and commit the regenerated JSON on its own.
#
# Each era's generator registers here as its stage lands; the git spine runs first
# because every log-derived range is cross-checked against it.
measurements: ## regenerate content/measurements/data/eras.json from git + the log corpora
	@python3 scripts/measurements-git.py
	@python3 scripts/measurements-cc.py

# ── Astro site ──
# The npm scripts these delegate to are real as of inc3 Stage 1. The guard now
# only catches a missing `npm install`, not a missing site.
dev: ## start the Astro dev server on localhost:4321
	@[ -x $(ASTRO) ] || { echo "error: astro missing — run 'npm install'" >&2; exit 1; }
	npm run dev

build: ## build the Astro site into dist/ (verbose; `make check` runs it quietly)
	@[ -x $(ASTRO) ] || { echo "error: astro missing — run 'npm install'" >&2; exit 1; }
	npm run build

preview: ## serve the built dist/ locally
	@[ -x $(ASTRO) ] || { echo "error: astro missing — run 'npm install'" >&2; exit 1; }
	npm run preview

# Shared worktree targets (syncwt/commit/commitwt), same include both sibling
# repos carry. `-include` so a machine without it still runs everything above.
-include $(HOME)/.config/make/worktree.mk
