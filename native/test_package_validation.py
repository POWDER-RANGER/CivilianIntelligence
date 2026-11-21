import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile
from package_validation import validate_package


class NativePackageTests(unittest.TestCase):
    def test_headers_and_trailer(self):
        fixtures = {
            "setup.exe": b"MZ" + b"\0" * 64,
            "client.AppImage": b"\x7fELF" + b"\0" * 64,
            "client.deb": b"!<arch>\n" + b"\0" * 64,
            "client.dmg": b"\0" * 1024 + b"koly" + b"\0" * 508,
        }
        with tempfile.TemporaryDirectory() as temp:
            for name, content in fixtures.items():
                path = Path(temp) / name
                path.write_bytes(content)
                validate_package(path)
                path.write_bytes(b"not-a-package")
                with self.assertRaisesRegex(ValueError, "Invalid"):
                    validate_package(path)

    def test_android_requires_manifest_and_classes(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "app.apk"
            with ZipFile(path, "w") as archive:
                archive.writestr("AndroidManifest.xml", b"manifest")
                archive.writestr("classes.dex", b"dex")
            validate_package(path)
            with ZipFile(path, "w") as archive:
                archive.writestr("unrelated.txt", b"bad")
            with self.assertRaisesRegex(ValueError, "APK lacks"):
                validate_package(path)

    def test_ios_requires_app_plist(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "simulator.zip"
            with ZipFile(path, "w") as archive:
                archive.writestr("App.app/Info.plist", b"plist")
            validate_package(path)
            with ZipFile(path, "w") as archive:
                archive.writestr("README.txt", b"bad")
            with self.assertRaisesRegex(ValueError, "Info.plist"):
                validate_package(path)


if __name__ == "__main__":
    unittest.main()
