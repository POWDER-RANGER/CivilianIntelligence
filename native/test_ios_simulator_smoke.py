import plistlib
import tempfile
import unittest
import subprocess
from unittest.mock import patch
from pathlib import Path

from ios_simulator_smoke import select_ios_device, app_bundle_id, launch_with_recovery, install_with_recovery


class IOSSimulatorSmokeTests(unittest.TestCase):
    @patch("ios_simulator_smoke.run")
    def test_install_timeout_reboots_and_retries_once(self, runner):
        runner.side_effect = [subprocess.TimeoutExpired("simctl", 180), "", "", "", ""]
        install_with_recovery("udid", Path("."))
        self.assertEqual([c.args[0] for c in runner.call_args_list],
                         ["install", "shutdown", "boot", "bootstatus", "install"])

    @patch("ios_simulator_smoke.run")
    def test_second_install_timeout_fails_closed(self, runner):
        runner.side_effect = [subprocess.TimeoutExpired("simctl", 180), "", "", "",
                              subprocess.TimeoutExpired("simctl", 180)]
        with self.assertRaises(subprocess.TimeoutExpired):
            install_with_recovery("udid", Path("."))

    @patch("ios_simulator_smoke.run")
    def test_nonzero_install_fails_without_retry(self, runner):
        runner.side_effect = subprocess.CalledProcessError(1, "simctl")
        with self.assertRaises(subprocess.CalledProcessError):
            install_with_recovery("udid", Path("."))
        self.assertEqual(runner.call_count, 1)

    @patch("ios_simulator_smoke.run")
    def test_timeout_recovers_by_reboot_and_reinstall(self, runner):
        runner.side_effect = [subprocess.TimeoutExpired("simctl", 90), "", "", "", "",
                              "org.civintelligence.mobile: 123"]
        with tempfile.TemporaryDirectory() as directory:
            result = launch_with_recovery("udid", "org.civintelligence.mobile", Path(directory))
        self.assertIn("org.civintelligence.mobile", result)
        self.assertEqual([c.args[0] for c in runner.call_args_list],
                         ["launch", "shutdown", "boot", "bootstatus", "install", "launch"])

    @patch("ios_simulator_smoke.run")
    def test_second_timeout_fails_closed(self, runner):
        runner.side_effect = [subprocess.TimeoutExpired("simctl", 90), "", "", "", "",
                              subprocess.TimeoutExpired("simctl", 90)]
        with self.assertRaises(subprocess.TimeoutExpired):
            launch_with_recovery("udid", "org.civintelligence.mobile", Path("."))

    @patch("ios_simulator_smoke.run")
    def test_nonzero_launch_fails_without_recovery(self, runner):
        runner.side_effect = subprocess.CalledProcessError(1, "simctl")
        with self.assertRaises(subprocess.CalledProcessError):
            launch_with_recovery("udid", "org.civintelligence.mobile", Path("."))
        self.assertEqual(runner.call_count, 1)

    def test_picks_newest_available_iphone(self):
        items = {"devices": {
            "com.apple.CoreSimulator.SimRuntime.iOS-17-5": [
                {"name": "iPhone 15", "udid": "old", "isAvailable": True, "state": "Shutdown"}],
            "com.apple.CoreSimulator.SimRuntime.iOS-18-2": [
                {"name": "Apple Watch", "udid": "watch", "isAvailable": True},
                {"name": "iPhone 16", "udid": "unavailable", "isAvailable": False},
                {"name": "iPhone 16 Pro", "udid": "new", "isAvailable": True, "state": "Shutdown"}],
        }}
        self.assertEqual(select_ios_device(items), "new")

    def test_fails_closed_if_no_iphone(self):
        with self.assertRaisesRegex(ValueError, "No available"):
            select_ios_device({"devices": {"com.apple.CoreSimulator.SimRuntime.watchOS-11-0":
                               [{"name": "Apple Watch", "udid": "watch"}]}})

    def test_requires_expected_app_bundle(self):
        with tempfile.TemporaryDirectory() as directory:
            app = Path(directory) / "App.app"
            app.mkdir()
            with (app / "Info.plist").open("wb") as output:
                plistlib.dump({"CFBundleIdentifier": "org.civintelligence.mobile"}, output)
            self.assertEqual(app_bundle_id(app), "org.civintelligence.mobile")
            with (app / "Info.plist").open("wb") as output:
                plistlib.dump({"CFBundleIdentifier": "com.fake.app"}, output)
            with self.assertRaisesRegex(ValueError, "Unexpected"):
                app_bundle_id(app)


if __name__ == "__main__":
    unittest.main()
