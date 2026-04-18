#!/usr/bin/env bash
# Run this ONCE after `docker compose up` to install language runtimes into Piston.
# Usage: bash install-runtimes.sh

set -e

PISTON_URL="${PISTON_URL:-http://localhost:2000}"

echo "⏳ Waiting for Piston to be ready at $PISTON_URL ..."
for i in $(seq 1 30); do
  if curl -sf "$PISTON_URL/api/v2/runtimes" > /dev/null 2>&1; then
    echo "✅ Piston is up."
    break
  fi
  echo "   ($i/30) Not ready yet, retrying in 3s..."
  sleep 3
done

install_runtime() {
  local LANG=$1
  local VER=$2
  echo ""
  echo "📦 Installing $LANG $VER ..."
  curl -sf -X POST "$PISTON_URL/api/v2/packages" \
    -H "Content-Type: application/json" \
    -d "{\"language\": \"$LANG\", \"version\": \"$VER\"}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('   ✓', d.get('language','?'), d.get('version','?'), 'installed')" \
    || echo "   ⚠ Failed to install $LANG $VER — check Piston logs with: docker logs piston"
}

install_runtime "python"     "3.10.0"
install_runtime "javascript" "18.15.0"
install_runtime "java"       "15.0.2"
install_runtime "c++"        "10.2.0"

echo ""
echo "🎉 All runtimes installed. Available runtimes:"
curl -sf "$PISTON_URL/api/v2/runtimes" | python3 -c "
import sys, json
rts = json.load(sys.stdin)
for r in rts:
    print(f\"   {r['language']} {r['version']}\")
"
