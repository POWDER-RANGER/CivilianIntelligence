# CIVINTELLIGENCE Cross-Repository Integration Contract

**System of record:** `POWDER-RANGER/CivilianIntelligence`

This document is the wiring contract for the six-repository CIVWATCH ecosystem. The
repositories remain independently runnable, but integration flows terminate at
CivilianIntelligence rather than creating a second application center of gravity.

## Roles

| Repository | Canonical responsibility | Integration direction |
|---|---|---|
| CivilianIntelligence | Unified app, desks, Veil, shared public-data ingest | **Hub / system of record** |
| civwatch-watchtower | Map-first civic oversight API and dashboard | Watchtower → CIVINT |
| civwatch-cell-titan | Defensive RF telemetry and evidence chain | Titan → CIVINT |
| civwatch-app | Multi-platform operator client | App → CIVINT + Titan + Watchtower |
| CIVWATCH | Legacy backend/ML/operations source material | Selective migration → CIVINT |
| civwatch-powder-ranger | Community-facing pointer/documentation | Community → CIVINT |

## Runtime rails

The hub uses these server-side environment variables:

- `WATCHTOWER_BASE_URL` — Watchtower API base, typically `http://127.0.0.1:3000` locally.
- `CELL_TITAN_BASE_URL` — Cell Titan API base, typically `http://127.0.0.1:8000` locally.

Production deployments **must configure both explicitly**. The hub does not guess
private production service addresses.

## Health contract

Every pillar must expose:

- `GET /api/health`
- JSON `status` and `version` fields
- HTTP 200 when healthy; non-2xx when unavailable/degraded

The hub probes only health metadata from the server side. It does not forward
secrets, bearer tokens, or arbitrary browser URLs.

## Data ownership

### CIVINT public feeds

The canonical public snapshots are:

- `/civint/alerts.json`
- `/civint/awards.json`
- `/civint/alpr_overpass.json` — backward-compatible ALPR view
- `/civint/surveillance.json` — normalized mapped surveillance observations
- `/civint/atlas_surveillance.json` — jurisdiction-level Atlas surveillance records
- `/civint/sources.json` — federated upstream source registry

These originate in `CivilianIntelligence/ingest` and are consumed by the hub,
Watchtower, and the Flutter client. Mature public/community projects are referenced
or consumed through their public source layer rather than cloned into separate
CIVWATCH databases.

### Watchtower

Watchtower owns map/report service behavior:

- `GET /api/features`
- `GET|POST /api/reports`
- `GET /api/civint/alerts`
- `GET /api/civint/awards`
- `GET /api/civint/alpr`
- `GET /api/civint/surveillance`

Public write access must be authenticated/rate-limited before any production
deployment.

### Cell Titan

Titan owns sensor/evidence behavior:

- `GET /api/health`
- `GET /api/telemetry/recent`
- `GET /api/observations` — authenticated user-device observation envelope
- `GET /api/evidence/verify`
- `GET /api/evidence/tail`
- privileged writes under bearer-token control

Titan must stay loopback-only by default. Remote device access requires an
explicit secure transport boundary (TLS/VPN) plus authentication.

## Evidence and provenance

Every promoted signal should retain:

1. source/system identifier,
2. source timestamp or snapshot age,
3. confidence/quality metadata where applicable,
4. an explicit "live", "snapshot", "demo", or "unavailable" state.

The UI must not silently promote demo/placeholder records to live intelligence.

## Release gate

The ecosystem is not considered integrated until:

- CivilianIntelligence typecheck/test/build are green.
- Watchtower typecheck/build are green.
- Cell Titan pytest is green on supported Python versions.
- Flutter analyze/test/build are green for declared targets.
- CIVWATCH security scanners and relevant backend/ML tests are green.
- No committed secrets, open-LAN Titan defaults, or unauthenticated public
  report/feature writes remain.


## Federated surveillance source strategy

CIVINT's canonical mapped-infrastructure input is OpenStreetMap's public surveillance
tagging. DeFlock and FlockHopper are treated as compatible community ecosystems through
the OSM objects they already publish, not as databases to scrape or replicate. Evidence-
backed sources such as FlockRadar and Atlas of Surveillance remain provenance/reference
inputs for future record joins.

The normalized surveillance contract deliberately separates observation from conclusion:
a mapped ALPR, camera, or acoustic sensor is evidence that an object was mapped, not proof
that it is currently operating, who owns it, what data it transmits, or whether its use is
lawful. Additional claims require independent public records or first-party/user-owned
telemetry.
