#!/usr/bin/env python3
"""Create a dedicated, minimal Reticulum config for CIVINT local-network testing."""

import argparse
from pathlib import Path
import sys

CONFIG_TEXT = """# CIVINTELLIGENCE isolated local-network test configuration.
# This file is intentionally separate from any existing user Reticulum config.

[reticulum]
enable_transport = No
share_instance = No

[interfaces]
  [[CIVINT Local AutoInterface]]
    type = AutoInterface
    enabled = Yes
"""


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create a dedicated local AutoInterface config without overwriting files."
    )
    parser.add_argument(
        "--config",
        required=True,
        help="Dedicated Reticulum configuration directory for this test node.",
    )
    args = parser.parse_args()
    config_dir = Path(args.config).expanduser()

    try:
        config_dir.mkdir(parents=True, exist_ok=True)
        config_file = config_dir / "config"
        # Exclusive creation prevents accidentally replacing an existing config.
        with config_file.open("x", encoding="utf-8", newline="\n") as handle:
            handle.write(CONFIG_TEXT)
    except FileExistsError:
        print(
            f"Refusing to overwrite existing configuration: {config_dir / 'config'}",
            file=sys.stderr,
        )
        return 2
    except OSError as exc:
        print(f"Could not create test configuration: {exc}", file=sys.stderr)
        return 1

    print(f"Created dedicated test configuration: {config_file}")
    print("Interface: local AutoInterface (link-local IPv6 discovery, UDP transport)")
    print("Transport routing: disabled; shared system Reticulum instance: disabled")
    print("No firewall, router, service, or existing Reticulum configuration was changed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
