#!/usr/bin/env python3
"""Report local Reticulum installation details without changing the system."""

from importlib import metadata
from pathlib import Path
import shutil
import sys

try:
    import RNS
except Exception as exc:  # Keep the diagnostic actionable on failed imports.
    print(f"Reticulum import: FAILED ({type(exc).__name__}: {exc})", file=sys.stderr)
    raise SystemExit(1)

try:
    version = metadata.version("rns")
except metadata.PackageNotFoundError:
    print("Reticulum distribution metadata: NOT FOUND", file=sys.stderr)
    raise SystemExit(1)

print(f"Python: {sys.version.split()[0]}")
print(f"Reticulum package (rns): {version}")
print(f"RNS module: {Path(RNS.__file__).resolve()}")
print("Reticulum Python import: OK")

for command in ("rnsd", "rnstatus"):
    resolved = shutil.which(command)
    if resolved:
        print(f"{command}: found ({resolved})")
    else:
        print(f"{command}: not found on this environment's PATH")

print("Scope: installation/import check only; no peer or message test was performed.")
