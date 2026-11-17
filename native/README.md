# CIVINTELLIGENCE native clients — initial engineering scaffold

Desktop: Tauri 2 (Windows, macOS, Linux). Mobile: Capacitor 8 (Android, iOS).
The current app is SSR-backed TanStack Start; it is **not** a standalone static frontend.
These are connected native WebView prototypes pointing at the existing Render website.
The mobile `server.url` configuration is for **development/testing only**, not App Store / Play Store distribution.
Before store release, create a locally bundled native frontend and audited API/auth bridge.
No native IPC capabilities are granted to remote web content.

Desktop on Windows:
  cd native/desktop
  npm install
  npm run desktop:build

Mobile requires Android SDK/JDK or macOS + Xcode:
  cd native/desktop
  npm install
  npx cap add android
  npx cap add ios

Do not ship or submit these prototypes as store-ready applications.
