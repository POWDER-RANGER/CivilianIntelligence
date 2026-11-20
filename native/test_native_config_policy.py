import copy
import unittest
from native_config_policy import validate

MOBILE = {"server": {"url": "https://civintelligence.onrender.com/", "cleartext": False}}
DESKTOP = {"app": {"windows": [{"url": "https://civintelligence.onrender.com/"}], "security": {"csp": None}}}

class NativeConfigPolicyTests(unittest.TestCase):
    def test_expected_development_origin(self):
        validate(MOBILE, DESKTOP)

    def test_rejects_origin_drift_and_credentials(self):
        for url in ("http://civintelligence.onrender.com/", "https://evil.example/",
                    "https://civintelligence.onrender.com.evil.example/",
                    "https://user:pass@civintelligence.onrender.com/",
                    "https://civintelligence.onrender.com:443/",
                    "https://civintelligence.onrender.com/?token=abc"):
            with self.subTest(url=url), self.assertRaises(ValueError):
                m = copy.deepcopy(MOBILE)
                m["server"]["url"] = url
                validate(m, DESKTOP)

    def test_rejects_ambiguous_authorities_on_both_platforms(self):
        urls = (
            "https://civintelligence.onrender.com\\@evil.example/",
            "https://civintelligence.onrender.com/%2f",
            "https://civintelligence.onrender.com/#fragment",
            "https://civintelligence.onrender.com/?q=x",
            "https://civintelligence.onrender.com:invalid/",
            "https://[invalid/",
            "https://civintelligence.onrender.com/é",
        )
        for url in urls:
            for platform in ("mobile", "desktop"):
                with self.subTest(url=url, platform=platform), self.assertRaises(ValueError):
                    m, t = copy.deepcopy(MOBILE), copy.deepcopy(DESKTOP)
                    if platform == "mobile":
                        m["server"]["url"] = url
                    else:
                        t["app"]["windows"][0]["url"] = url
                    validate(m, t)

    def test_rejects_cleartext_and_ipc(self):
        m = copy.deepcopy(MOBILE)
        m["server"]["cleartext"] = True
        with self.assertRaises(ValueError):
            validate(m, DESKTOP)
        t = copy.deepcopy(DESKTOP)
        t["app"]["security"]["capabilities"] = ["default"]
        with self.assertRaises(ValueError):
            validate(MOBILE, t)

    def test_rejects_unexpected_desktop_origin(self):
        t = copy.deepcopy(DESKTOP)
        t["app"]["windows"][0]["url"] = "http://localhost:8080"
        with self.assertRaises(ValueError):
            validate(MOBILE, t)

if __name__ == "__main__":
    unittest.main()
