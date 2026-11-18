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

## Physical Android launch smoke test

The opt-in harness `native/android_smoke.py` verifies that a selected, authorized ADB device
has the package installed, starts its main activity, and observes its activity state.
It does not validate the hosted website, OAuth, rendering, or production signing.
It refuses ambiguous multiple-device selection and does not install an APK by default.

```powershell
# Read-only installation/launch check (use full adb.exe path if not on PATH):
python native/android_smoke.py --adb 'C:\path\to\platform-tools\adb.exe' --serial DEVICE_SERIAL
# Explicitly replace/install a debug APK only when authorized:
python native/android_smoke.py --adb 'C:\path\to\platform-tools\adb.exe' --serial DEVICE_SERIAL --apk 'native\desktop\android\app\build\outputs\apk\debug\app-debug.apk' --install
```

The harness returns 0 for observed launch, 1 for failed launch verification, and 2 for
missing tooling, missing/ambiguous device, or other blocked prerequisites.


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

## Automated runtime emulator smoke checks

The native CI launches development artifacts on **emulators** in addition
to compiling and validating packages:

- Android: an Android 15 (API 35) x86_64 GitHub-hosted emulator installs
  the CI-produced debug APK. The smoke harness verifies the app is
  installed and resumed, then captures a screenshot and inspects the
  accessibility hierarchy for CIVWATCH content. Known WebView DNS/network
  error pages and unverified/empty views fail the runtime gate. DNS servers
  are explicitly configured for the emulator as recommended by Android.
- iOS: the macOS build job selects an available iPhone simulator, installs
  the unsigned .app, launches its bundle ID and captures a PNG screenshot.
- The provenance job requires successful Android emulator smoke and iOS
  simulator smoke (inside the iOS build job), plus all five builds.
- Separate native-android-emulator-smoke and native-ios-simulator-smoke
  artifacts contain screenshots, not release packages.

These are launch smoke checks, not end-to-end UI tests. They do not prove
remote content loaded, authenticated navigation worked, or a physical
phone is supported. GitHub runners provide the virtual devices so the Dell
does not need a multi-GB local AVD image or an Apple VM.

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
