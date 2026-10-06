# CIVWATCH Ecosystem Status

**Updated: October 5, 2026**

## Public platform

- **CIVINTELLIGENCE web:** https://civintelligence.onrender.com
- **REST/API:** active through the deployed CIVINTELLIGENCE service
- **System of record:** CIVINTELLIGENCE
- **Geospatial pillar:** Watchtower
- **Defensive RF pillar:** Cell Titan
- **Client:** civwatch-app
- **Legacy/reference:** CIVWATCH and CIVWATCH v3
- **Integration scaffold:** civwatch-ruby-gem
- **Community/documentation:** civwatch-powder-ranger

## Native applications

The web platform and REST contracts now provide the working foundation for native applications. Android, iOS, Windows, and Linux clients can be delivered as presentation/client layers over the existing service contracts.

The primary engineering advantage is that the intelligence platform no longer needs to be rebuilt for each client. Authentication boundaries, public-data contracts, provenance, evidence semantics, Watchtower mapping, Cell Titan telemetry, and desk-level APIs can be reused.

## Delivery assessment

This ecosystem reached a functioning public web milestone on a very compressed development timeline. The major architectural risk was getting the repositories to agree on ownership and contracts; that foundation now exists. Native applications are therefore substantially more straightforward than the original platform build: the remaining work is client UX, platform integration, packaging, permissions/storage, offline behavior where appropriate, release automation, and platform-specific acceptance.

## Status vocabulary

- **Live:** deployed and usable.
- **Available:** implemented and integrated.
- **In progress:** actively being built.
- **Planned:** not yet shipped.

A source outage, empty dataset, demo telemetry, or unavailable upstream is never represented as live evidence.

## Eight-repository spine

1. CivilianIntelligence — system of record
2. civwatch-watchtower — geospatial oversight
3. civwatch-cell-titan — defensive RF telemetry/evidence
4. civwatch-app — multi-platform client
5. CIVWATCH — legacy migration/source material
6. civwatch-v3 — predecessor/reference RF dashboard
7. civwatch-ruby-gem — Ruby integration scaffold
8. civwatch-powder-ranger — community/documentation surface
