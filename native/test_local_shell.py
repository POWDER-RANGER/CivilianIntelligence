import json
import unittest
from pathlib import Path
from native_config_policy import validate
from release_readiness import assess, ROOT

class LocalShellTests(unittest.TestCase):
    def setUp(self):
        self.mobile = json.loads((ROOT / "capacitor.config.json").read_text(encoding="utf-8"))
        self.desktop = json.loads((ROOT / "src-tauri" / "tauri.conf.json").read_text(encoding="utf-8"))
        self.shell = ROOT / "shell"

    def test_both_platforms_start_from_packaged_assets(self):
        self.assertNotIn("url", self.mobile.get("server", {}))
        self.assertNotIn("url", self.desktop["app"]["windows"][0])
        validate(self.mobile, self.desktop)

    def test_shell_has_local_navigation_and_external_web_fallback(self):
        html = (self.shell / "index.html").read_text(encoding="utf-8")
        source = (ROOT / "react-workspace.tsx").read_text(encoding="utf-8")
        self.assertIn('href="./native.css"', html)
        self.assertIn('src="./react-workspace.js"', html)
        self.assertNotIn('src="./native.js"', html)
        self.assertIn('id="react-workspace"', html)
        for section in ("watchtower", "records", "oversight", "globe", "sources"):
            self.assertIn('id:"' + section + '"', source)
        self.assertIn('aria-current={route===r.id?"page":undefined}', source)
        self.assertIn('credentials:"omit"', source)
        self.assertIn('rel="noopener noreferrer"', source)
        self.assertNotIn("innerHTML", source)

    def test_release_remains_blocked_without_signing_and_oauth(self):
        issues = assess(self.mobile, self.desktop, (self.shell / "index.html").read_text(encoding="utf-8"))
        self.assertTrue(any("oauth" in issue for issue in issues))
        self.assertTrue(any("signing" in issue for issue in issues))
        self.assertFalse(any("remote startup" in issue for issue in issues))
        self.assertFalse(any("placeholder" in issue for issue in issues))

if __name__ == "__main__":
    unittest.main()
