# GitHub Reading Room

CIVINT treats public GitHub repositories as software artifacts that can be inspected without being executed.

## Purpose
The GitHub Reading Room teaches visitors how to evaluate a repository before downloading, installing, or running anything from it. It presents public metadata, selected source files, workflow files, dependency manifests, and concrete review prompts.

It does not certify software as safe and does not declare a repository malicious solely from automated heuristics.

## Safety boundary
CIVINT fetches repository metadata and text files server-side and renders them as untrusted content. It never executes repository code, installs dependencies, launches release binaries, or runs GitHub Actions locally.

## Review doctrine
Distinguish observations from review signals and conclusions. The absence of a signal is not a safety guarantee.

## Beginner workflow
Identify the owner; check age and recent activity; read the README; inspect installation commands; inspect `.github/workflows`; inspect dependency manifests and install scripts; review releases and integrity information; look for downloads, external endpoints, installers, and privilege escalation; and avoid running software on a trusted device when evidence is unclear.

## CIVINT itself
The application and source adapters are public so visitors can inspect how the platform works. The objective is inspectable behavior rather than a trust-me security claim.