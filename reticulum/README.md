# CIVINTELLIGENCE Reticulum

Initial Windows/Linux bootstrap scaffolding for a future offline communications capability.

**Current status:** installation scripts, a shared diagnostic, and a manual two-node probe are committed on the feature branch; they have not yet been executed on target platforms, and offline message delivery is not verified.

## Install

From the repository root:

- Windows PowerShell: `reticulum/scripts/install-windows.ps1`
- Linux: `bash reticulum/scripts/install-linux.sh`

The scripts create `reticulum/.venv`, install the upstream `rns` Python package, and run `reticulum/scripts/verify_install.py`. The diagnostic reports the Python version, Reticulum package version, module path, and whether the `rnsd` and `rnstatus` commands are visible in the environment. It does not start a daemon, configure interfaces, modify firewall rules, or transmit messages.

Initial installation requires internet access to download the package. The subsequent local-network communication test is designed to run without public internet access.

## Manual two-node probe

Use two computers on the same local Ethernet/Wi-Fi network. Keep public internet disconnected for the acceptance test, but leave the local network link active. Use a separate, dedicated Reticulum config directory on each computer; do not point this test at an existing configuration unless you intend to reuse it.

Start the receiving node on Computer A.

Windows PowerShell:

```powershell
.\reticulum\.venv\Scripts\python.exe reticulum\scripts\offline_probe.py server --config "$HOME\civint-reticulum-test"
```

Linux:

```bash
reticulum/.venv/bin/python reticulum/scripts/offline_probe.py server --config "$HOME/civint-reticulum-test"
```

Copy the destination hash printed by Computer A. On Computer B, run the client using its own dedicated config directory and a unique, non-sensitive message. Replace the example hash with the actual hash printed by the server.

Windows PowerShell:

```powershell
.\reticulum\.venv\Scripts\python.exe reticulum\scripts\offline_probe.py client --config "$HOME\civint-reticulum-test" --destination ACTUAL_SERVER_HASH --message "CIVINT-OFFLINE-TEST-001"
```

Linux:

```bash
reticulum/.venv/bin/python reticulum/scripts/offline_probe.py client --config "$HOME/civint-reticulum-test" --destination ACTUAL_SERVER_HASH --message "CIVINT-OFFLINE-TEST-001"
```

The client waits for a route and then for a Reticulum delivery proof. The receiver should print a `RECEIVED` log with the exact payload. Record the test as passed only when the client reports a delivery proof **and** the receiver log confirms the exact unique payload while public internet access is unavailable.

The probe does not automatically disconnect the internet, configure interfaces, change firewall rules, open ports, or upload results. If peer discovery fails, stop and inspect the configured Reticulum interfaces and local network isolation; do not disable the firewall broadly.

## Next milestone

Run and record the installation and two-node test on a named Windows version and a named Linux distribution. Then add recovery testing before building a GUI or integrating CIVWATCH.

See [the implementation plan](../docs/RETICULUM_IMPLEMENTATION.md) for scope, security boundaries, and release criteria.
