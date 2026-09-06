#!/usr/bin/env bash
# Step 0 (run in WSL): copy this folder to a Windows-native path so cmd.exe can
# run the .bat files. cmd.exe refuses to set its working directory to a UNC path
# such as \\wsl.localhost\..., so the .bat files CANNOT be run in place from the
# repo -- they have to live on C:.
#
#   ./install-to-windows.sh [win-dir]     default: /mnt/c/onenote-export
#
# Safe to re-run: it refreshes the .bat files and leaves tool/ and out/ alone.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${1:-/mnt/c/onenote-export}"

mkdir -p "$DEST"
cp -v "$HERE"/*.bat "$DEST/"

WINPATH="$(printf '%s' "$DEST" | sed -E 's#^/mnt/([a-z])/#\U\1:\\#; s#/#\\#g')"

cat <<EOF

Copied to: $DEST
On Windows that is: $WINPATH

Now, in a Windows terminal (or Explorer), run in order:
  1-setup.bat            install the exporter
  2-list.bat             see notebooks, sections and page IDs
  3-export-section.bat "Notebook/Section"     (or 4-export-page.bat "<PageID>")

Then come back to WSL and run:
  scripts/onenote/import-from-windows.sh
EOF
