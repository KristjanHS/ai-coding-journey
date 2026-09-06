#!/usr/bin/env bash
# Pull the exporter's output from the Windows side into the repo's gitignored
# sources/onenote/ tree, then report what arrived and prove nothing leaked into
# git. Run from anywhere; paths are resolved from the script's own location.
#
#   ./import-from-windows.sh [win-out-dir]   default: /mnt/c/onenote-export/out
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
SRC="${1:-/mnt/c/onenote-export/out}"
DEST="$REPO/sources/onenote"

if [[ ! -d "$SRC" ]]; then
  echo "ERROR: no export found at $SRC" >&2
  echo "Run 3-export-section.bat / 4-export-page.bat / 5-export-all.bat on the Windows side first." >&2
  exit 1
fi

mkdir -p "$DEST"
cp -r "$SRC/." "$DEST/"
echo "Imported $SRC -> $DEST"
echo

echo "=== markdown files now under sources/onenote/ ==="
find "$DEST" -name '*.md' -printf '%P\n' | sort
echo

cat <<'EOF'
=== next: name them so the chapter mapping is unambiguous ===
PRIMARY shape   -- stem identical to the chapter file, flat:
  sources/onenote/01-hands-on-llm.md
  sources/onenote/02-kri-local-rag.md
  sources/onenote/13-crash-dash.md
FALLBACK shape  -- keep the page's own name, let the folder carry the mapping:
  sources/onenote/hands-on-llm/<page>.md
Either is accepted by scripts/digest-repo.sh (inc2 Stage 1).
EOF
echo

# sources/ is gitignored; if this prints anything, the ignore rule broke.
echo "=== git must stay clean (anything listed below is a leak) ==="
git -C "$REPO" status --short
echo "(no lines above = correct)"
