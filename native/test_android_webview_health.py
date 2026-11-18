import unittest
from android_webview_health import classify_ui


class AndroidWebViewHealthTests(unittest.TestCase):
    def test_detects_real_page_content(self):
        self.assertEqual(classify_ui('<node text="CIVWATCH - The Open Desk"/>'), "rendered")

    def test_rejects_browser_error_even_when_page_name_present(self):
        xml = '<node text="CIVWATCH"/><node text="Webpage not available: net::ERR_NAME_NOT_RESOLVED"/>'
        self.assertEqual(classify_ui(xml), "network-error")

    def test_rejects_empty_or_unverified_loading_view(self):
        self.assertEqual(classify_ui(""), "unverified")
        self.assertEqual(classify_ui('<node text="Loading..."/>'), "unverified")


if __name__ == "__main__":
    unittest.main()
