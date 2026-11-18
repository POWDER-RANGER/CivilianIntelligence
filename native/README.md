# CIVINTELLIGENCE native clients — initial engineering scaffold

Desktop: Tauri 2 (Windows, macOS, Linux). Mobile: Capacitor 8 (Android, iOS).
The current app is SSR-backed TanStack Start; it is **not** a standalone static frontend.
These are connected native WebView prototypes pointing at the existing Render website.
The mobile `server.url` configuration is for **development/testing only**, not App Store / Play Store distribution.
Before store release, create a locally bundled native frontend and audited API/auth bridge.
No native IPC capabilities are granted to remote web content.

Android external-browser popup dispatch now validates URLs using a strict, JVM-testable HTTPS policy. CI runs `testDebugUnitTest` before accepting the debug APK. This is not an OAuth callback implementation: no deep-link callback or token exchange is registered. The debug APK remains unsuitable for production distribution.

Desktop on Windows requires Rust 1.90 or later with the MSVC target:
  cd native/desktop
  npm ci
  npm run desktop:build -- --bundles nsis

Android debug builds require JDK 21 and Android SDK Platform 36.
Set JAVA_HOME and ANDROID_HOME to those installations:
  cd native/desktop
  npm ci
  npm run mobile:sync -- android
  cd android
  .\gradlew.bat --no-daemon assembleDebug

iOS development requires macOS and Xcode:
  cd native/desktop
  npm ci
  npx cap add ios

Do not ship or submit these prototypes as store-ready applications.

## Five-platform CI builds

GitHub Actions workflow: `.github/workflows/native-build.yml`.
Trigger it through pull requests changing `native/` or manually with workflow dispatch.
Every job uploads a build artifact if successful:

- Windows: unsigned NSIS installer (`civintelligence-windows-nsis`)
- Linux: unsigned DEB and AppImage (`civintelligence-linux`)
- macOS: unsigned/unnotarized DMG (`civintelligence-macos`)
- Android: development-signed debug APK (`civintelligence-android-debug`)
- iOS: unsigned **simulator-only** application (`civintelligence-ios-simulator`)

The artifact inventory now checks native package headers (PE, ELF, Debian archive, UDIF) and APK/iOS ZIP structure before hashing. This catches mislabeled or corrupt files; it does **not** verify code signatures, notarization, provenance of downloaded dependencies, runtime functionality or store approval.

A successful compile does not mean store approval or production readiness.
Native OAuth and deep-link callbacks must be validated. Android's Capacitor
`server.url` is a developer preview feature and must be replaced before store
submission with a bundled local app interface/API client. Desktop clients
currently load the live hosted website and require internet connectivity.
Public releases additionally require platform-specific signing/notarization,
permission review, real-device testing and app-store compliance.

The iOS job uses a hosted macOS runner for Xcode; it cannot produce an
installable device IPA without a valid Apple development team/profile.

## Android external-link behavior

The Android Capacitor launcher preserves the hosted CIVWATCH session inside the
app and dispatches user-initiated HTTPS `target=_blank` links to the system
browser. It does not grant the linked website native IPC permissions.

Device smoke test (November 17, 2026): Android debug APK installed on Samsung
SM-X518U via ADB; home page and ALPR map rendered; `/globe` route rendered but
its embedded viewer was blocked by the document policies on both origins.
Selecting **Open viewer separately** launched the device browser and the
independent Cesium/Esri 3D global viewer rendered imagery successfully.
This is a fallback, not an integrated offline globe. OAuth and offline
operation remain unvalidated. Do not weaken `frame-ancestors` restrictions to
force remote-origin embedding.
