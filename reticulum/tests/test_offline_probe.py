"""Regression tests for failure handling in the manual Reticulum probe."""

import importlib.util
import io
from pathlib import Path
import sys
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "offline_probe.py"


def load_probe_module():
    # The test only exercises control flow and must not require Reticulum to be
    # installed. The module's RNS dependency is replaced with a test double.
    fake_import = ModuleType("RNS")
    with patch.dict(sys.modules, {"RNS": fake_import}):
        spec = importlib.util.spec_from_file_location("civint_offline_probe_tested", SCRIPT)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    return module


class OfflineProbeTests(unittest.TestCase):
    def test_failed_packet_enqueue_returns_failure_without_receipt_access(self):
        probe = load_probe_module()

        class FakeReticulum:
            TRUNCATED_HASHLENGTH = 128

            def __init__(self, _config_path):
                pass

        class FakeTransport:
            @staticmethod
            def request_path(_destination_hash):
                pass

            @staticmethod
            def has_path(_destination_hash):
                return True

        class FakeIdentity:
            @staticmethod
            def recall(_destination_hash):
                return object()

        class FakeDestination:
            OUT = 1
            SINGLE = 2

            def __init__(self, *_args):
                pass

        class FakePacket:
            def __init__(self, *_args):
                pass

            @staticmethod
            def send():
                return False

        probe.RNS = SimpleNamespace(
            Reticulum=FakeReticulum,
            Transport=FakeTransport,
            Identity=FakeIdentity,
            Destination=FakeDestination,
            Packet=FakePacket,
        )

        with patch("sys.stdout"), patch("sys.stderr") as stderr:
            result = probe.run_client(
                config_path="/temporary/test-config",
                destination_hex="a" * 32,
                message="CIVINT-OFFLINE-TEST-REGRESSION",
                timeout=1.0,
            )

        self.assertEqual(result, 1)
        self.assertIn("could not enqueue", stderr.write.call_args_list[0].args[0])


    def test_delivery_proof_race_is_detected_from_receipt_status(self):
        probe = load_probe_module()

        class FakeReticulum:
            TRUNCATED_HASHLENGTH = 128

            def __init__(self, _config_path):
                pass

        class FakeTransport:
            @staticmethod
            def request_path(_destination_hash):
                pass

            @staticmethod
            def has_path(_destination_hash):
                return True

        class FakeIdentity:
            @staticmethod
            def recall(_destination_hash):
                return object()

        class FakeDestination:
            OUT = 1
            SINGLE = 2

            def __init__(self, *_args):
                pass

        class FakeReceipt:
            def set_timeout(self, _timeout):
                pass

            def set_delivery_callback(self, _callback):
                pass

            def set_timeout_callback(self, _callback):
                pass

            @staticmethod
            def get_status():
                # Simulate proof arriving before callbacks were registered.
                return 2

        class FakePacket:
            def __init__(self, *_args):
                pass

            @staticmethod
            def send():
                return FakeReceipt()

        probe.RNS = SimpleNamespace(
            Reticulum=FakeReticulum,
            Transport=FakeTransport,
            Identity=FakeIdentity,
            Destination=FakeDestination,
            Packet=FakePacket,
            PacketReceipt=SimpleNamespace(DELIVERED=2, FAILED=0, CULLED=255),
        )

        with patch("sys.stdout", new_callable=io.StringIO) as stdout, patch(
            "sys.stderr", new_callable=io.StringIO
        ):
            result = probe.run_client(
                config_path="/temporary/test-config",
                destination_hex="a" * 32,
                message="CIVINT-OFFLINE-TEST-RACE",
                timeout=1.0,
            )

        self.assertEqual(result, 0)
        self.assertIn("PASS:", stdout.getvalue())


if __name__ == "__main__":
    unittest.main()
