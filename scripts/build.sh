#!/bin/bash

# ─── YouTube Focus — Build Script ─────────────────────────────────────────────
# Creates a zip ready for Chrome Web Store upload
# Run from anywhere: bash scripts/build.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="$ROOT/chrome"
OUT="$ROOT/youtube-focus.zip"

echo "🎯 YouTube Focus — Build"
echo "──────────────────────────"

# Remove old zip if exists
if [ -f "$OUT" ]; then
  rm "$OUT"
  echo "🗑  Removed old zip"
fi

# Check chrome folder exists
if [ ! -d "$CHROME" ]; then
  echo "❌ chrome/ folder not found at $CHROME"
  exit 1
fi

# Zip from inside chrome/
cd "$CHROME"

zip -r "$OUT" \
  manifest.json \
  background.js \
  content.js \
  content.css \
  popup/ \
  options/ \
  icons/ \
  --exclude "*.DS_Store" \
  --exclude "*/__MACOSX*"

echo "✅ Built: $OUT"
echo "📦 Contents:"
unzip -l "$OUT"
