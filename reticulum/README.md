# CIVINTELLIGENCE Reticulum

Initial Windows/Linux bootstrap scaffolding for a future offline communications capability.

**Current status:** planned implementation with installation scripts committed; no claim of executed platform tests or verified offline message delivery.

## Install

From the repository root:

- Windows PowerShell: `reticulum/scripts/install-windows.ps1`
- Linux: `bash reticulum/scripts/install-linux.sh`

The scripts create `reticulum/.venv`, install the upstream `rns` Python package, and verify that Python can import `RNS`. They do not start a persistent daemon, configure interfaces, modify firewall rules, or transmit messages.

See [the implementation plan](../docs/RETICULUM_IMPLEMENTATION.md) for scope, security boundaries, and the two-node offline acceptance test.

## Next milestone

Run and record the installation check on a named Windows version and a named Linux distribution. Then configure and verify a real two-node offline message exchange before building a GUI or integrating CIVWATCH.
