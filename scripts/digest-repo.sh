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
  git -C "$WORK" log --oneline --all | grep -iE '\b(fix|review)' | head -20 || echo "  (none)"
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
  find "$SRC/$REPO_NAME" -type f | sed "s|^$ROOT/|  |" && found=1
fi
if [ "$found" -eq 0 ] && [ -d "$SRC" ]; then
  # Neither Stage 0 shape matched; fall back to a filename keyword scan of the export tree.
  while IFS= read -r f; do
    echo "  [loose match] ${f#"$ROOT"/}"; found=1
  done < <(find "$SRC" -type f -iname "*${REPO_NAME//-/*}*" 2>/dev/null | sort)
fi
[ "$found" -eq 1 ] || echo "  ABSENT — no OneNote export found for '$REPO_NAME'"
