#!/usr/bin/env python3
"""Manual two-node Reticulum delivery probe for an isolated lab.

This is a test utility, not a background service or a production messaging app.
It sends no telemetry and makes no firewall or router changes.
"""

import argparse
import math
import sys
import threading
import time

import RNS

APP_NAME = "civintelligence"
ASPECTS = ("offlineprobe", "message")


def run_server(config_path):
    RNS.Reticulum(config_path)
    identity = RNS.Identity()
    destination = RNS.Destination(
        identity,
        RNS.Destination.IN,
        RNS.Destination.SINGLE,
        APP_NAME,
        *ASPECTS,
    )
    destination.set_proof_strategy(RNS.Destination.PROVE_ALL)

    def receive_message(data, packet):
        try:
            message = data.decode("utf-8")
        except UnicodeDecodeError:
            message = repr(data)
        print(
            f"RECEIVED source={RNS.prettyhexrep(packet.packet_hash)} "
            f"bytes={len(data)} payload={message!r}",
            flush=True,
        )

    destination.set_packet_callback(receive_message)
    destination_hash = RNS.hexrep(destination.hash, delimit=False)
    print("Reticulum offline probe server ready.", flush=True)
    print(f"Destination hash: {destination_hash}", flush=True)
    print("Keep this process running; press Ctrl+C to stop.", flush=True)

    try:
        while True:
            destination.announce()
            time.sleep(30)
    except KeyboardInterrupt:
        print("\nServer stopped.", flush=True)


def run_client(config_path, destination_hex, message, timeout):
    try:
        destination_hash = bytes.fromhex(destination_hex)
    except ValueError:
        raise SystemExit("Destination hash must be hexadecimal.")

    if len(destination_hash) != RNS.Identity.TRUNCATED_HASHLENGTH // 8:
        raise SystemExit("Destination hash has an unexpected length.")

    RNS.Reticulum(config_path)

    print("Requesting destination path; waiting for peer discovery...", flush=True)
    RNS.Transport.request_path(destination_hash)
    deadline = time.monotonic() + timeout
    while not RNS.Transport.has_path(destination_hash):
        if time.monotonic() >= deadline:
            raise SystemExit(
                "FAIL: destination path was not discovered before timeout. "
                "Check both nodes' interface configuration and local network."
            )
        time.sleep(0.2)

    identity = RNS.Identity.recall(destination_hash)
    if identity is None:
        raise SystemExit("FAIL: path exists but destination identity could not be recalled.")

    destination = RNS.Destination(
        identity,
        RNS.Destination.OUT,
        RNS.Destination.SINGLE,
        APP_NAME,
        *ASPECTS,
    )
    payload = message.encode("utf-8")
    delivered = threading.Event()
    failed = threading.Event()

    packet = RNS.Packet(destination, payload)
    receipt = packet.send()
    receipt.set_timeout(timeout)
    receipt.set_delivery_callback(lambda _: delivered.set())
    receipt.set_timeout_callback(lambda _: failed.set())

    print(f"Sent payload bytes: {len(payload)}", flush=True)
    print(f"Expected payload: {message!r}", flush=True)
    print("Waiting for Reticulum delivery proof...", flush=True)

    wait_deadline = time.monotonic() + timeout
    while not delivered.is_set() and not failed.is_set():
        if time.monotonic() >= wait_deadline:
            break
        time.sleep(0.1)

    if delivered.is_set():
        print(
            "PASS: Reticulum delivery proof received. Confirm the exact payload "
            "in the server's RECEIVED log before recording the test as passed.",
            flush=True,
        )
        return 0

    print("FAIL: no delivery proof received before timeout.", file=sys.stderr, flush=True)
    return 1


def main():
    parser = argparse.ArgumentParser(
        description="Manual two-node Reticulum offline delivery probe."
    )
    subparsers = parser.add_subparsers(dest="mode", required=True)

    server = subparsers.add_parser("server", help="Start the receiving node.")
    server.add_argument(
        "--config",
        required=True,
        help="Dedicated Reticulum config directory for this test node.",
    )

    client = subparsers.add_parser("client", help="Send a test message.")
    client.add_argument(
        "--config",
        required=True,
        help="Dedicated Reticulum config directory for this test node.",
    )
    client.add_argument("--destination", required=True, help="Server destination hash.")
    client.add_argument(
        "--message",
        required=True,
        help="Unique plain-text test payload; do not use sensitive information.",
    )
    client.add_argument("--timeout", type=float, default=45.0)

    args = parser.parse_args()
    if args.mode == "server":
        run_server(args.config)
        return 0
    if not math.isfinite(args.timeout) or args.timeout <= 0:
        parser.error("--timeout must be a finite number greater than zero")
    return run_client(args.config, args.destination, args.message, args.timeout)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
