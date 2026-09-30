# CIVINTELLIGENCE — Project Charter

**The unified civilian intelligence platform.** This repo is the consolidation point for the entire CIVWATCH ecosystem: one project, one identity, one mission — make civic signals visible, understandable, and actionable.

> Transparency is not optional.

---

## What This Is

CIVINTELLIGENCE unifies five previously separate projects (plus the OSINT Framework methodology) into one platform:

| Pillar | Role | Source |
|--------|------|--------|
| **📚 Catalog** | Living, browsable index of civic intelligence sources — the OSINT Framework interaction model applied to government oversight instead of people-hunting | This repo (`src/data/catalog.ts`) |
| **🏛️ Desks** | Movement, Oversight, Privacy — raw sources turned into readable, severity-tagged intelligence | This repo (`src/routes/`) |
| **🛡️ Veil** | Live dashboard: metrics, signals, Federal Register feed with connectivity status | This repo (`/veil`) |
| **🗼 Watchtower** | Map-first civic monitoring, anomaly detection, citizen reports | [civwatch-watchtower](https://github.com/POWDER-RANGER/civwatch-watchtower) — merging in |
| **📡 Cell Titan** | Defensive RF observability: federated Android sensors, cryptographic evidence chain | [civwatch-cell-titan](https://github.com/POWDER-RANGER/civwatch-cell-titan) — merging in |
| **💰 Political Finance** | Contributions, PACs, dark money, lobbying (LD-2/LD-203), voting record correlation | [CIVWATCH](https://github.com/POWDER-RANGER/CIVWATCH) — merging in |

## Related Projects Being Consolidated

- [CIVWATCH](https://github.com/POWDER-RANGER/CIVWATCH) — parent platform: backend + ML Docker stack, finance modules, ops docs. Execute its PR0/PR1 cleanup (START_HERE.md) before merging.
- [civwatch-watchtower](https://github.com/POWDER-RANGER/civwatch-watchtower) — the oversight pillar (map dashboard, pipelines, citizen reports).
- [civwatch-cell-titan](https://github.com/POWDER-RANGER/civwatch-cell-titan) — the sensor layer (ADB telemetry, evidence chain).
- [civwatch-powder-ranger](https://github.com/POWDER-RANGER/civwatch-powder-ranger) — community positioning; its README becomes the public identity.
- [osintframework.com](https://osintframework.com/) — methodology reference for the catalog structure.
- [CIVWATCH site](https://powder-ranger.github.io/CIVWATCH/) — live demo page; repoints here once consolidated.

## Core Principles

- Public-interest first. Neutral analysis over political spin.
- Evidence-based reporting — every claim traceable to a primary source.
- Transparent scoring and traceable context.
- **Defensive only.** Protecting citizens from surveillance and abuse — never targeting individuals.

## Documents

- [ARCHITECTURE](./docs/CIVINTELLIGENCE_ARCHITECTURE.md) — unified system design and data flow
- [CONSOLIDATION_PLAN](./docs/CIVINTELLIGENCE_CONSOLIDATION_PLAN.md) — phased plan merging the source repos into this project

## License

MIT — built for citizens, by citizens.
