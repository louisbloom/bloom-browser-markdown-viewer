#!/usr/bin/env bash
set -euo pipefail

EXTENSION_ID="bloom-markdown-viewer@firefox.local"
PROFILES_DIR="$HOME/.mozilla/firefox"

found=0

# Remove from all profiles
for dir in "$PROFILES_DIR"/*/extensions; do
    [ -d "$dir" ] || continue

    # Remove signed .xpi
    if [ -f "$dir/$EXTENSION_ID.xpi" ]; then
        rm "$dir/$EXTENSION_ID.xpi"
        echo "Removed: $dir/$EXTENSION_ID.xpi"
        found=1
    fi

    # Remove unsigned proxy file
    if [ -f "$dir/$EXTENSION_ID" ]; then
        rm "$dir/$EXTENSION_ID"
        echo "Removed: $dir/$EXTENSION_ID"
        found=1
    fi
done

if [ "$found" -eq 0 ]; then
    echo "Extension not found in any Firefox profile."
else
    echo ""
    echo "Uninstall complete. Restart Firefox."
fi
