# Native local frontend milestone

The five native packages now target a **locally bundled, responsive navigation shell** at `native/desktop/shell`. Tauri launches its bundled entrypoint without a remote window URL. Capacitor has no remote `server.url`; `cap sync` copies the same shell into Android and iOS projects. The shell includes keyboard-accessible navigation for Watchtower, Records, Oversight, Globe, and Sources, an explicit cross-origin network probe with retry/offline states, and links to open the corresponding full website in the system browser.

**Scope:** This is the first real local startup milestone, **not** a port of the SSR-backed TanStack Start frontend. The intelligence screens, authenticated API client, secure native OAuth redirect/PKCE bridge, and data caching are not integrated. The unauthenticated connectivity probe may fail because the production server does not grant CORS to native origins; it never sends credentials or tokens. The full website opens externally rather than silently embedding remote content.

The desktop shell uses a restrictive CSP, does not enable remote Tauri IPC, and avoids inline JavaScript or HTML injection. The mobile shell uses Capacitor's packaged assets and does not allow arbitrary HTTP cleartext startup.

Verification: `python -m unittest discover -s native -p 'test_*.py' -q`, `python native/native_config_policy.py`, `node --check native/desktop/shell/native.js`, `cd native/desktop && npm run mobile:sync -- android`. Run the cross-platform native workflow before claiming packaging success. The production release gate must remain blocked until signing, OAuth and physical-device validation are completed.
