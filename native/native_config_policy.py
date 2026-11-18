"""Fail closed when native prototype configuration drifts into unsafe remote-content settings."""
import json
from pathlib import Path
from urllib.parse import urlsplit

HOST = "civintelligence.onrender.com"

def validate(mobile: dict, desktop: dict) -> None:
    server = mobile.get("server") or {}
    mobile_url = server.get("url")
    windows = (desktop.get("app") or {}).get("windows") or []
    if len(windows) != 1:
        raise ValueError("Expected one explicitly configured desktop window")
    desktop_url = windows[0].get("url")
    for label, url in (("mobile", mobile_url), ("desktop", desktop_url)):
        if not isinstance(url, str) or any(ord(c) < 33 for c in url):
            raise ValueError(f"{label}: invalid remote URL")
        parts = urlsplit(url)
        if (parts.scheme != "https" or parts.hostname != HOST or parts.username
                or parts.password or parts.port is not None or parts.query or parts.fragment
                or parts.path not in ("", "/")):
            raise ValueError(f"{label}: unexpected remote origin")
    if server.get("cleartext") is not False:
        raise ValueError("Mobile cleartext must be explicitly disabled")
    if (desktop.get("app") or {}).get("security", {}).get("dangerousDisableAssetCspModification"):
        raise ValueError("Desktop asset CSP protections must remain enabled")
    if (desktop.get("app") or {}).get("security", {}).get("capabilities"):
        raise ValueError("Remote-content prototype must not declare app-wide IPC capabilities")

def main() -> None:
    root = Path(__file__).resolve().parent / "desktop"
    mobile = json.loads((root / "capacitor.config.json").read_text(encoding="utf-8"))
    desktop = json.loads((root / "src-tauri" / "tauri.conf.json").read_text(encoding="utf-8"))
    validate(mobile, desktop)
    print("Remote prototype origins and cleartext/IPC policy verified; NOT store-ready")

if __name__ == "__main__":
    main()
