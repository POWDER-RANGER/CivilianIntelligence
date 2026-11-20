"""Release gate: reject connected-WebView prototypes and unsigned production claims."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "desktop"

def assess(mobile: dict, desktop: dict, shell_html: str, signing: dict | None = None) -> list[str]:
    issues = []
    server = mobile.get("server") or {}
    if server.get("url"):
        issues.append("mobile: remote startup URL prevents an independently bundled frontend")
    if server.get("cleartext") is not False:
        issues.append("mobile: cleartext transport must be explicitly disabled")
    if server.get("allowNavigation"):
        issues.append("mobile: arbitrary WebView navigation allowlist is not release-approved")
    windows = (desktop.get("app") or {}).get("windows")
    if not isinstance(windows, list) or not windows or any(not isinstance(w, dict) for w in windows):
        issues.append("desktop: at least one valid application window must be configured")
    elif any(str(w.get("url") or "").strip() for w in windows):
        issues.append("desktop: remote startup URL prevents an independently bundled frontend")
    if not shell_html.strip() or ("network" in shell_html.lower() and "required" in shell_html.lower()):
        issues.append("frontend: packaged shell is a network-required placeholder")
    csp = (desktop.get("app") or {}).get("security", {}).get("csp")
    if not isinstance(csp, str) or not csp.strip():
        issues.append("desktop: content security policy is unset")
    elif "default-src 'self'" not in csp.lower() or "unsafe-eval" in csp.lower() or "*" in csp:
        issues.append("desktop: content security policy is overly permissive")
    signing = signing or {}
    for platform in ("android", "ios", "macos", "windows"):
        if signing.get(platform) is not True:
            issues.append(f"{platform}: production signing not independently verified")
    if signing.get("oauth_callbacks") is not True:
        issues.append("oauth: external-browser callback and state/PKCE verification incomplete")
    if signing.get("physical_devices") is not True:
        issues.append("devices: physical-device smoke tests incomplete")
    return issues

def main() -> None:
    mobile = json.loads((ROOT / "capacitor.config.json").read_text(encoding="utf-8"))
    desktop = json.loads((ROOT / "src-tauri" / "tauri.conf.json").read_text(encoding="utf-8"))
    html = (ROOT / "shell" / "index.html").read_text(encoding="utf-8")
    issues = assess(mobile, desktop, html)
    if issues:
        print("PROTOTYPE ONLY: production release gate blocked")
        for issue in issues:
            print(f"- {issue}")
        raise SystemExit(1)
    print("Release gate conditions satisfied; independent platform review still required")

if __name__ == "__main__":
    main()
