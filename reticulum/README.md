# CIVINTELLIGENCE Reticulum

Initial Windows/Linux bootstrap scaffolding for a future offline communications capability.

**Current status:** installation scripts, a shared diagnostic, and a manual two-node probe are present on the feature branch. They have not yet been executed on target platforms, and offline message delivery is not verified.

## Install

From the repository root:

- Windows PowerShell: `reticulum/scripts/install-windows.ps1`
- Linux: `bash reticulum/scripts/install-linux.sh`

The scripts create `reticulum/.venv`, install the upstream `rns` Python package, and run `reticulum/scripts/verify_install.py`. The diagnostic reports the Python version, Reticulum package version, module path, and whether the `rnsd` and `rnstatus` commands are visible in the environment. It does not start a daemon, prove network connectivity, modify firewall rules, or transmit messages.

Initial installation requires internet access to download the package. The subsequent local-network communication test is designed to run without public internet access.

## How the first offline test works

The first acceptance target is two computers connected to the same local Ethernet/Wi-Fi segment while public internet access is unavailable. The probe creates a dedicated Reticulum instance and relies on the default local `AutoInterface` when the generated configuration enables it.

Reticulum's default configuration normally enables an `AutoInterface` for local Ethernet/Wi-Fi discovery. It uses link-local IPv6 for discovery and UDP for transport; it does not require a working internet connection, router, or DHCP server. Both devices still need a functioning local link. Some access points isolate wireless clients, and host firewalls can block discovery. Reticulum documents UDP ports `29716` and `42671` for AutoInterface. Inspect the actual configuration and network policy before changing anything; do not disable the firewall broadly.

If the dedicated test configuration is missing or does not enable `AutoInterface`, generate or inspect an example configuration with the installed utility:

Windows PowerShell:

```powershell
.\reticulum\.venv\Scripts\rnsd.exe --exampleconfig
```

Linux:

```bash
reticulum/.venv/bin/rnsd --exampleconfig
```

The command prints an example configuration; it does not establish that the interface is reachable. Configure only the dedicated test directory for this experiment, and do not overwrite an existing user configuration.

## Manual two-node probe

Use two computers on the same local Ethernet/Wi-Fi network. Disconnect public internet access for the acceptance test, but leave the local network link active. Use a separate, dedicated Reticulum config directory on each computer; do not point this test at an existing configuration unless you intend to reuse it.

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

The client waits for a route and then for a Reticulum delivery proof. The receiver should print a `RECEIVED` log with the exact payload. Record the test as passed only when the client reports a delivery proof **and** the receiver log confirms the exact unique payload while public internet access is unavailable. Then test the reverse direction and restart/reconnection behavior.

The probe does not automatically disconnect internet, configure interfaces, change firewall rules, open ports, or upload results. If peer discovery fails, check the actual config, link-local IPv6, local client isolation, and host firewall policy. Make only narrow, temporary changes that you understand, and restore them after testing.

## Cloud gateway is a separate, optional phase

A cloud gateway can help internet-connected nodes reach one another, but it cannot carry messages between nodes when those nodes have no path to the internet. It is not a substitute for local/off-grid transports.

Do not provision a paid VM or change the production Render service for the first milestone. First prove local two-node delivery. If a gateway is still useful afterward, test it in a separate Linux VM with a dedicated Reticulum identity/configuration, restricted inbound rules, persistent storage for its configuration, and a documented teardown procedure. Keep public web hosting and Reticulum transport separate. See [the implementation plan](../docs/RETICULUM_IMPLEMENTATION.md).

## Next milestone

Run and record installation and the two-node test on a named Windows version and a named Linux distribution. Then add recovery testing before building a GUI or integrating CIVWATCH.

See [the implementation plan](../docs/RETICULUM_IMPLEMENTATION.md) for scope, security boundaries, cloud separation, and release criteria.
