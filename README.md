<p>
  <img src="public/favicon.svg" width="56" height="56" alt="">
</p>

# CIVWATCH

**Public evidence about surveillance infrastructure: who is watching a place, who paid for it, and how to challenge it.**

This repository is the CIVWATCH web application and system of record. It is live at **https://civintelligence.onrender.com**. Every record links to its source; where a source is missing, the page says so.

> CIVWATCH documents publicly visible infrastructure and public records about government surveillance technology. Locations come from public records, open data (OpenStreetMap) and volunteer reports; each shows its source and verification status. We do not access camera feeds, intercept communications, or track individuals.

## Principle

Make public power legible without becoming another instrument of surveillance. Give people evidence they can inspect, connect and challenge rather than conclusions they are asked to accept. Sources stay traceable, uncertainty stays visible, and private individuals stay out of scope.

- **Make power visible.** Public spending, decisions and systems should be understandable and attributable.
- **Keep evidence attached.** Every claim stays connected to its source, retrieval date and verification status.
- **Protect individuals.** CIVWATCH studies institutions and infrastructure, never people.
- **Let people decide.** The site shows evidence and its reasoning; it does not tell readers what to conclude.

## Products

One parent brand, descriptive product names (Design Standard v2).

| Product | What it does | Where |
|---|---|---|
| **CIVWATCH Map** | Documented ALPR cameras, acoustic sensors and their view cones, with sources | `/watchtower`, `/` |
| **CIVWATCH Record** | Contracts, legislation and records with provenance | `/records`, `/place`, `/finance` |
| **CIVWATCH Cell Monitor** | Your own device's cell environment, with a signed evidence log | `/titan` · [civwatch-cell-titan](https://github.com/POWDER-RANGER/civwatch-cell-titan) |
| **CIVWATCH Globe** | National and global view of documented deployments and public feeds | `/globe` |
| **CIVWATCH Platform** | Shared backend services | [civwatch-watchtower](https://github.com/POWDER-RANGER/civwatch-watchtower) |

Desks inside the app: Movement, Oversight, Finance, Privacy, Toolkit (records requests), Reading Room, Sources and Briefing. Route paths (`/watchtower`, `/titan`, `/veil`) keep their original names so existing links work.

Retired names: CIVINT / CIVINTELLIGENCE, Watchtower (now the Platform repository codename only), CELL TITAN, God's Eye, VEIL.

## Related repositories

| Repository | Role |
|---|---|
| [CivilianIntelligence](https://github.com/POWDER-RANGER/CivilianIntelligence) | This app; system of record |
| [civwatch-watchtower](https://github.com/POWDER-RANGER/civwatch-watchtower) | CIVWATCH Platform services |
| [civwatch-cell-titan](https://github.com/POWDER-RANGER/civwatch-cell-titan) | CIVWATCH Cell Monitor |
| [civwatch-app](https://github.com/POWDER-RANGER/civwatch-app) | Flutter multi-platform client |
| [CIVWATCH](https://github.com/POWDER-RANGER/CIVWATCH) | Project site and legacy backend/ML/ingest source material |
| [civwatch-v3](https://github.com/POWDER-RANGER/civwatch-v3) | Earlier RF dashboard (predecessor) |
| [civwatch-ruby-gem](https://github.com/POWDER-RANGER/civwatch-ruby-gem) | Ruby integration scaffold |
| [civwatch-powder-ranger](https://github.com/POWDER-RANGER/civwatch-powder-ranger) | Community and documentation home |

## Design

The interface follows **CIVWATCH Design Standard v2**: IBM Plex Sans, Source Serif 4 and IBM Plex Mono; an editorial light register for records and a dark register (`data-theme="ops"`) for map, globe and cell views; Okabe-Ito category colors paired with shapes; cividis for density; no glow, no neon. Tokens live in `src/styles.css`.

## Core rules

- Public-interest first; neutral analysis over political spin.
- Evidence before inference; sources stay traceable.
- **Defensive only.** No individual targeting.
- Public data first and keyless where possible.
- Live, snapshot and unavailable states stay distinguishable; illustrative examples are labeled and never shown as live.

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
| alerts.json | Briefing / alert surfaces |
| awards.json | Briefing / Finance |
| alpr_overpass.json | Privacy / Map compatibility |
| surveillance.json | Privacy / Map / Flutter — normalized mapped surveillance infrastructure |
| atlas_surveillance.json | Privacy — jurisdiction-level Atlas surveillance records |
| sources.json | Briefing / source provenance — federated source registry |

See [ingest/README.md](./ingest/README.md).

## Pillar bridge

CIVWATCH probes specialized services server-side:

- WATCHTOWER_BASE_URL — CIVWATCH Platform API base
- CELL_TITAN_BASE_URL — Cell Monitor (civwatch-cell-titan) API base
- CELL_TITAN_API_TOKEN — optional server-side bearer credential for protected Cell Monitor reads

Production deployments should configure service URLs explicitly. Internal topology and credentials stay server-side.

Integrated hub routes:

- /watchtower
- /titan
- /veil

## Integration contract

See [docs/CROSS_REPO_INTEGRATION.md](./docs/CROSS_REPO_INTEGRATION.md) for ownership, health contracts, security boundaries, evidence/provenance, and release gates.

## Acceptance status

**Public web deployment is active; native-client release gates remain open.** The eight-repository integration spine is established with CivilianIntelligence as the system of record, and the CIVWATCH public web application plus REST/API surface are now deployed and usable. Remaining acceptance work covers executable validation, security acceptance, browser/client verification, and restoration of GitHub Actions for supplementary reproducibility. Native Android/iOS/desktop applications are the next delivery track and will consume the established service contracts rather than recreate the platform. The current Actions blocker is an account-level billing lock that prevents jobs from starting; this does not erase the fact that the public web deployment is operational.

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

The public CIVWATCH surface is organized around an evidence-first set of native desks and tools. The current production deployment includes the lighter user-facing shell, Framework, Map, Finance, Privacy, Toolkit, Cell Monitor, Briefing, Movement, and Oversight surfaces.

### Available now

- **Framework** — living civic source catalog and system map.
- **Map** — the native ALPR infrastructure atlas. It reports public infrastructure observations and provenance; it does not provide private Flock account access or individual vehicle tracking.
- **Finance** — federal spending/public-record views and the native SEC filing desk.
- **Privacy** — surveillance-system transparency and public-record pathways.
- **Toolkit** — FOIA / Privacy Act / state-request workflows with agency-aware request generation.
- **Cell Monitor** — defensive cell-network observation and evidence, subject to real device/service availability.
- **Briefing** — executive public-record briefing.
- **Movement** — government movement, calendars, hearings, and related public activity.
- **Oversight** — accountability and public-record pathways, including native Congress.gov / FOIA / Federal Register adapters where credentials or upstream availability permit.

### Activation track

The next major focus is the **Reading Room / Declassified Libraries** layer. CIVWATCH is being prepared as the interface and evidence layer for curated federal electronic reading rooms rather than as a replacement for the originating agencies.

Planned library surfaces include:

- CIA Electronic Reading Room / CREST
- FBI Vault
- State Department FOIA Virtual Reading Room
- DHS FOIA Library
- NSA Reading Room
- DIA FOIA Electronic Reading Room
- additional agency and archival reading rooms as the provenance, licensing, and maintenance model is established

The Reading Room layer is intentionally designed around official deep links, collection guidance, provenance, and later normalized metadata/search—not synthetic records or uncontrolled bulk mirroring. As each library is activated, its status will move from **planned/in progress** to **available** without changing the architectural principle: upstream records remain attributable, while CIVWATCH becomes the easier discovery and evidence surface.

### Evidence layer


**Find the Record, Don't Replace It** is now the evidence-path doctrine. The Record Index provides stable record IDs, source-native identifiers, retrieval timestamps and methods, SHA-256 content or observation hashes, version history, and typed record relationships. The `/records` surface returns pointers into that index and the `/records/:id` Dossier keeps the official/source record prominent while separating CIVWATCH-authored context.

The Desk Assistant is being built against this contract: the model can interpret a request and construct a query, but indexed results are rendered from the Record Index rather than rewritten into a synthetic answer. Empty retrieval is an honest state and routes toward the Toolkit instead of a guess.
### In progress

- **Deployment synchronization** — keeping the Render production branch aligned with the current mainline application so newly merged public surfaces are actually exposed.
- **Reading Room activation** — federal library index and declassified-record discovery surfaces.
- **Unified Search** — one evidence-first search surface spanning framework data, live desks, normalized public records, and future Reading Room metadata.
- **Cross-desk dossiers** — connecting related finance, oversight, privacy, movement, and public-infrastructure records without turning correlation into unsupported inference.
- **Evidence graph / timelines** — provenance-preserving relationships and challengeable explanations across public records.

> **Status rule:** CIVWATCH distinguishes **available**, **unconfigured**, **degraded**, and **in progress**. A planned capability is not represented as live data, and a source outage is not silently converted into a healthy state.


---

## Public platform status — October 2026

**CIVWATCH is live on the public web and its REST/API surface is active.**

**Public site:** https://civintelligence.onrender.com

The web platform is now the working reference implementation for the CIVWATCH ecosystem: the core application, public-data surfaces, evidence/provenance model, specialized pillars, and integration boundaries are being exercised through the deployed CIVWATCH service.

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

That means the next step should be treated as **client delivery on top of an operating platform**. The web application is the reference surface; native clients become additional presentation and interaction layers over the same CIVWATCH contracts.

> **Build once at the platform layer. Deliver many clients at the edge.**

### Ecosystem rule

CIVWATCH remains the system of record. Specialized repositories retain clear ownership of their domains, while clients consume stable public/service contracts. Legacy and predecessor repositories remain valuable migration/reference material but are not silently represented as unified production capabilities.

**Status discipline:** live means exposed and usable; available means implemented and integrated; in progress means actively being built; planned means not yet shipped. No synthetic or unavailable source is represented as live evidence.
