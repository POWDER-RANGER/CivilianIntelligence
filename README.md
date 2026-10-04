# CIVINTELLIGENCE

**The unified civilian intelligence platform and CIVWATCH system of record.**

CIVINTELLIGENCE is the central public-interest application for the CIVWATCH ecosystem: civic source discovery, intelligence desks, Veil executive briefing, keyless public-record ingestion, and the integration boundary for specialized pillars.

> Transparency is not optional.

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
- Demo, snapshot, live, and unavailable states remain distinguishable.

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
| alpr_overpass.json | Privacy / Watchtower |

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

**Merged core, pending CI/CD validation.** The eight-repository integration spine has been merged into the primary codebases. Automated validation is currently blocked by a reproducible GitHub Actions setup/logging failure in which jobs are created but terminate before reporting executable steps. No production-readiness claim is made until CI, tests, builds, and security gates execute and pass.

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
