#!/usr/bin/env bash
# Run as ONE command from android-emulator-runner's script input.
# The action executes each script input line independently.
set -u

apk="${1:-}"
if [ -z "$apk" ] || [ ! -f "$apk" ]; then
  echo "Android emulator smoke requires an existing debug APK" >&2
  exit 2
fi

mkdir -p android-smoke-evidence
launch_status=0
python3 native/android_smoke.py --apk "$apk" --install || launch_status=$?

# A foreground Android activity can still be showing Chromium's network-error
# page. Capture the loaded state rather than accepting the first launch frame.
sleep 12

if ! adb exec-out screencap -p > android-smoke-evidence/launch.png; then
  echo "Could not capture emulator screenshot" >&2
  exit 1
fi

python3 -c 'from pathlib import Path; p=Path("android-smoke-evidence/launch.png"); assert p.read_bytes().startswith(bytes.fromhex("89504e470d0a1a0a")) and p.stat().st_size > 1024, "Invalid screenshot"'
image_status=$?

# Preserve the accessibility text for CI diagnostics. Refuse to call the
# WebView usable when Chromium reports a known connection failure.
if ! timeout 30s adb shell uiautomator dump /sdcard/civwatch-window.xml >/dev/null 2>&1; then
  echo "FAIL: Android UIAutomator could not inspect WebView content" >&2
  exit 1
fi
adb shell cat /sdcard/civwatch-window.xml > android-smoke-evidence/window.xml
python3 native/android_webview_health.py android-smoke-evidence/window.xml || exit 1

if [ "$launch_status" -ne 0 ]; then
  echo "Android emulator installation/foreground check failed" >&2
  exit "$launch_status"
fi
exit "$image_status"
