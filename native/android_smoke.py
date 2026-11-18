"""Explicit, non-destructive Android physical-device smoke harness.

Requires Android platform-tools and a connected, authorized device.
No APK is installed unless --install is supplied.
"""
import argparse
import subprocess
import sys
from pathlib import Path

PACKAGE = "org.civintelligence.mobile"
ACTIVITY = ".MainActivity"


def parse_devices(output: str) -> list[str]:
    devices = []
    for line in output.splitlines()[1:]:
        parts = line.split()
        if len(parts) >= 2 and parts[1] == "device":
            devices.append(parts[0])
    return devices


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
        if not installed.startswith("package:"):
            print("BLOCKED: App not installed; provide --apk ... --install", file=sys.stderr)
            return 2
        run_adb(args.adb, serial, "shell", "am", "start", "-W", "-n", PACKAGE + "/" + ACTIVITY)
        foreground = run_adb(args.adb, serial, "shell", "dumpsys", "activity", "activities")
        if PACKAGE not in foreground:
            print("FAIL: Could not verify app in activity state", file=sys.stderr)
            return 1
        print("PASS: Installed package launched and appears in activity state")
        print("NOT VERIFIED: web content rendering, OAuth, offline behavior, network access or production signing")
        return 0
    except (OSError, subprocess.TimeoutExpired, RuntimeError) as exc:
        print(f"BLOCKED: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
