# CIVINTELLIGENCE

**The unified civilian intelligence platform.**

One project consolidating the CIVWATCH ecosystem: a browsable civic source catalog, intelligence desks, a live dashboard, and keyless data pipelines that keep public-record feeds current.

> Transparency is not optional.

## Pillars

| Pillar | Role | Status |
|--------|------|--------|
| **Framework** | Living index of civic intelligence sources — tree, search, per-node notes, source markers | Live |
| **Movement desk** | Executive calendars, Congress floor/hearings, live Federal Register feed | Live |
| **Oversight desk** | IG reports, GAO, FOIA releases, STOCK Act trades, lobbying — severity-tagged | Live |
| **Finance desk** | PAC money, dark money, lobbying, official trades, contracts — plus live federal surveillance awards from USAspending | Live |
| **Privacy desk** | Surveillance system tracker with a public-record path for every system — plus mapped ALPR points from OpenStreetMap | Live |
| **Field toolkit** | Records request generator (FOIA / Privacy Act / state), agency FOIA offices, field rules | Live |
| **Veil** | Executive brief: metrics, signals, Federal Register, NWS alerts, surveillance awards | Live |
| **Watchtower** | Map-first civic oversight: features/reports API, CIVINT soft-proxy, situational dashboard | Operational baseline ([civwatch-watchtower](https://github.com/POWDER-RANGER/civwatch-watchtower)) |
| **Cell Titan** | Defensive RF observability: demo telemetry, hash-chained evidence, optional ADB sensors | Operational baseline ([civwatch-cell-titan](https://github.com/POWDER-RANGER/civwatch-cell-titan)) |

## Core principles

- Public-interest first. Neutral analysis over political spin.
- Evidence-based reporting — every claim traceable to a primary source.
- Transparent scoring and traceable context.
- **Defensive only.** Protecting citizens from surveillance and abuse — never targeting individuals.
- **Keyless where possible.** The CIVINT ingest pipeline uses only public APIs (NWS, USAspending, OSM extracts). No vendor API keys.

## Quick start

```bash
npm ci
npm run dev          # http://localhost:8080
npm run typecheck
npm test
npm run build:dev
```

### CIVINT ingest (keyless data)

```bash
cd ingest
pip install -r requirements-dev.txt   # requests; add osmium for OSM

export NWS_USER_AGENT="CIVINT (contact: you@real-address)"

python civint_ingest.py nws
python civint_ingest.py usaspending --max-pages 3
# optional ALPR map points from a Geofabrik extract:
# python civint_ingest.py osm --pbf iowa-latest.osm.pbf

mkdir -p ../public/civint
cp civint_data/alerts.json civint_data/awards.json ../public/civint/ 2>/dev/null || true
```

Outputs land in `civint_data/` (gitignored) and are published to `public/civint/` for the app:

| File | Desk / consumer |
|------|-----------------|
| `alerts.json` | Veil — NWS active alerts (IA / IL / MO by default) |
| `awards.json` | Veil + Finance — federal awards matching Flock / ALPR terms |
| `alpr_overpass.json` | Privacy — mapped license-plate-reader nodes (OSM) |

Full pipeline notes: [`ingest/README.md`](./ingest/README.md).

Nightly publish is defined in [`.github/workflows/ingest.yml`](./.github/workflows/ingest.yml). Set the Actions variable **`NWS_USER_AGENT`** before the scheduled job will call NWS.

## Live panels

| Component | Route | Source |
|-----------|-------|--------|
| NWS alerts + surveillance awards | `/veil` | `getCivintAlerts` / `getCivintAwards` |
| **AwardsPanel** (federal, match-strength badges, USAspending links) | `/finance` | USAspending via ingest |
| **AlprPanel** (operator counts, extract age) | `/privacy` | OSM ALPR snapshot via ingest |

Loaders live in [`src/lib/civint-feeds.ts`](./src/lib/civint-feeds.ts). They fail soft (empty UI) when snapshots are missing, so the rest of the desk stays usable.

## Sister pillars (run separately)

| Repo | Start |
|------|-------|
| [civwatch-watchtower](https://github.com/POWDER-RANGER/civwatch-watchtower) | `pnpm install && pnpm dev:server` → `:3000` |
| [civwatch-cell-titan](https://github.com/POWDER-RANGER/civwatch-cell-titan) | `./launch.sh` → `:8000` |

## Documentation

- [CIVINTELLIGENCE charter](./docs/CIVINTELLIGENCE.md) — what the unified platform is
- [Unified architecture](./docs/CIVINTELLIGENCE_ARCHITECTURE.md) — system design and data flow
- [Consolidation plan](./docs/CIVINTELLIGENCE_CONSOLIDATION_PLAN.md) — phased merge of the source repos
- [Ingest pipeline](./ingest/README.md) — NWS, USAspending, OSM ALPR, quote verifier

## Tech stack

React 19 · TanStack Start / Router / Query · Tailwind v4 · Radix UI · Vite · Python 3.12 (ingest)

## License

MIT — built for citizens, by citizens.
