#!/bin/bash
# Runtime backend URL injection.
# Vite bakes VITE_API_BASE_URL at build time. To allow Cloud Run env vars
# to override without rebuild, we replace the build-time placeholder
# __RUNTIME_BACKEND_URL__ in the built JS bundle with $VITE_API_BASE_URL.

set -e

BACKEND_URL="${VITE_API_BASE_URL:-http://localhost:8000}"
ASSET_DIR=/usr/share/nginx/html/assets

echo "→ Injecting backend URL: $BACKEND_URL"

if [ -d "$ASSET_DIR" ]; then
    # Find every JS file and substitute the placeholder
    find "$ASSET_DIR" -type f -name "*.js" -print0 | while IFS= read -r -d '' f; do
        if grep -q "__RUNTIME_BACKEND_URL__" "$f" 2>/dev/null; then
            sed -i "s|__RUNTIME_BACKEND_URL__|${BACKEND_URL}|g" "$f"
            echo "  patched: $f"
        fi
    done
fi

echo "→ Frontend ready on port ${PORT:-8080}"
