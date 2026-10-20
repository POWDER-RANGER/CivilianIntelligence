# CIVINTELLIGENCE Reticulum Implementation

**Status:** Planned; initial bootstrap scaffolding only. Offline peer communication has not yet been verified by this repository change.

## Mission

Provide a low-cost, beginner-accessible way to install and operate the Reticulum Network Stack on Windows and Linux, with the first acceptance target being a real message exchange between two computers when public internet access is unavailable.

Reticulum is a networking stack, not a ready-made nationwide network. Actual connectivity depends on compatible running nodes, configured interfaces, reachable peers, and local network or radio conditions.

## Phase 1 scope

1. Establish reproducible, user-local installation on Windows and Linux.
2. Record installed package/runtime details and verify that the Reticulum Python module imports.
3. Document service startup and status checks using upstream utilities.
4. Test two nodes over a local transport while public internet access is disconnected.
5. Publish evidence of successful delivery, failure cases, and tested OS versions.
6. Only after the offline proof passes, build a guided local control surface.

The current bootstrap scripts install into a project-local `.venv`. They do not configure network interfaces, change firewall rules, create services, open ports, alter routers, or send telemetry.

## Initial architecture

- **CIVINTELLIGENCE website:** documentation and release notes only; it cannot start processes on a visitor's computer.
- **Local setup utility:** later manages installation and service lifecycle on the user's computer.
- **Reticulum (`rnsd`):** networking service and routing.
- **Local transport:** begin with a compatible local Ethernet/Wi-Fi network and the upstream `AutoInterface` where supported by the local network.
- **Test application:** later exchanges a unique test payload between two nodes and verifies exact receipt.
- **CIVWATCH bridge:** out of scope until the independent offline baseline is proven and a separate opt-in integration contract is reviewed.

## Bootstrap

Windows PowerShell, from the repository root:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\reticulum\scripts\install-windows.ps1
```

Linux, from the repository root:

```bash
bash reticulum/scripts/install-linux.sh
```

These scripts require a working Python 3 installation and internet access to retrieve the package during installation. Internet access is required for the initial package download; it is not a requirement for later local Reticulum communication. Inspect scripts before running them. They install into `reticulum/.venv` and do not configure system services.

## Current bootstrap verification

The scripts report whether installation and Python import verification succeeded on the machine where they are run. This repository change does not claim that either script has been executed on Windows or Linux, or that offline communication has been demonstrated.

## Two-node offline acceptance test

Do not label offline communications verified until all of the following are recorded:

- [ ] Two computers and exact OS versions identified.
- [ ] Reticulum package/runtime versions recorded on both.
- [ ] A documented local transport is configured on both nodes.
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

- [Reticulum getting started](https://reticulum.network/start.html)
- [Reticulum interfaces](https://reticulum.network/manual/interfaces.html)
- [Reticulum utilities and usage](https://reticulum.network/manual/using.html)
- [Reticulum software and applications](https://reticulum.network/manual/software.html)
