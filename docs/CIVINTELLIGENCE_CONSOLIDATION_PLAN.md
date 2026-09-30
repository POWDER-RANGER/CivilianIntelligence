# CIVINTELLIGENCE — Consolidation Plan

Consolidates the CIVWATCH ecosystem into this single project.

## Source Inventory & Disposition

| # | Source | What It Contributes | Disposition |
|---|--------|--------------------|-------------|
| 1 | CivilianIntelligence (this repo) | App shell, catalog, desks, Veil, live Federal Register feed | **Base. Adopt as-is.** |
| 2 | CIVWATCH | Architecture docs, backend + ML Docker stack, political finance modules, ops docs | **Merge modules + docs.** Execute its PR0/PR1 cleanup first (see its START_HERE.md) |
| 3 | civwatch-watchtower | Map dashboard, pipelines, anomaly detection, citizen reports | **Merge as Watchtower module** behind `/watchtower` |
| 4 | civwatch-cell-titan | ADB sensor scripts, RF ingestion, evidence chain | **Merge as sensing module**; keep standalone `launch.sh` mode |
| 5 | civwatch-powder-ranger | Community README/positioning | **Adopt as public identity**; archive after content moves |
| 6 | osintframework.com | Catalog interaction model (tree, search, node notes) | **Methodology only** — already embodied in the catalog |
| 7 | CIVWATCH GitHub Pages site | Public demo page | **Repoint** to this app when it ships |

## Phase 1 — Clean the base (1–2 weeks)
- [ ] Execute CIVWATCH PR0 damage control (remove OBELISK artifacts, false version claims) per its START_HERE.md
- [ ] Land CIVWATCH PR1 (real `/api/health`, working ML DBSCAN service, green Docker stack)
- [ ] Verify this app builds and deploys; document env vars

## Phase 2 — Merge Watchtower (2–4 weeks)
- [ ] Lift watchtower client dashboard into a `/watchtower` route
- [ ] Port pipelines (watchtower PIPELINES.md) into a shared ingestion package
- [ ] Wire anomaly detection output into Veil alerts feed

## Phase 3 — Merge Cell Titan (2–3 weeks)
- [ ] Port ADB sensor scripts and ingestion pipeline
- [ ] Add evidence-chain verification endpoint
- [ ] Surface sensor status on Veil (federated sensor count, active domains)

## Phase 4 — Merge political finance ✅ (first cut landed 2026-09-30)
- [x] Ship the Finance desk (Desk 04): PAC/party money, dark money, LD-2/LD-203 lobbying, STOCK Act trades, contract awards, state money — sourced from FEC, Senate LDA, USAspending, FollowTheMoney, OpenSecrets, Capitol Trades, ProPublica 990, and the IRS 527/990 search
- [x] Bonus: Field toolkit (Desk 05) — records request generator (federal FOIA, Privacy Act, state public records), agency FOIA offices, lookup directory, and field rules
- [ ] Deeper merge: vote correlator and promise tracker (needs the CIVWATCH backend, so gated on Phase 1)

## Phase 5 — Unify & ship
- [ ] Monorepo layout, one CI pipeline, one docker-compose
- [ ] Repoint powder-ranger.github.io/CIVWATCH to this app
- [ ] Archive superseded repos with a pointer banner
- [ ] v0.1.0 release — honest, working, community-ready

## Target Monorepo Layout

```
civintelligence/
├── app/                  # React app (catalog, desks, veil) — current src/
├── packages/
│   ├── shared/           # shared types, IntelNode registry, scoring
│   ├── ingestion/        # pipelines (register, congress, FEC, LDA) + watchtower feeds
│   └── ml/               # anomaly detection (DBSCAN), correlation
├── services/
│   ├── api/              # Node API + health (from CIVWATCH backend)
│   └── sensors/          # Cell Titan ADB scripts, evidence chain
├── docs/                 # merged architecture, API, threat model, deployment
└── docker-compose.yml
```

## Guardrails

- Every merge keeps a working demo at all times — no big-bang rewrites.
- Honesty over hype: statuses reflect reality (the CIVWATCH BETA note sets the tone).
- Defensive use only; responsible disclosure per CIVWATCH RESPONSIBLE_DISCLOSURE.md.
