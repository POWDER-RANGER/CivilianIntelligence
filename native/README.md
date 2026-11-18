# CIVINTELLIGENCE native clients — initial engineering scaffold

Desktop: Tauri 2 (Windows, macOS, Linux). Mobile: Capacitor 8 (Android, iOS).
The current app is SSR-backed TanStack Start; it is **not** a standalone static frontend.
These are connected native WebView prototypes pointing at the existing Render website.
The mobile `server.url` configuration is for **development/testing only**, not App Store / Play Store distribution.
Before store release, create a locally bundled native frontend and audited API/auth bridge.
No native IPC capabilities are granted to remote web content.

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
