#!/usr/bin/env bash
# Run as ONE command from android-emulator-runner's script input.
# The action executes each script input line independently.
set -u

apk="${1:-}"
if [ -z "$apk" ] || [ ! -f "$apk" ]; then
  echo "Android emulator smoke requires an existing debug APK" >&2
  exit 2
fi

# 10.0.2.2 is Android Emulator's host-loopback alias. Configure the
# Android System Proxy (honored by WebView) rather than relying on the
# emulator-level proxy flag. This setting is confined to the disposable AVD.
adb shell settings put global http_proxy 10.0.2.2:18443
proxy_setting="$(adb shell settings get global http_proxy | tr -d '\r')"
if [ "$proxy_setting" != "10.0.2.2:18443" ]; then
  echo "FAIL: Android system proxy not configured: $proxy_setting" >&2
  exit 1
fi
trap 'adb shell settings delete global http_proxy >/dev/null 2>&1 || true' EXIT

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
# A cold Render startup or Android WebView initialization may take longer
# than the first foreground frame. Retry only observation, never weaken
# the content classifier or treat a browser error as a successful launch.
webview_ready=false
for attempt in 1 2 3 4; do
  if timeout 30s adb shell uiautomator dump /sdcard/civwatch-window.xml >/dev/null 2>&1 &&
     adb shell cat /sdcard/civwatch-window.xml > android-smoke-evidence/window.xml; then
    if python3 native/android_webview_health.py android-smoke-evidence/window.xml; then
      webview_ready=true
      break
    fi
  fi
  echo "WebView content not verified (observation $attempt/4)" >&2
  if [ "$attempt" -lt 4 ]; then sleep 10; fi
done
if [ "$webview_ready" != true ]; then
  adb logcat -d -t 300 -s chromium WebViewFactory cr_WebViewLibraryLoader > android-smoke-evidence/webview-logcat.txt 2>&1 || true
  echo "FAIL: WebView did not render verified CIVWATCH content; evidence retained" >&2
  exit 1
fi

if [ "$launch_status" -ne 0 ]; then
  echo "Android emulator installation/foreground check failed" >&2
  exit "$launch_status"
fi
exit "$image_status"
