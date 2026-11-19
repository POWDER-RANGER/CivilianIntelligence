#!/usr/bin/env python3
"""Install and launch a debug .app on a booted iOS Simulator.

This does not sign an app, exercise OAuth, or certify a physical iPhone.
"""
import argparse
import json
import plistlib
import re
import subprocess
import sys
import time
from pathlib import Path


def select_ios_device(data: dict) -> str:
    """Choose a usable iPhone, preferring the newest available iOS runtime."""
    candidates = []
    for runtime, devices in data.get("devices", {}).items():
        if "SimRuntime.iOS-" not in runtime or not isinstance(devices, list):
            continue
        version = tuple(int(part) for part in re.findall(r"\d+", runtime.split("SimRuntime.iOS-", 1)[1]))
        for device in devices:
            if not isinstance(device, dict):
                continue
            if device.get("isAvailable") is False or not str(device.get("name", "")).startswith("iPhone"):
                continue
            udid = device.get("udid")
            if isinstance(udid, str) and udid:
                candidates.append((version, device.get("state") == "Booted", udid))
    if not candidates:
        raise ValueError("No available iPhone Simulator runtime/device")
    return max(candidates)[2]


def app_bundle_id(app: Path) -> str:
    info = app / "Info.plist"
    if not app.is_dir() or not info.is_file():
        raise ValueError("Simulator app missing Info.plist")
    with info.open("rb") as fh:
        bundle = plistlib.load(fh).get("CFBundleIdentifier")
    if bundle != "org.civintelligence.mobile":
        raise ValueError(f"Unexpected bundle identifier: {bundle!r}")
    return bundle


def run(*args: str, timeout: int = 120) -> str:
    result = subprocess.run(["xcrun", "simctl", *args], capture_output=True, text=True,
                            timeout=timeout, check=True)
    return result.stdout


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--app", required=True, type=Path)
    parser.add_argument("--screenshot", required=True, type=Path)
    args = parser.parse_args(argv)
    booted_here = False
    udid = None
    try:
        bundle = app_bundle_id(args.app)
        state = json.loads(run("list", "devices", "available", "--json"))
        udid = select_ios_device(state)
        device = next(d for group in state["devices"].values() for d in group
                      if isinstance(d, dict) and d.get("udid") == udid)
        print(f"Simulator: {device['name']} ({udid})", flush=True)
        if device.get("state") != "Booted":
            run("boot", udid)
            booted_here = True
        run("bootstatus", udid, "-b", timeout=240)
        run("install", udid, str(args.app.resolve()), timeout=180)
        # Simulator launch services can stall on shared macOS runners even after bootstatus.
        # Retry only a timed-out launch; a nonzero simctl exit remains a hard failure.
        for attempt in range(2):
            try:
                launch = run("launch", udid, bundle, timeout=90)
                break
            except subprocess.TimeoutExpired:
                if attempt:
                    raise
                print("Simulator launch timed out; checking boot readiness before one retry", flush=True)
                run("bootstatus", udid, "-b", timeout=120)
        if bundle not in launch:
            raise RuntimeError(f"Simulator launch did not report bundle ID: {launch!r}")
        time.sleep(3)
        args.screenshot.parent.mkdir(parents=True, exist_ok=True)
        run("io", udid, "screenshot", str(args.screenshot.resolve()), timeout=90)
        with args.screenshot.open("rb") as fh:
            if fh.read(8) != b"\x89PNG\r\n\x1a\n":
                raise RuntimeError("Simulator screenshot is not a PNG")
        if args.screenshot.stat().st_size < 1024:
            raise RuntimeError("Simulator screenshot unexpectedly small")
        print(f"PASS: {bundle} installed, launched and screenshot captured on iOS Simulator")
        print("NOT VERIFIED: physical iPhone, rendering correctness, OAuth, offline use, signing")
        return 0
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError,
            subprocess.TimeoutExpired, json.JSONDecodeError, RuntimeError) as error:
        print(f"FAIL: iOS Simulator smoke test: {error}", file=sys.stderr)
        return 1
    finally:
        if booted_here and udid:
            try:
                run("shutdown", udid, timeout=45)
            except (OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
                pass


if __name__ == "__main__":
    raise SystemExit(main())
