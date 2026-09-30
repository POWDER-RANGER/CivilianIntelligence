# CIVINTELLIGENCE — Unified Architecture

## Design Goal

One application: a citizen opens CIVINTELLIGENCE, browses the catalog of civic sources, reads the desks, watches the Veil dashboard, sees Watchtower's map and anomaly alerts, and — if running a sensor — contributes RF telemetry to Cell Titan. One identity, one stack, one repo.

## System Map

```
                     ┌──────────────────────────────────┐
                     │       CIVINTELLIGENCE APP        │
                     │  (React + TanStack Start, Vite)  │
                     └──────────────┬───────────────────┘
                                    │
        ┌───────────┬───────────────┼────────────────┬──────────────┐
        ▼           ▼               ▼                ▼              ▼
  ┌──────────┐ ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌────────────┐
  │ CATALOG  │ │  DESKS   │  │   VEIL    │  │ WATCHTOWER │ │ CELL TITAN │
  │ (source  │ │ Movement │  │ (live     │  │ (map,      │ │ (RF sensor │
  │  tree,   │ │ Oversight│  │  metrics, │  │  anomalies,│  │  telemetry,│
  │  search, │ │ Privacy  │  │  signals, │  │  citizen   │  │  evidence  │
  │  markers)│ │ Finance* │  │  register │  │  reports)  │  │  chain)    │
  └────┬─────┘ └────┬─────┘  └─────┬─────┘  └─────┬──────┘  └─────┬──────┘
       │            │              │              │               │
       └────────────┴──────┬───────┴──────────────┴───────────────┘
                          ▼
              ┌──────────────────────────┐
              │      DATA LAYER           │
              │ • Ingestion pipelines    │
              │   (Federal Register,     │
              │    Congress.gov, FEC,    │
              │    LD-2/LD-203, FOIA)    │
              │ • Postgres + cache       │
              │ • ML anomaly detection   │
              │   (DBSCAN clustering)    │
              │ • Event-sourced storage  │
              └──────────────────────────┘

  * Finance desk merges in Phase 4
```

## Module Responsibilities

### 1. Catalog (`src/data/catalog.ts`)
- Tree-structured index of civic intelligence sources with markers (Primary / Analysis / Journalistic).
- Search, expand/collapse, node detail panel — the OSINT Framework interaction model, applied to civic sources.
- The shared `IntelNode` data model becomes the platform-wide source registry: every event anywhere in the system references a catalog node ID.

### 2. Desks (`src/routes/`)
- **Movement** — executive calendars, Congress floor/hearings, live Federal Register feed (`getRegisterFeed`).
- **Oversight** — IG reports, GAO, FOIA releases, STOCK Act trades, lobbying registrations, hearings; severity-tagged (alert/watch).
- **Privacy** — surveillance system tracker by category (federal, police, biometric, broker, border, fusion, platform) with risk state (expanding/contested).
- **Finance (planned)** — contributions, PAC activity, dark money, LD-2/LD-203 lobbying, voting record correlation, promise tracker.

### 3. Veil (dashboard pillar)
- Aggregated metrics across desks: live signal counts, alerts, expanding-risk privacy systems, Federal Register connectivity.
- Becomes the landing overview; deep-links into desks and catalog nodes.

### 4. Watchtower (from civwatch-watchtower)
- Map-first situational awareness: public activity overlays, emergency service context, historical footprints.
- Pipelines: ingestion → anomaly detection → neutral scoring → visualization.
- Citizen reports: structured community submissions with traceable context.

### 5. Cell Titan (from civwatch-cell-titan)
- Federated Android sensors over ADB: Cellular, Wi-Fi, D2D, Transport domains.
- Cross-domain correlator + SHA-256 cryptographic evidence chain + event-sourced storage.
- Joins as a strictly **defensive** sensing module feeding the same anomaly/scoring layer.

## Data Flow

1. **Ingest** — scheduled pulls of public feeds (Federal Register, Congress.gov, FEC, Senate LDA, agency IG sites) + sensor telemetry.
2. **Normalize** — events reference catalog node IDs (shared source registry).
3. **Analyze** — ML anomaly detection (DBSCAN), neutral scoring, cross-domain correlation.
4. **Present** — Veil metrics, desk pages, Watchtower map, alerts.
5. **Preserve** — event-sourced storage; cryptographic evidence chain for sensor data.

## Tech Stack (unified)

- **App**: React 19, TanStack Start/Router/Query/Table, Tailwind v4, Radix UI (this repo)
- **Backend services**: Node API + health endpoint, FastAPI ML service (from CIVWATCH docker stack)
- **Sensors**: ADB telemetry scripts (from Cell Titan)
- **Infra**: Docker Compose, Vercel, Postgres + cache

## Non-Goals

- No targeting of private individuals — sources monitor institutions, not people.
- No offensive RF capability — defensive observability only.
- No unlicensed scraping of non-public data.
