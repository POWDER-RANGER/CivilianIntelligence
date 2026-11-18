import unittest
from unittest.mock import patch
from android_smoke import main, parse_devices


class AndroidSmokeTests(unittest.TestCase):
    def test_only_authorized_online_devices(self):
        output = "List of devices attached\nA1 device product:foo\nB2 unauthorized\nC3 offline\nD4 device model:bar\n"
        self.assertEqual(parse_devices(output), ["A1", "D4"])

    def test_empty_and_daemon_noise(self):
        self.assertEqual(parse_devices("List of devices attached\n\n"), [])
        self.assertEqual(parse_devices("* daemon started successfully\nList of devices attached\n"), [])

    @patch("android_smoke.run_adb", return_value="List of devices attached\nA1 device\nB2 device\n")
    def test_refuses_ambiguous_devices(self, mock_adb):
        self.assertEqual(main([]), 2)
        mock_adb.assert_called_once()

    @patch("android_smoke.run_adb", return_value="List of devices attached\n")
    def test_refuses_no_device(self, mock_adb):
        self.assertEqual(main([]), 2)
        mock_adb.assert_called_once()


if __name__ == "__main__":
    unittest.main()
