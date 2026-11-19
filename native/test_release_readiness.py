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

    def test_real_checkout_is_blocked(self):
        mobile = json.loads((ROOT / "capacitor.config.json").read_text(encoding="utf-8"))
        desktop = json.loads((ROOT / "src-tauri" / "tauri.conf.json").read_text(encoding="utf-8"))
        html = (ROOT / "shell" / "index.html").read_text(encoding="utf-8")
        self.assertTrue(assess(mobile, desktop, html))

if __name__ == "__main__":
    unittest.main()
