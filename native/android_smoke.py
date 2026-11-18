"""Opt-in, non-destructive Android physical-device launch verification.

Requires Android platform-tools and an authorized device.
Does not install unless --install is explicitly requested.
"""
import argparse
import re
import subprocess
import sys
import time
from pathlib import Path

PACKAGE = "org.civintelligence.mobile"
ACTIVITY = ".MainActivity"
COMPONENT = PACKAGE + "/" + ACTIVITY


def parse_devices(output: str) -> list[str]:
    devices = []
    for line in output.splitlines():
        parts = line.split()
        if len(parts) >= 2 and parts[1] == "device" and not parts[0].startswith("*"):
            devices.append(parts[0])
    return devices


def is_foreground_activity(output: str) -> bool:
    """Match an actual resumed/top activity, never incidental process/history text."""
    for line in output.splitlines():
        if not re.search(r"\b(?:mResumedActivity|topResumedActivity|ResumedActivity)\s*[:=]", line):
            continue
        if re.search(r"(?<![\w.])" + re.escape(PACKAGE) + r"/(?:\.MainActivity|" +
                     re.escape(PACKAGE) + r"\.MainActivity)(?![\w.])", line):
            return True
    return False


def run_adb(adb: str, serial: str | None, *args: str) -> str:
    command = [adb]
    if serial:
        command.extend(["-s", serial])
    command.extend(args)
    result = subprocess.run(command, capture_output=True, text=True, timeout=60, check=False)
    if result.returncode:
        raise RuntimeError(f"ADB {args[0]} failed ({result.returncode}): {result.stderr.strip()}")
    return result.stdout


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--adb", default="adb", help="Path to Android SDK platform-tools adb")
    parser.add_argument("--serial", help="ADB device serial; required if multiple devices")
    parser.add_argument("--apk", type=Path, help="Debug APK to install explicitly")
    parser.add_argument("--install", action="store_true", help="Authorize installation of --apk")
    args = parser.parse_args(argv)
    if args.install and (not args.apk or not args.apk.is_file()):
        parser.error("--install requires an existing --apk")
    if args.apk and not args.install:
        parser.error("--apk requires --install to avoid accidental replacement")

    try:
        connected = parse_devices(run_adb(args.adb, None, "devices", "-l"))
        if not connected:
            print("BLOCKED: No authorized ADB device online", file=sys.stderr)
            return 2
        if args.serial and args.serial not in connected:
            print("BLOCKED: Selected device not authorized/online", file=sys.stderr)
            return 2
        if not args.serial and len(connected) != 1:
            print("BLOCKED: Multiple devices; specify --serial", file=sys.stderr)
            return 2
        serial = args.serial or connected[0]
        model = run_adb(args.adb, serial, "shell", "getprop", "ro.product.model").strip()
        android = run_adb(args.adb, serial, "shell", "getprop", "ro.build.version.release").strip()
        print(f"DEVICE serial={serial} model={model} android={android}")
        if args.install:
            print("INSTALL: explicitly authorized debug APK")
            run_adb(args.adb, serial, "install", "-r", str(args.apk.resolve()))
        installed = run_adb(args.adb, serial, "shell", "pm", "path", PACKAGE).strip()
        if not any(line.startswith("package:") for line in installed.splitlines()):
            print("BLOCKED: App not installed; provide --apk ... --install", file=sys.stderr)
            return 2
        launch = run_adb(args.adb, serial, "shell", "am", "start", "-W", "-n", COMPONENT)
        if "Error:" in launch or "Exception" in launch:
            print("FAIL: Activity manager rejected launch", file=sys.stderr)
            return 1
        # The process may appear in task history without actually being foreground.
        # Poll resumed activity briefly to avoid both false positives and launch races.
        for attempt in range(5):
            state = run_adb(args.adb, serial, "shell", "dumpsys", "activity", "activities")
            if is_foreground_activity(state):
                print("PASS: Installed package launched and is the resumed foreground activity")
                print("NOT VERIFIED: web content rendering, OAuth, offline behavior, network access or production signing")
                return 0
            if attempt < 4:
                time.sleep(1)
        print("FAIL: App did not become the resumed foreground activity", file=sys.stderr)
        return 1
    except (OSError, subprocess.TimeoutExpired, RuntimeError) as exc:
        print(f"BLOCKED: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
