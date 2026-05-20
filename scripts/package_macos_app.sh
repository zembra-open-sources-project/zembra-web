#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_PATH="$ROOT_DIR/src-tauri/target/release/bundle/macos/Zembra.app"
INFO_PLIST="$APP_PATH/Contents/Info.plist"

cd "$ROOT_DIR"

echo "==> Running frontend tests"
npm test

echo "==> Building frontend assets"
npm run build

echo "==> Building macOS app bundle"
if npm run tauri -- info >/dev/null 2>&1; then
  npm run tauri:build
else
  npm exec --offline --package @tauri-apps/cli@2.11.2 -- tauri build --bundles app
fi

echo "==> Verifying app bundle metadata"
test -d "$APP_PATH"
plutil -extract CFBundleIdentifier raw -o - "$INFO_PLIST" | grep -qx "com.antarxly.zembra"
plutil -extract CFBundleName raw -o - "$INFO_PLIST" | grep -qx "Zembra"

echo "==> macOS app bundle is ready:"
echo "$APP_PATH"
