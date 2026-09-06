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

.PHONY: help check lint timeline dev build preview

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
#   2. a timeline drift report — NEVER blocks. timeline-from-git.py scans all of
#      ~/projects, so the committed timeline.json goes stale whenever ANOTHER
#      repo gains commits; failing on that would turn a content commit red for
#      activity that has nothing to do with this repo. Drift is printed loudly
#      and `make timeline` is the fix.
# The drift probe is tree-preserving on every exit path: it snapshots the two
# generated files, runs the script, compares, and restores them — including when
# the script itself dies mid-write. The one side effect it cannot undo is
# a NEW chapter stub (the script creates those when a repo first crosses
# MIN_COMMITS) — those are reported as untracked and deliberately left in place.
check: ## THE gate: markdownlint (blocking) + a timeline drift report (advisory)
	@$(MAKE) --no-print-directory lint
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

# markdownlint-cli2 reads .markdownlint-cli2.jsonc for both rules and ignores
# (node_modules, sources, docs/plans/archive, .claude) — never re-list them here.
lint: ## run markdownlint-cli2 over every .md
	@[ -x $(MDLINT) ] || { echo "error: markdownlint-cli2 missing — run 'npm install'" >&2; exit 1; }
	@$(MDLINT) "**/*.md" && printf 'markdownlint ......... ok\n'

# Regenerate the generated content: timeline.json, the journey index, and any
# missing chapter stubs. Writes into the tree — review and commit the result.
timeline: ## regenerate content/timeline.json + the journey index from git
	@python3 scripts/timeline-from-git.py

# ── Astro site (arrives with inc3; see docs/plans/2026-09-06-journey-design.md) ──
# These delegate to npm scripts that do not exist yet. The guard turns the
# confusing "Missing script" npm error into a statement of when they light up.
dev: ## start the Astro dev server (inc3+)
	@[ -x $(ASTRO) ] || { echo "error: no Astro site yet — it arrives with inc3" >&2; exit 1; }
	npm run dev

build: ## build the Astro site (inc3+)
	@[ -x $(ASTRO) ] || { echo "error: no Astro site yet — it arrives with inc3" >&2; exit 1; }
	npm run build

preview: ## preview the built Astro site (inc3+)
	@[ -x $(ASTRO) ] || { echo "error: no Astro site yet — it arrives with inc3" >&2; exit 1; }
	npm run preview

# Shared worktree targets (syncwt/commit/commitwt), same include both sibling
# repos carry. `-include` so a machine without it still runs everything above.
-include $(HOME)/.config/make/worktree.mk
