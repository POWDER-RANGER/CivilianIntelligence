#!/usr/bin/env python3
"""Validate five-platform CI deliverables and emit reproducible SHA-256 inventory."""
import argparse
import hashlib
import json
from pathlib import Path

EXPECTED = {
    "civintelligence-windows-nsis": (".exe",),
    "civintelligence-linux": (".deb", ".AppImage"),
    "civintelligence-macos": (".dmg",),
    "civintelligence-android-debug": (".apk",),
    "civintelligence-ios-simulator": (".zip",),
}

def inventory(root: Path, commit: str) -> dict:
    if not root.is_dir():
        raise ValueError("Artifact directory does not exist")
    entries = []
    for name, suffixes in EXPECTED.items():
        folder = root / name
        if not folder.is_dir():
            raise ValueError(f"Missing platform artifact: {name}")
        files = sorted(p for p in folder.rglob("*") if p.is_file())
        for suffix in suffixes:
            if not any(p.name.endswith(suffix) for p in files):
                raise ValueError(f"{name}: missing required {suffix} deliverable")
        for path in files:
            relative = path.relative_to(root).as_posix()
            if path.stat().st_size == 0:
                raise ValueError(f"Empty artifact: {relative}")
            digest = hashlib.sha256()
            with path.open("rb") as source:
                for chunk in iter(lambda: source.read(1024 * 1024), b""):
                    digest.update(chunk)
            entries.append({
                "path": relative,
                "bytes": path.stat().st_size,
                "sha256": digest.hexdigest(),
                "platform": name,
            })
    return {
        "schema": "civintelligence-native-artifacts-v1",
        "commit": commit,
        "distribution_status": "unsigned-development-artifacts-not-store-ready",
        "artifacts": entries,
    }

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--commit", required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    result = inventory(args.root, args.commit)
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "native-artifacts.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    (args.out / "SHA256SUMS").write_text(
        "".join(f"{item['sha256']}  {item['path']}\n" for item in result["artifacts"]),
        encoding="utf-8",
    )
    print(f"Verified {len(result['artifacts'])} nonempty files across five native platform artifacts")

if __name__ == "__main__":
    main()
