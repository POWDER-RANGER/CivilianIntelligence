#!/usr/bin/env python3
"""Classify Android UIAutomator evidence from a fresh native-client launch.

No network credentials or model inference. A foreground Activity is not proof
that the hosted CIVWATCH WebView actually rendered usable content.
"""
import argparse
from pathlib import Path

ERROR_TEXT = (
    "webpage not available",
    "err_name_not_resolved",
    "err_internet_disconnected",
    "err_connection_refused",
    "err_connection_timed_out",
    "err_ssl_protocol_error",
)
EXPECTED_TEXT = ("civwatch", "public records and open data", "the open desk")


def classify_ui(xml: str) -> str:
    if not xml.strip():
        return "unverified"
    text = xml.lower()
    if any(error in text for error in ERROR_TEXT):
        return "network-error"
    if any(label in text for label in EXPECTED_TEXT):
        return "rendered"
    return "unverified"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("hierarchy", type=Path)
    args = parser.parse_args()
    if not args.hierarchy.is_file():
        print("FAIL: Android UI hierarchy missing")
        return 1
    state = classify_ui(args.hierarchy.read_text(encoding="utf-8", errors="replace"))
    print(f"ANDROID_WEBVIEW_STATE={state}")
    if state != "rendered":
        print("FAIL: no verified CIVWATCH page content; inspect emulator evidence")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
