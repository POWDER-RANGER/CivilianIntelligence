# CIVINTELLIGENCE Reticulum

Initial Windows/Linux bootstrap scaffolding for a future offline communications capability.

**Current status:** installation scripts and a shared diagnostic are committed on the feature branch; they have not yet been executed on target platforms, and offline message delivery is not verified.

## Install

From the repository root:

- Windows PowerShell: `reticulum/scripts/install-windows.ps1`
- Linux: `bash reticulum/scripts/install-linux.sh`

The scripts create `reticulum/.venv`, install the upstream `rns` Python package, and run `reticulum/scripts/verify_install.py`. The diagnostic reports the Python version, Reticulum package version, module path, and whether the `rnsd` and `rnstatus` commands are visible in the environment. It does not start a daemon, configure interfaces, modify firewall rules, or transmit messages.

Initial installation requires internet access to download the package. The subsequent local-network communication test is designed to run without public internet access.

See [the implementation plan](../docs/RETICULUM_IMPLEMENTATION.md) for scope, security boundaries, and the two-node offline acceptance test.

## Next milestone

Run and record the installation check on a named Windows version and a named Linux distribution. Then configure and verify a real two-node offline message exchange before building a GUI or integrating CIVWATCH.
