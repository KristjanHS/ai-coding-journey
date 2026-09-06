#!/usr/bin/env bash
# Per-repo digest for sub-agent briefs: paths and labels to stdout, never file bodies.
# Usage: scripts/digest-repo.sh <repo>
set -euo pipefail

REPO_NAME="${1:-}"
[ -n "$REPO_NAME" ] || { echo "usage: $0 <repo>" >&2; exit 2; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMELINE="$ROOT/content/timeline.json"
SRC="$ROOT/sources/onenote"
WORK="$HOME/projects/$REPO_NAME"

# A repo absent from timeline.json is not a chapter subject.
if ! python3 -c "
import json,sys
rows=json.load(open('$TIMELINE'))
sys.exit(0 if any(r.get('repo')=='$REPO_NAME' for r in rows) else 1)
"; then
  echo "ERROR: '$REPO_NAME' is not in content/timeline.json" >&2
  exit 1
fi

label() {  # first ATX heading, else frontmatter description, else "(no heading)"
  local f="$1" l
  l=$(grep -m1 -E '^#{1,2} ' "$f" 2>/dev/null | sed -E 's/^#+ *//' || true)
  [ -n "$l" ] || l=$(grep -m1 -E '^description: *' "$f" 2>/dev/null | sed -E 's/^description: *//' || true)
  printf '%s' "${l:-(no heading)}" | cut -c1-90
}

inventory() {  # $1 = dir or file, $2 = section title
  local target="$1" title="$2" found=0
  [ -e "$target" ] || return 0
  echo "$title"
  while IFS= read -r f; do
    printf '  %s — %s\n' "${f#"$HOME"/projects/}" "$(label "$f")"
    found=1
  done < <(find "$target" -name '*.md' -type f 2>/dev/null | sort)
  [ "$found" -eq 1 ] || echo "  (none)"
  echo
}

echo "=== repo: $REPO_NAME ==="
if [ -d "$WORK/.git" ]; then
  echo "first commit : $(git -C "$WORK" log --reverse --format=%ad --date=short | head -1)"
  echo "last commit  : $(git -C "$WORK" log -1 --format=%ad --date=short)"
  echo "commits      : $(git -C "$WORK" rev-list --count HEAD)"
else
  echo "WARNING: no git checkout at $WORK"
fi
echo

echo "=== .md layer (paths + labels, no bodies) ==="
inventory "$WORK/CLAUDE.md"        "-- CLAUDE.md --"
inventory "$WORK/.claude/rules"    "-- .claude/rules/ --"
inventory "$WORK/.claude/skills"   "-- .claude/skills/ --"
inventory "$WORK/docs/plans"       "-- docs/plans/ (incl archive/) --"

echo "=== candidate artifact sources ==="
echo "-- commit subjects matching fix|review --"
if [ -d "$WORK/.git" ]; then
  # `| head -20 || echo` fired the fallback AFTER 20 real lines: head closes the pipe,
  # the upstream dies on SIGPIPE, and pipefail propagates 141. `sed -n 1,20p` drains
  # its input instead of closing early, so nothing upstream ever sees SIGPIPE.
  hits=$(git -C "$WORK" log --oneline --all | { grep -iE '\b(fix|review)' || true; } | sed -n '1,20p')
  if [ -n "$hits" ]; then echo "$hits"; else echo "  (none)"; fi
else
  echo "  (no checkout)"
fi
echo

echo "=== OneNote input ==="
found=0
for ext in docx md; do
  for f in "$SRC"/[0-9][0-9]-"$REPO_NAME".$ext "$SRC"/[0-9][0-9]-"$REPO_NAME"-[0-9].$ext; do
    [ -e "$f" ] && { echo "  ${f#"$ROOT"/}"; found=1; }
  done
done
if [ -d "$SRC/$REPO_NAME" ]; then
  # `find | sed && found=1` sets found even on no output (sed exits 0) — an empty
  # fallback dir would then suppress the ABSENT marker silently. Guard on content.
  fallback=$(find "$SRC/$REPO_NAME" -type f | sed "s|^$ROOT/|  |")
  [ -n "$fallback" ] && { echo "$fallback"; found=1; } || true
fi
if [ "$found" -eq 0 ] && [ -f "$ROOT/scripts/onenote-map.tsv" ]; then
  # Neither Stage 0 shape matched. Resolve via the page-title map instead.
  while IFS=$'\t' read -r page repo basis; do
    case "$page" in \#*|"") continue;; esac
    [ "$repo" = "$REPO_NAME" ] || continue
    hit=$(find "$SRC" -type f -name "$page" 2>/dev/null | head -1)
    if [ -n "$hit" ]; then
      case "$basis" in \?*) mark="[unconfirmed]";; *) mark="[mapped]";; esac
      echo "  $mark ${hit#"$ROOT"/}"
      echo "           basis: ${basis#? }"
      found=1
    else
      echo "  MISSING — map names '$page' but it is not in the export"
    fi
  done < "$ROOT/scripts/onenote-map.tsv"
fi
[ "$found" -eq 1 ] || echo "  ABSENT — no OneNote export found for '$REPO_NAME'"
