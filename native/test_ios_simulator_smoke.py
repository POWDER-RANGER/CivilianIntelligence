import plistlib
import tempfile
import unittest
from pathlib import Path

from ios_simulator_smoke import select_ios_device, app_bundle_id


class IOSSimulatorSmokeTests(unittest.TestCase):
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
