import unittest
from unittest.mock import patch
from android_smoke import main, parse_devices, is_foreground_activity


class AndroidSmokeTests(unittest.TestCase):
    def test_only_authorized_online_devices(self):
        output = "List of devices attached\nA1 device product:foo\nB2 unauthorized\nC3 offline\nD4 device model:bar\n"
        self.assertEqual(parse_devices(output), ["A1", "D4"])

    def test_empty_and_daemon_noise(self):
        self.assertEqual(parse_devices("List of devices attached\n\n"), [])
        self.assertEqual(parse_devices("* daemon started successfully\nList of devices attached\n"), [])

    def test_foreground_accepts_resumed_activity(self):
        self.assertTrue(is_foreground_activity(
            "mResumedActivity: ActivityRecord{abc u0 org.civintelligence.mobile/.MainActivity t21}"
        ))
        self.assertTrue(is_foreground_activity(
            "topResumedActivity=ActivityRecord{abc u0 org.civintelligence.mobile/org.civintelligence.mobile.MainActivity t21}"
        ))

    def test_foreground_rejects_task_history_and_other_app(self):
        self.assertFalse(is_foreground_activity(
            "ActivityRecord{abc u0 org.civintelligence.mobile/.MainActivity t21}\n"
            "mResumedActivity: ActivityRecord{def u0 com.android.settings/.Settings t22}"
        ))
        self.assertFalse(is_foreground_activity(
            "mResumedActivity: ActivityRecord{abc u0 org.civintelligence.mobile.fake/.MainActivity t21}"
        ))

    @patch("android_smoke.run_adb", return_value="List of devices attached\nA1 device\nB2 device\n")
    def test_refuses_ambiguous_devices(self, mock_adb):
        self.assertEqual(main([]), 2)
        mock_adb.assert_called_once()

    @patch("android_smoke.run_adb", return_value="List of devices attached\n")
    def test_refuses_no_device(self, mock_adb):
        self.assertEqual(main([]), 2)
        mock_adb.assert_called_once()

    @patch("android_smoke.run_adb")
    def test_refuses_historical_task_false_positive(self, mock_adb):
        def fake(_adb, _serial, *args):
            if args[:1] == ("devices",):
                return "List of devices attached\nA1 device\n"
            if args[:2] == ("shell", "pm"):
                return "package:/data/app/base.apk"
            if args[:3] == ("shell", "dumpsys", "activity"):
                return ("ActivityRecord{abc u0 org.civintelligence.mobile/.MainActivity t21}\n"
                        "mResumedActivity: ActivityRecord{def u0 com.android.settings/.Settings t22}")
            return "ok"
        mock_adb.side_effect = fake
        with patch("android_smoke.time.sleep"):
            self.assertEqual(main([]), 1)

    @patch("android_smoke.run_adb")
    def test_successful_foreground_launch(self, mock_adb):
        def fake(_adb, _serial, *args):
            if args[:1] == ("devices",):
                return "List of devices attached\nA1 device\n"
            if args[:2] == ("shell", "pm"):
                return "package:/data/app/base.apk"
            if args[:3] == ("shell", "dumpsys", "activity"):
                return "mResumedActivity: ActivityRecord{abc u0 org.civintelligence.mobile/.MainActivity t21}"
            return "ok"
        mock_adb.side_effect = fake
        self.assertEqual(main([]), 0)


if __name__ == "__main__":
    unittest.main()
