#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

EXTENSION_ID="bloom-markdown-viewer@firefox.local"
DIST_DIR="$(pwd)/dist"
ARTIFACTS_DIR="$(pwd)/web-ext-artifacts"

# Find signed .xpi (prefer signed over unsigned)
XPI_FILE=""
if [ -d "$ARTIFACTS_DIR" ]; then
    XPI_FILE=$(find "$ARTIFACTS_DIR" -name '*.xpi' -type f -printf '%T@ %p\n' 2>/dev/null \
        | sort -rn | head -1 | cut -d' ' -f2-)
fi

if [ -n "$XPI_FILE" ]; then
    INSTALL_MODE="signed"
elif [ -f "$DIST_DIR/manifest.json" ]; then
    INSTALL_MODE="unsigned"
else
    echo "Error: No extension found. Run ./build.sh first."
    echo "  For signed install: ./build.sh --sign"
    echo "  For unsigned (dev):  ./build.sh"
    exit 1
fi

# Find Firefox profile directory
PROFILES_DIR="$HOME/.mozilla/firefox"
if [ ! -d "$PROFILES_DIR" ]; then
    echo "Error: Firefox profiles directory not found at $PROFILES_DIR"
    exit 1
fi

# Parse profiles.ini to find the default-release profile
PROFILE_PATH=""
while IFS='=' read -r key value; do
    key=$(echo "$key" | tr -d '[:space:]')
    if [ "$key" = "Default" ] && [ -n "$value" ] && [ -d "$PROFILES_DIR/$value" ]; then
        PROFILE_PATH="$PROFILES_DIR/$value"
        break
    fi
done < <(grep -A2 '^\[Install' "$PROFILES_DIR/profiles.ini" 2>/dev/null | grep '^Default=')

# Fallback: look for *.default-release profile
if [ -z "$PROFILE_PATH" ]; then
    PROFILE_PATH=$(find "$PROFILES_DIR" -maxdepth 1 -name "*.default-release" -type d | head -1)
fi

if [ -z "$PROFILE_PATH" ]; then
    echo "Error: Could not determine Firefox profile directory."
    echo ""
    echo "Manual install:"
    if [ "$INSTALL_MODE" = "signed" ]; then
        echo "  cp '$XPI_FILE' ~/.mozilla/firefox/YOUR_PROFILE/extensions/$EXTENSION_ID.xpi"
    else
        echo "  echo '$DIST_DIR' > ~/.mozilla/firefox/YOUR_PROFILE/extensions/$EXTENSION_ID"
    fi
    exit 1
fi

EXTENSIONS_DIR="$PROFILE_PATH/extensions"
mkdir -p "$EXTENSIONS_DIR"

if [ "$INSTALL_MODE" = "signed" ]; then
    cp "$XPI_FILE" "$EXTENSIONS_DIR/$EXTENSION_ID.xpi"
    echo "Installed signed extension:"
    echo "  $XPI_FILE"
    echo "  -> $EXTENSIONS_DIR/$EXTENSION_ID.xpi"
    echo ""
    echo "Restart Firefox. If prompted, choose to enable the extension."
else
    echo "$DIST_DIR" > "$EXTENSIONS_DIR/$EXTENSION_ID"
    echo "Installed unsigned extension (proxy file):"
    echo "  $EXTENSIONS_DIR/$EXTENSION_ID -> $DIST_DIR"
    echo ""
    echo "NOTE: Release Firefox enforces extension signing. Unsigned extensions"
    echo "only work on Firefox Developer Edition, Nightly, or ESR with:"
    echo "  about:config -> xpinstall.signatures.required = false"
    echo ""
    echo "For release Firefox, run: ./build.sh --sign"
fi
