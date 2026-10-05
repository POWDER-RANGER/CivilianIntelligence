# CIVINTELLIGENCE

**The unified civilian intelligence platform and CIVWATCH system of record.**

CIVINTELLIGENCE is the central public-interest application for the CIVWATCH ecosystem: civic source discovery, intelligence desks, Veil executive briefing, keyless public-record ingestion, and the integration boundary for specialized pillars.

> Transparency is not optional.

## The Open Eye

The purpose of this platform is to make public power more legible without turning the platform itself into another instrument of coercion or surveillance. The record is public; our job is to make it findable.

CIVWATCH is built around a simple principle: **give people evidence they can inspect, connect, and challenge rather than conclusions they are expected to accept.** Sources remain traceable, uncertainty remains visible, and private citizens remain outside the targeting boundary. The objective is not to replace one system of control with another, but to reduce the conditions in which secrecy, intimidation, coercion, and unnecessary surveillance become substitutes for shared understanding.

### Core objective

- **Make power visible.** Public spending, public decisions, public systems, and public acts should be understandable and attributable.
- **Make evidence understandable.** Claims should remain connected to sources, provenance, and context.
- **Protect individual autonomy.** Public-interest intelligence must not become individual targeting.
- **Let people decide.** The platform provides evidence and makes its reasoning challengeable; it does not prescribe what users must believe.

> **The record is public. We are going to make it findable.**

## System of record

**CivilianIntelligence is the hub.** Other CIVWATCH repositories remain independently runnable, but production integration flows terminate here rather than creating a second application center of gravity.

| Repository | Canonical role | Status |
|---|---|---|
| [CivilianIntelligence](https://github.com/POWDER-RANGER/CivilianIntelligence) | Unified application, desks, Veil, ingest, integration contract | **System of record** |
| [civwatch-watchtower](https://github.com/POWDER-RANGER/civwatch-watchtower) | Map-first civic oversight, features, reports | Specialized pillar |
| [civwatch-cell-titan](https://github.com/POWDER-RANGER/civwatch-cell-titan) | Defensive RF telemetry and evidence | Specialized pillar |
| [civwatch-app](https://github.com/POWDER-RANGER/civwatch-app) | Flutter multi-platform operator client | Client |
| [CIVWATCH](https://github.com/POWDER-RANGER/CIVWATCH) | Legacy backend/ML/ingest/operations source material | Migration source |
| [civwatch-v3](https://github.com/POWDER-RANGER/civwatch-v3) | Earlier RF dashboard/reference implementation | Predecessor |
| [civwatch-ruby-gem](https://github.com/POWDER-RANGER/civwatch-ruby-gem) | Ruby integration/package scaffold | Extension scaffold |
| [civwatch-powder-ranger](https://github.com/POWDER-RANGER/civwatch-powder-ranger) | Community and documentation home | Community |

## Current pillars

| Pillar | Role |
|---|---|
| **Framework** | Living civic intelligence source catalog |
| **Movement** | Government movement, calendars, hearings, Federal Register |
| **Oversight** | IG, GAO, FOIA, STOCK Act, lobbying, accountability |
| **Finance** | Political finance, contracts, public federal awards |
| **Privacy** | Surveillance-system transparency and public-record paths |
| **Toolkit** | FOIA / Privacy Act / state request workflows |
| **Veil** | Executive public-record briefing |
| **Watchtower** | Geospatial oversight and report/feature surface |
| **Cell Titan** | Defensive RF telemetry and verifiable evidence |

## Core principles

- Public-interest first; neutral analysis over political spin.
- Evidence before inference; sources stay traceable.
- Transparent scoring and explicit context.
- **Defensive only.** No individual targeting.
- Public data first and keyless where possible.
- Live, snapshot, and unavailable states remain distinguishable; synthetic telemetry is not production data.

## Quick start

~~~bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build:dev
~~~

## Public-data ingest

The ingest pipeline publishes dashboard-ready snapshots under public/civint.

~~~bash
cd ingest
pip install -r requirements-dev.txt

export NWS_USER_AGENT="CIVINT (contact: your-address@example.com)"

python civint_ingest.py nws
python civint_ingest.py usaspending --max-pages 3
# Optional OSM/ALPR extraction:
# python civint_ingest.py osm --pbf iowa-latest.osm.pbf
~~~

Primary outputs:

| File | Consumers |
|---|---|
| alerts.json | Veil / alert surfaces |
| awards.json | Veil / Finance |
| alpr_overpass.json | Privacy / Watchtower compatibility |
| surveillance.json | Privacy / Watchtower / Flutter — normalized mapped surveillance infrastructure |
| atlas_surveillance.json | Privacy — jurisdiction-level Atlas surveillance records |
| sources.json | Veil / source provenance — federated source registry |

See [ingest/README.md](./ingest/README.md).

## Pillar bridge

CIVINTELLIGENCE probes specialized services server-side:

- WATCHTOWER_BASE_URL — Watchtower API base
- CELL_TITAN_BASE_URL — Cell Titan API base
- CELL_TITAN_API_TOKEN — optional server-side bearer credential for protected Titan reads

Production deployments should configure service URLs explicitly. Internal topology and credentials stay server-side.

Integrated hub routes:

- /watchtower
- /titan
- /veil

## Integration contract

See [docs/CROSS_REPO_INTEGRATION.md](./docs/CROSS_REPO_INTEGRATION.md) for ownership, health contracts, security boundaries, evidence/provenance, and release gates.

## Acceptance status

**Integration consolidated; launch gate remains open.** The eight-repository integration spine is established with CivilianIntelligence as the system of record. Production launch is gated on executable validation: local typecheck/test/build and security acceptance across the hub and specialized pillars, browser/client verification, and restoration of GitHub Actions for supplementary reproducibility. The current Actions blocker is an account-level billing lock that prevents jobs from starting; this is tracked in the launch gate issue. No production-readiness claim is made until the acceptance gates execute and pass.

Incident record: [docs/CI_RUNNER_INCIDENT_2026-10-04.md](./docs/CI_RUNNER_INCIDENT_2026-10-04.md).

## Documentation

- [CIVINTELLIGENCE charter](./docs/CIVINTELLIGENCE.md)
- [Unified architecture](./docs/CIVINTELLIGENCE_ARCHITECTURE.md)
- [Consolidation plan](./docs/CIVINTELLIGENCE_CONSOLIDATION_PLAN.md)
- [Cross-repo integration contract](./docs/CROSS_REPO_INTEGRATION.md)
- [CI runner incident](./docs/CI_RUNNER_INCIDENT_2026-10-04.md)
- [Ingest pipeline](./ingest/README.md)

## License

MIT — built for citizens, by citizens.


## Public surface & activation status

The public CIVINTELLIGENCE surface is organized around an evidence-first set of native desks and tools. The current production deployment includes the lighter user-facing shell, Framework, Watchtower, Finance, Privacy, Toolkit, Cell Titan, VEIL, Movement, and Oversight surfaces.

### Available now

- **Framework** — living civic intelligence source catalog and system map.
- **Watchtower** — geospatial oversight, including the native ALPR infrastructure atlas. It reports public infrastructure observations and provenance; it does not provide private Flock account access or individual vehicle tracking.
- **Finance** — federal spending/public-record views and the native SEC filing desk.
- **Privacy** — surveillance-system transparency and public-record pathways.
- **Toolkit** — FOIA / Privacy Act / state-request workflows with agency-aware request generation.
- **Cell Titan** — defensive RF telemetry and evidence, subject to real device/service availability.
- **VEIL** — executive public-record briefing surface.
- **Movement** — government movement, calendars, hearings, and related public activity.
- **Oversight** — accountability and public-record pathways, including native Congress.gov / FOIA / Federal Register adapters where credentials or upstream availability permit.

### Activation track

The next major focus is the **Reading Room / Declassified Libraries** layer. CIVINTELLIGENCE is being prepared as the interface and evidence layer for curated federal electronic reading rooms rather than as a replacement for the originating agencies.

Planned library surfaces include:

- CIA Electronic Reading Room / CREST
- FBI Vault
- State Department FOIA Virtual Reading Room
- DHS FOIA Library
- NSA Reading Room
- DIA FOIA Electronic Reading Room
- additional agency and archival reading rooms as the provenance, licensing, and maintenance model is established

The Reading Room layer is intentionally designed around official deep links, collection guidance, provenance, and later normalized metadata/search—not synthetic records or uncontrolled bulk mirroring. As each library is activated, its status will move from **planned/in progress** to **available** without changing the architectural principle: upstream records remain attributable, while CIVINTELLIGENCE becomes the easier discovery and evidence surface.

### Evidence layer


**Find the Record, Don't Replace It** is now the evidence-path doctrine. The Record Index provides stable record IDs, source-native identifiers, retrieval timestamps and methods, SHA-256 content or observation hashes, version history, and typed record relationships. The `/records` surface returns pointers into that index and the `/records/:id` Dossier keeps the official/source record prominent while separating CIVINT-authored context.

The Desk Assistant is being built against this contract: the model can interpret a request and construct a query, but indexed results are rendered from the Record Index rather than rewritten into a synthetic answer. Empty retrieval is an honest state and routes toward the Toolkit instead of a guess.
### In progress

- **Deployment synchronization** — keeping the Render production branch aligned with the current mainline application so newly merged public surfaces are actually exposed.
- **Reading Room activation** — federal library index and declassified-record discovery surfaces.
- **Unified Search** — one evidence-first search surface spanning framework data, live desks, normalized public records, and future Reading Room metadata.
- **Cross-desk dossiers** — connecting related finance, oversight, privacy, movement, and public-infrastructure records without turning correlation into unsupported inference.
- **Evidence graph / timelines** — provenance-preserving relationships and challengeable explanations across public records.

> **Status rule:** CIVINTELLIGENCE distinguishes **available**, **unconfigured**, **degraded**, and **in progress**. A planned capability is not represented as live data, and a source outage is not silently converted into a healthy state.


---

## Public platform status — October 2026

**CIVINTELLIGENCE is live on the public web and its REST/API surface is active.**

**Public site:** https://civintelligence.onrender.com

The web platform is now the working reference implementation for the CIVWATCH ecosystem: the core application, public-data surfaces, evidence/provenance model, specialized pillars, and integration boundaries are being exercised through the deployed CIVINTELLIGENCE service.

### Applications are next

With the web application and REST contracts now active, the remaining client work is primarily **productization and platform packaging**, not rebuilding the intelligence platform from scratch. Native applications for the major target platforms are planned and will be coming soon.

The application layer can consume the same stable contracts already used by the web experience:

- **Android**
- **iOS**
- **Windows**
- **Linux**
- additional platform clients as the shared API contract matures

The existing Flutter client and service boundaries give the ecosystem a head start. Mobile/desktop applications can progressively adopt the established authentication, API, provenance, map, evidence, and desk contracts rather than duplicating backend intelligence.

### How quickly this came together

The current milestone is notable because the ecosystem moved from a multi-repository architecture and integration plan to a functioning public platform in a short development window. The difficult architectural work — ownership boundaries, public-data ingestion, REST contracts, evidence/provenance rules, Watchtower/Cell Titan integration, and the user-facing desk model — is already substantially established.

That means the next step should be treated as **client delivery on top of an operating platform**. The web application is the reference surface; native clients become additional presentation and interaction layers over the same CIVINTELLIGENCE contracts.

> **Build once at the platform layer. Deliver many clients at the edge.**

### Ecosystem rule

CIVINTELLIGENCE remains the system of record. Specialized repositories retain clear ownership of their domains, while clients consume stable public/service contracts. Legacy and predecessor repositories remain valuable migration/reference material but are not silently represented as unified production capabilities.

**Status discipline:** live means exposed and usable; available means implemented and integrated; in progress means actively being built; planned means not yet shipped. No synthetic or unavailable source is represented as live evidence.
