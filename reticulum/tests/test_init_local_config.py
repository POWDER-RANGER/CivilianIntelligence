"""Tests for safe creation of the dedicated local Reticulum config."""

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "init_local_config.py"


class InitLocalConfigTests(unittest.TestCase):
    def test_creates_explicit_local_autointerface_config(self):
        with tempfile.TemporaryDirectory() as temporary:
            config_dir = Path(temporary) / "node-a"
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--config", str(config_dir)],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            config = (config_dir / "config").read_text(encoding="utf-8")
            self.assertIn("[reticulum]", config)
            self.assertIn("share_instance = No", config)
            self.assertIn("[[CIVINT Local AutoInterface]]", config)
            self.assertIn("type = AutoInterface", config)
            self.assertIn("enabled = Yes", config)

    def test_refuses_to_overwrite_existing_config(self):
        with tempfile.TemporaryDirectory() as temporary:
            config_dir = Path(temporary) / "node-b"
            config_dir.mkdir()
            config_file = config_dir / "config"
            original = "[reticulum]\nshare_instance = Yes\n"
            config_file.write_text(original, encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--config", str(config_dir)],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(result.returncode, 2)
            self.assertEqual(config_file.read_text(encoding="utf-8"), original)
            self.assertIn("Refusing to overwrite", result.stderr)


if __name__ == "__main__":
    unittest.main()
