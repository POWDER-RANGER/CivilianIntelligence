# CIVINTELLIGENCE Reticulum Implementation

**Status:** Planned / bootstrap implemented on a feature branch. Target-platform execution and offline peer communication have not yet been verified.

## Mission

Provide a low-cost, beginner-accessible way to install and operate the Reticulum Network Stack on Windows and Linux, with the first acceptance target being a real message exchange between two computers when public internet access is unavailable.

Reticulum is a networking stack, not a ready-made nationwide network. Actual connectivity depends on compatible running nodes, configured interfaces, reachable peers, and local network or radio conditions.

## Phase 1 scope

1. Establish user-local installation on Windows and Linux.
2. Record installed package/runtime details and verify the Reticulum Python module imports.
3. Create an explicit, dedicated local AutoInterface configuration without overwriting existing user configuration.
4. Test two nodes over a local transport while public internet access is disconnected.
5. Publish evidence of successful delivery, failure cases, and tested OS versions.
6. Only after the offline proof passes, build a guided local control surface.

The bootstrap scripts install into a project-local `.venv`. They do not configure network interfaces, change firewall rules, create services, open ports, alter routers, or send telemetry.

## Initial architecture

- **CIVINTELLIGENCE website:** documentation and release notes only; it cannot start processes on a visitor's computer.
- **Local setup utility:** later manages installation and service lifecycle on the user's computer.
- **Reticulum (`rnsd`):** networking service and routing.
- **Local transport:** use the upstream `AutoInterface` on a compatible local Ethernet/Wi-Fi segment. The automatically generated minimal configuration does not necessarily enable a network interface, so this branch includes `reticulum/scripts/init_local_config.py` to create a dedicated test config with AutoInterface explicitly enabled. AutoInterface uses link-local IPv6 and UDP; public internet is not required, but host firewalls or access-point client isolation can still prevent discovery.
- **Test application:** `reticulum/scripts/offline_probe.py` uses Reticulum destinations and packet delivery proofs to support a manual two-node test.
- **Config safety tests:** `reticulum/tests/test_init_local_config.py` checks config creation and verifies that existing config files are not overwritten.
- **Optional cloud entry point:** only a later experiment for internet-connected peers, using a separate Linux VM and dedicated configuration. This path is not offline transport and must never be a prerequisite for local messaging.
- **CIVWATCH bridge:** out of scope until the independent offline baseline is proven and a separate opt-in integration contract is reviewed.

## Bootstrap

Windows PowerShell, from the repository root:

```powershell
.\reticulum\scripts\install-windows.ps1
```

Linux, from the repository root:

```bash
bash reticulum/scripts/install-linux.sh
```

These scripts require Python 3 and internet access to retrieve the package during installation. Internet access is needed for the initial package download; it is not required for subsequent local Reticulum communication. Inspect scripts before running them. They install into `reticulum/.venv` and do not configure system services.

The shared diagnostic at `reticulum/scripts/verify_install.py` reports the Python version, Reticulum package version, module path, and whether `rnsd` and `rnstatus` are visible on the virtual environment's PATH. This is an installation check, not a network-connectivity test.

## Dedicated local configuration

Run the initializer once on each test computer with a separate directory for each node.

Windows PowerShell:

```powershell
.\reticulum\.venv\Scripts\python.exe reticulum\scripts\init_local_config.py --config "$HOME\civint-reticulum-test"
```

Linux:

```bash
reticulum/.venv/bin/python reticulum/scripts/init_local_config.py --config "$HOME/civint-reticulum-test"
```

The helper creates a config only if no config file already exists. It refuses to overwrite an existing file. The generated config explicitly enables the local AutoInterface and disables transport routing and shared-instance use for this isolated test. It does not change firewall, router, or system-service settings.

Run the initializer unit tests from the repository root with `python -m unittest discover -s reticulum/tests -v`. These tests cover file creation and overwrite protection; they do not verify that a network interface is reachable.

## Manual two-node test

Use two computers on the same local network, with public internet disconnected but the local link preserved. Initialize a separate dedicated config directory on each node. Copy the actual destination hash from the server output; never use a made-up hash.

AutoInterface uses link-local IPv6 for discovery and UDP for transport. Host firewalls may need narrowly scoped UDP allowances for AutoInterface ports `29716` and `42671`; do not disable the firewall globally. A Wi-Fi access point with client isolation can also prevent discovery. See the [official interface documentation](https://reticulum.network/manual/interfaces.html) and [getting-started guide](https://reticulum.network/manual/gettingstartedfast.html).

The test is considered passed only when:
- the client receives a Reticulum packet delivery proof;
- the receiver log confirms the exact unique payload;
- public internet access was unavailable during the exchange;
- both OS versions, package versions, transport configuration, timestamps, and errors are recorded.

The probe does not disable internet access, configure interfaces, change firewall rules, open ports, or upload results. Test the reverse direction and restart/reconnection behavior before marking recovery verified.

## Cloud gateway decision

**Decision: no paid cloud resources and no production deployment at this stage.**

The local transport must be proven independently first. If a cloud entry point later proves useful, use a small, separately managed Linux VM with a public IP and a Reticulum `BackboneInterface` or compatible TCP interface, following the current upstream guidance. Treat it as an optional path for internet-connected nodes, not as a way to communicate after public internet access is lost.

Controls for that later experiment:
- use a dedicated non-production VM, identity, and configuration;
- keep private identity material out of GitHub, logs, screenshots, and diagnostic bundles;
- use SSH keys and restrict SSH access to a trusted source where possible;
- open only the required Reticulum listener port and required administration access;
- persist configuration and identity data securely; verify backup/recovery before upgrades;
- do not connect CIVWATCH evidence stores, production databases, or live user data;
- document monthly cost, owner, test window, and teardown steps before provisioning;
- test the local/offline path and cloud path as two independent cases.

Render remains the host for the public CIVINTELLIGENCE web application. Do not repurpose or rename production services to act as a public Reticulum TCP listener. A cloud path must not become a single hard-coded dependency for the network.

## Current bootstrap verification

The bootstrap scripts and probe are present on the feature branch. The new local-config initializer and its automated tests have been committed, but they have not yet been executed in a local runtime here. The Reticulum package was not installed as part of the code-review checks. This does not establish that the installer works on Windows/Linux, nor that offline communication has been demonstrated. No platform installation or two-node network test is claimed.

## Two-node offline acceptance test

- [ ] Two computers and exact OS versions identified.
- [ ] Reticulum package/runtime versions recorded on both.
- [ ] Dedicated config initializer succeeds on both nodes without overwriting any existing config.
- [ ] Public internet access is unavailable while the local transport remains connected.
- [ ] Each node's actual service status is captured.
- [ ] The intended peer is discovered over the selected interface.
- [ ] A test application sends a unique payload and the receiver confirms exact contents.
- [ ] The reverse direction is tested.
- [ ] Restart/reconnection behavior is tested.
- [ ] Logs are checked for secrets and private identity material before publication.

A running process, successful installation, ICMP ping, or peer discovery alone does not prove application-level message delivery.

## Security and privacy defaults

- Run as a normal user; do not request administrator/root privileges for package installation.
- Do not change firewall settings, expose public listeners, configure port forwarding, or enable relay behavior automatically.
- Do not upload telemetry or diagnostics.
- Never include identity private keys or sensitive message contents in diagnostic bundles.
- Do not transmit CIVWATCH evidence or device telemetry without a separately reviewed, explicit opt-in.
- Explain the difference between local discovery, a reachable peer, a successful message exchange, and a multi-hop route.
- Preserve the user's existing Reticulum configuration; future configuration management must back up files before modifying them.

## Release status vocabulary

| Label | Required evidence |
|---|---|
| Planned | Scope and acceptance criteria documented |
| Implemented | Code and instructions exist in the repository |
| Installation verified | Install and import checks passed on a named OS/runtime |
| Offline communication verified | Two nodes exchanged and confirmed a real message without public internet |
| Recovery verified | Documented interruption/reconnection tests passed |
| Release ready | Usability, security, compatibility, and regression gates passed |

## References

- [Reticulum getting started](https://reticulum.network/manual/gettingstartedfast.html)
- [Reticulum interfaces](https://reticulum.network/manual/interfaces.html)
- [Reticulum utilities and usage](https://reticulum.network/manual/using.html)
- [Reticulum examples](https://reticulum.network/manual/examples.html)
- [Reticulum software and applications](https://reticulum.network/manual/software.html)
