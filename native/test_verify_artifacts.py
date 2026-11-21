import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

from verify_artifacts import EXPECTED, inventory


class ArtifactVerificationTests(unittest.TestCase):
    def make_artifacts(self, root: Path):
        for name, suffixes in EXPECTED.items():
            folder = root / name
            folder.mkdir()
            for suffix in suffixes:
                path = folder / ("fixture" + suffix)
                if suffix == ".apk":
                    with ZipFile(path, "w") as archive:
                        archive.writestr("AndroidManifest.xml", b"manifest")
                        archive.writestr("classes.dex", b"dex")
                elif suffix == ".zip":
                    with ZipFile(path, "w") as archive:
                        archive.writestr("App.app/Info.plist", b"plist")
                else:
                    headers = {".exe": b"MZ", ".AppImage": b"\x7fELF", ".deb": b"!<arch>\n"}
                    path.write_bytes(headers.get(suffix, b"") + (b"koly" + b"\0" * 508 if suffix == ".dmg" else b"test-binary"))

    def test_complete_inventory_and_digests(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.make_artifacts(root)
            result = inventory(root, "abcdef")
            self.assertEqual(len(result["artifacts"]), 6)
            self.assertEqual(result["commit"], "abcdef")
            self.assertTrue(all(len(a["sha256"]) == 64 for a in result["artifacts"]))

    def test_missing_platform_fails(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.make_artifacts(root)
            (root / "civintelligence-macos" / "fixture.dmg").unlink()
            with self.assertRaisesRegex(ValueError, "missing required"):
                inventory(root, "abcdef")

    def test_empty_file_fails(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.make_artifacts(root)
            (root / "civintelligence-android-debug" / "fixture.apk").write_bytes(b"")
            with self.assertRaisesRegex(ValueError, "Empty artifact"):
                inventory(root, "abcdef")


if __name__ == "__main__":
    unittest.main()
