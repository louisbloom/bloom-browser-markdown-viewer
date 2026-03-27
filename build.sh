#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

usage() {
    echo "Usage: $0 [--sign] [--dev] [--test] [--format]"
    echo ""
    echo "  (no args)   Build the extension to dist/"
    echo "  --sign      Build + sign via AMO API (produces .xpi in web-ext-artifacts/)"
    echo "  --dev       Build + launch Firefox with the extension loaded"
    echo "  --test      Build + run tests"
    echo "  --format    Format source files with Prettier"
    exit 1
}

do_build() {
    npm install --silent
    node esbuild.config.mjs
}

ACTION=""
for arg in "$@"; do
    case "$arg" in
        --sign) ACTION="sign" ;;
        --dev)  ACTION="dev" ;;
        --test) ACTION="test" ;;
        --format) ACTION="format" ;;
        -h|--help) usage ;;
        *) echo "Unknown option: $arg"; usage ;;
    esac
done

if [ "$ACTION" = "format" ]; then
    npx prettier --write 'src/**/*.{js,css}' 'tests/**/*.js' '*.mjs' '*.md' 'tests/**/*.md'
    exit 0
fi

do_build

case "$ACTION" in
    sign)
        if [ -z "${AMO_JWT_ISSUER:-}" ] || [ -z "${AMO_JWT_SECRET:-}" ]; then
            echo "Error: AMO_JWT_ISSUER and AMO_JWT_SECRET must be set."
            echo ""
            echo "Get your API credentials at:"
            echo "  https://addons.mozilla.org/developers/addon/api/key/"
            echo ""
            echo "Then export them:"
            echo "  export AMO_JWT_ISSUER=\"user:12345:678\""
            echo "  export AMO_JWT_SECRET=\"your-secret-here\""
            exit 1
        fi
        npx web-ext sign \
            --source-dir dist/ \
            --channel unlisted \
            --api-key "$AMO_JWT_ISSUER" \
            --api-secret "$AMO_JWT_SECRET"
        echo ""
        echo "Signed .xpi is in web-ext-artifacts/"
        echo "Run ./install.sh to install it."
        ;;
    dev)
        npx web-ext run --source-dir dist/
        ;;
    test)
        npx vitest run
        ;;
    "")
        echo "Build complete. Extension files are in dist/"
        echo ""
        echo "Next steps:"
        echo "  ./build.sh --dev    Launch Firefox with the extension"
        echo "  ./build.sh --sign   Sign for permanent installation"
        echo "  ./build.sh --test   Run tests"
        ;;
esac
