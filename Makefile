# ai-coding-journey — markdown-first knowledge base. The Makefile is the single
# memorable entry point for the repo's verification gate; CLAUDE.md points at
# `make check` as the one gate to run once per step.
#
# House style is shared with ~/projects/crash-dash and ~/projects/dotfiles: the
# help listing is GENERATED from the `## ` doc comment on each target line, so a
# new target documents itself by carrying one.

ASTRO := node_modules/.bin/astro
MDLINT := node_modules/.bin/markdownlint-cli2

# `make` with no argument lists the targets. Set explicitly — make otherwise
# takes the FIRST target it reads (help, here) only by accident of ordering, and
# the shared include at the bottom must not be able to steal the default goal.
.DEFAULT_GOAL := help

.PHONY: help check lint site timeline ship dev build preview

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
# Two halves, both reported, lint blocking and timeline advisory:
#   1. markdownlint-cli2 over every .md — BLOCKS (exit non-zero on a violation).
#   2. astro build — BLOCKS. It carries the Zod frontmatter gate: a bad `stage`
#      enum, a string `commits` or an out-of-enum `artifact` fails the build.
#   3. a timeline drift report — NEVER blocks. timeline-from-git.py scans all of
#      ~/projects, so the committed timeline.json goes stale whenever ANOTHER
#      repo gains commits; failing on that would turn a content commit red for
#      activity that has nothing to do with this repo. Drift is printed loudly
#      and `make timeline` is the fix.
# The drift probe is tree-preserving on every exit path: it snapshots the two
# generated files, runs the script, compares, and restores them — including when
# the script itself dies mid-write. The one side effect it cannot undo is
# a NEW chapter stub (the script creates those when a repo first crosses
# MIN_COMMITS) — those are reported as untracked and deliberately left in place.
check: ## THE gate: markdownlint + astro build (blocking) + a timeline drift report (advisory)
	@$(MAKE) --no-print-directory lint
	@$(MAKE) --no-print-directory site
	@tmp=$$(mktemp -d) || exit 1; \
	restore() { cp "$$tmp/timeline.json" content/timeline.json \
	  && cp "$$tmp/README.md" content/journey/README.md; }; \
	cp content/timeline.json "$$tmp/timeline.json" || exit 1; \
	cp content/journey/README.md "$$tmp/README.md" || exit 1; \
	python3 scripts/timeline-from-git.py >/dev/null \
	  || { restore; rm -rf "$$tmp"; exit 1; }; \
	drift=0; \
	diff -q "$$tmp/timeline.json" content/timeline.json >/dev/null || drift=1; \
	diff -q "$$tmp/README.md" content/journey/README.md >/dev/null || drift=1; \
	if [ "$$drift" = 1 ]; then \
	  printf 'timeline ............. DRIFT\n'; \
	  diff -u "$$tmp/timeline.json" content/timeline.json \
	    | grep -E '^[-+][^-+]' | sed 's/^/    /'; \
	  printf "    ! run 'make timeline' and commit the regen\n"; \
	else \
	  printf 'timeline ............. ok\n'; \
	fi; \
	restore || { echo "error: could not restore the generated files from $$tmp" >&2; exit 1; }; \
	rm -rf "$$tmp"; \
	new=$$(git status --porcelain content/journey | sed -n 's/^?? //p'); \
	if [ -n "$$new" ]; then \
	  printf 'new chapter stubs .... CREATED (left in place — review and commit)\n'; \
	  printf '%s\n' "$$new" | sed 's/^/    /'; \
	fi

# The release, early form: refuse a dirty tree, run THE gate, push. There is no
# deploy step yet on purpose — GitHub renders content/ as-is, so a push IS the
# release until inc3 puts the Astro site on Vercel; that deploy joins here, after
# the push, when it exists. Drift stays advisory (see `check`): a stale
# timeline.json is a regen commit away and never blocks a content release.
ship: ## the release: clean tree + make check + git push (deploy joins at inc3)
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

# Regenerate the generated content: timeline.json, the journey index, and any
# missing chapter stubs. Writes into the tree — review and commit the result.
timeline: ## regenerate content/timeline.json + the journey index from git
	@python3 scripts/timeline-from-git.py

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
