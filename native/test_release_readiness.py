import json
import unittest
from pathlib import Path
from release_readiness import ROOT, assess

class ReleaseReadinessTests(unittest.TestCase):
    def setUp(self):
        self.mobile = {"server": {"url": "https://civintelligence.onrender.com/"}}
        self.desktop = {"app": {"windows": [{"url": "https://civintelligence.onrender.com/"}], "security": {"csp": None}}}

    def test_prototype_is_never_release_ready(self):
        issues = assess(self.mobile, self.desktop, "Network required")
        self.assertGreaterEqual(len(issues), 9)
        self.assertTrue(any("oauth" in issue for issue in issues))

    def test_remote_startup_remains_blocked_even_with_signing(self):
        signed = dict.fromkeys(("android", "ios", "macos", "windows", "oauth_callbacks", "physical_devices"), True)
        issues = assess(self.mobile, self.desktop, "<html>App</html>", signed)
        self.assertTrue(any("remote startup" in issue for issue in issues))

    def test_fully_verified_local_configuration(self):
        signed = dict.fromkeys(("android", "ios", "macos", "windows", "oauth_callbacks", "physical_devices"), True)
        self.mobile["server"] = {"cleartext": False}
        self.desktop["app"]["windows"] = [{"title": "CIVINTELLIGENCE"}]
        self.desktop["app"]["security"]["csp"] = "default-src 'self'"
        self.assertEqual(assess(self.mobile, self.desktop, "<html>Bundled application</html>", signed), [])

    def test_non_http_remote_and_obfuscated_desktop_urls_are_blocked(self):
        signed = dict.fromkeys(("android", "ios", "macos", "windows", "oauth_callbacks", "physical_devices"), True)
        self.mobile["server"] = {"cleartext": False}
        self.desktop["app"]["security"]["csp"] = "default-src 'self'"
        for url in (" HTTPS://example.org/", "file:///tmp/unsafe.html", "data:text/html,unsafe", "javascript:alert(1)"):
            with self.subTest(url=url):
                self.desktop["app"]["windows"] = [{"url": url}]
                issues = assess(self.mobile, self.desktop, "<html>Bundled application</html>", signed)
                self.assertTrue(any("remote startup" in issue for issue in issues))

    def test_cleartext_and_navigation_bypass_are_blocked(self):
        signed = dict.fromkeys(("android", "ios", "macos", "windows", "oauth_callbacks", "physical_devices"), True)
        self.mobile["server"] = {"cleartext": True, "allowNavigation": ["*"]}
        self.desktop["app"]["windows"] = [{"title": "CIVINTELLIGENCE"}]
        self.desktop["app"]["security"]["csp"] = "default-src 'self'"
        issues = assess(self.mobile, self.desktop, "<html>Bundled application</html>", signed)
        self.assertTrue(any("cleartext" in issue for issue in issues))
        self.assertTrue(any("navigation" in issue for issue in issues))

    def test_permissive_or_empty_csp_is_blocked(self):
        signed = dict.fromkeys(("android", "ios", "macos", "windows", "oauth_callbacks", "physical_devices"), True)
        self.mobile["server"] = {"cleartext": False}
        self.desktop["app"]["windows"] = [{"title": "CIVINTELLIGENCE"}]
        for csp in ("", "default-src *", "default-src 'self'; script-src 'unsafe-eval'"):
            with self.subTest(csp=csp):
                self.desktop["app"]["security"]["csp"] = csp
                self.assertTrue(any("content security policy" in issue for issue in assess(self.mobile, self.desktop, "<html>App</html>", signed)))

    def test_missing_or_invalid_window_cannot_pass_release_gate(self):
        signed = dict.fromkeys(("android", "ios", "macos", "windows", "oauth_callbacks", "physical_devices"), True)
        self.mobile["server"] = {"cleartext": False}
        self.desktop["app"]["security"]["csp"] = "default-src 'self'"
        for windows in (None, [], {}, [None], ["invalid"], [{"title": "App"}, None]):
            with self.subTest(windows=windows):
                self.desktop["app"]["windows"] = windows
                issues = assess(self.mobile, self.desktop, "<html>Bundled application</html>", signed)
                self.assertTrue(any("valid application window" in issue for issue in issues))

    def test_real_checkout_is_blocked(self):
        mobile = json.loads((ROOT / "capacitor.config.json").read_text(encoding="utf-8"))
        desktop = json.loads((ROOT / "src-tauri" / "tauri.conf.json").read_text(encoding="utf-8"))
        html = (ROOT / "shell" / "index.html").read_text(encoding="utf-8")
        self.assertTrue(assess(mobile, desktop, html))

if __name__ == "__main__":
    unittest.main()
