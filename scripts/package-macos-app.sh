#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${TR_COWORK_MACOS_OUTPUT_DIR:-$ROOT_DIR/.build/macos-release}"
VERSION="${TR_COWORK_BUILD_VERSION:-$(node -p "require('$ROOT_DIR/packages/coding-agent/package.json').version")}"
BUILD_NUMBER="${TR_COWORK_BUILD_NUMBER:-1}"
SIGN_IDENTITY="${APPLE_DEVELOPER_ID_APPLICATION_IDENTITY:-}"
NOTARY_KEY_PATH="${APPLE_NOTARY_PRIVATE_KEY_PATH:-}"
NOTARY_KEY_ID="${APPLE_NOTARY_KEY_ID:-}"
NOTARY_ISSUER_ID="${APPLE_NOTARY_ISSUER_ID:-}"

if [[ "$(uname -s)" != "Darwin" ]]; then
	echo "package-macos-app.sh must run on macOS." >&2
	exit 2
fi
if [[ -z "$SIGN_IDENTITY" ]]; then
	echo "APPLE_DEVELOPER_ID_APPLICATION_IDENTITY is required; refusing to publish an unsigned app." >&2
	exit 2
fi
if [[ -z "$NOTARY_KEY_PATH" || -z "$NOTARY_KEY_ID" || -z "$NOTARY_ISSUER_ID" ]]; then
	echo "Apple notary key path, key ID, and issuer ID are required." >&2
	exit 2
fi

WORK_DIR="$(mktemp -d)"
export CLANG_MODULE_CACHE_PATH="$WORK_DIR/clang-module-cache"
cleanup() {
	rm -rf "$WORK_DIR"
}
trap cleanup EXIT

ARM_RELEASE="$WORK_DIR/release-arm64"
X64_RELEASE="$WORK_DIR/release-x64"
APP_NAME="TR Confidential Cowork"
APP_BUNDLE="$OUTPUT_DIR/$APP_NAME.app"
APP_CONTENTS="$APP_BUNDLE/Contents"
APP_RESOURCES="$APP_CONTENTS/Resources"
APP_MACOS="$APP_CONTENTS/MacOS"
DMG_PATH="$OUTPUT_DIR/TR-Confidential-Cowork-macOS-universal.dmg"
ZIP_PATH="$WORK_DIR/TR-Confidential-Cowork-macOS-universal.zip"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "==> Building Apple Silicon runtime"
"$ROOT_DIR/scripts/build-binaries.sh" \
	--skip-install \
	--skip-build \
	--offline-model-data \
	--platform darwin-arm64 \
	--out "$ARM_RELEASE"

echo "==> Building Intel runtime"
"$ROOT_DIR/scripts/build-binaries.sh" \
	--skip-install \
	--skip-deps \
	--skip-build \
	--offline-model-data \
	--platform darwin-x64 \
	--out "$X64_RELEASE"

mkdir -p "$APP_MACOS" "$APP_RESOURCES/bin"

echo "==> Assembling universal CLI"
lipo -create \
	"$ARM_RELEASE/darwin-arm64/tr-cowork" \
	"$X64_RELEASE/darwin-x64/tr-cowork" \
	-output "$APP_RESOURCES/bin/tr-cowork"
chmod 755 "$APP_RESOURCES/bin/tr-cowork"

for resource in package.json README.md CHANGELOG.md LICENSE photon_rs_bg.wasm theme assets export-html docs examples node_modules native; do
	if [[ -e "$ARM_RELEASE/darwin-arm64/$resource" ]]; then
		cp -R "$ARM_RELEASE/darwin-arm64/$resource" "$APP_RESOURCES/"
	fi
done

# Add the Intel helpers beside the Apple Silicon helpers. Runtime resolution
# selects the matching architecture, so neither architecture loads foreign code.
mkdir -p "$APP_RESOURCES/native/darwin/prebuilds/darwin-x64"
cp "$X64_RELEASE/darwin-x64/native/darwin/prebuilds/darwin-x64/darwin-modifiers.node" \
	"$APP_RESOURCES/native/darwin/prebuilds/darwin-x64/"
cp "$X64_RELEASE/darwin-x64/node_modules/@mariozechner/clipboard/clipboard.darwin-x64.node" \
	"$APP_RESOURCES/node_modules/@mariozechner/clipboard/"

echo "==> Building native launcher"
swiftc -target arm64-apple-macos13 \
	"$ROOT_DIR/scripts/macos/TRConfidentialCoworkLauncher.swift" \
	-o "$WORK_DIR/launcher-arm64"
swiftc -target x86_64-apple-macos13 \
	"$ROOT_DIR/scripts/macos/TRConfidentialCoworkLauncher.swift" \
	-o "$WORK_DIR/launcher-x64"
lipo -create "$WORK_DIR/launcher-arm64" "$WORK_DIR/launcher-x64" -output "$APP_MACOS/$APP_NAME"
chmod 755 "$APP_MACOS/$APP_NAME"

cat > "$APP_CONTENTS/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key><string>en</string>
	<key>CFBundleDisplayName</key><string>$APP_NAME</string>
	<key>CFBundleExecutable</key><string>$APP_NAME</string>
	<key>CFBundleIconFile</key><string>AppIcon</string>
	<key>CFBundleIdentifier</key><string>com.lorehex.trustedrouter.confidential-cowork</string>
	<key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
	<key>CFBundleName</key><string>$APP_NAME</string>
	<key>CFBundlePackageType</key><string>APPL</string>
	<key>CFBundleShortVersionString</key><string>$VERSION</string>
	<key>CFBundleVersion</key><string>$BUILD_NUMBER</string>
	<key>LSMinimumSystemVersion</key><string>13.0</string>
	<key>LSUIElement</key><true/>
	<key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST
plutil -lint "$APP_CONTENTS/Info.plist"

ICONSET="$WORK_DIR/AppIcon.iconset"
mkdir -p "$ICONSET"
for size in 16 32 128 256 512; do
	sips -z "$size" "$size" "$ROOT_DIR/scripts/macos/TRConfidentialCoworkIcon.png" \
		--out "$ICONSET/icon_${size}x${size}.png" >/dev/null
	double=$((size * 2))
	sips -z "$double" "$double" "$ROOT_DIR/scripts/macos/TRConfidentialCoworkIcon.png" \
		--out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$APP_RESOURCES/AppIcon.icns"

echo "==> Signing nested code and app"
while IFS= read -r code_path; do
	codesign --force --timestamp --options runtime --sign "$SIGN_IDENTITY" "$code_path"
done < <(find "$APP_RESOURCES" -type f \( -name '*.node' -o -name 'tr-cowork' \) -print | sort)
codesign --force --timestamp --options runtime --sign "$SIGN_IDENTITY" "$APP_MACOS/$APP_NAME"
codesign --force --timestamp --options runtime --sign "$SIGN_IDENTITY" "$APP_BUNDLE"
codesign --verify --deep --strict --verbose=2 "$APP_BUNDLE"

echo "==> Notarizing app"
ditto -c -k --keepParent "$APP_BUNDLE" "$ZIP_PATH"
xcrun notarytool submit "$ZIP_PATH" \
	--key "$NOTARY_KEY_PATH" \
	--key-id "$NOTARY_KEY_ID" \
	--issuer "$NOTARY_ISSUER_ID" \
	--wait
xcrun stapler staple "$APP_BUNDLE"
xcrun stapler validate "$APP_BUNDLE"

echo "==> Creating, signing, and notarizing DMG"
hdiutil create -quiet -fs HFS+ -volname "$APP_NAME" -srcfolder "$APP_BUNDLE" "$DMG_PATH"
codesign --force --timestamp --sign "$SIGN_IDENTITY" "$DMG_PATH"
xcrun notarytool submit "$DMG_PATH" \
	--key "$NOTARY_KEY_PATH" \
	--key-id "$NOTARY_KEY_ID" \
	--issuer "$NOTARY_ISSUER_ID" \
	--wait
xcrun stapler staple "$DMG_PATH"
xcrun stapler validate "$DMG_PATH"

codesign --verify --deep --strict --verbose=2 "$APP_BUNDLE"
spctl --assess --type execute --verbose=2 "$APP_BUNDLE"
spctl --assess --type open --context context:primary-signature --verbose=2 "$DMG_PATH"
shasum -a 256 "$DMG_PATH" > "$DMG_PATH.sha256"

echo "$DMG_PATH"
