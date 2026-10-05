# CIVINTELLIGENCE — The Open Desk

## Product direction

CIVINTELLIGENCE is evolving from a collection of useful pages into a single civilian intelligence surface: **The Open Desk**.

> **Public power, made findable. Evidence stays attached. You stay in control.**

The interface should feel like a calm professional research desk: high-contrast light UI, precise typography, minimal decoration, explicit provenance, and no conspiratorial or command-center aesthetic.

## Information architecture

The primary navigation collapses into four modes plus one always-available brief:

| Mode | Scope | Mental model |
|---|---|---|
| **Desks** | Movement, Oversight, Finance, Privacy | Daily operational views |
| **Libraries** | Reading Rooms, declassified collections, Framework/source catalog | Deep research and historical collections |
| **Maps** | Watchtower, Cell Titan | Spatial and infrastructure evidence |
| **Tools** | FOIA/request workflows, entity lookup, future watches | Action surface |
| **Brief** | VEIL / What’s New / current changes | Start-of-day status |

The Framework tree becomes a **global source browser and filter**, not a mandatory destination. Users should be able to reach records without first understanding CIVINT's internal taxonomy.

## First-class Record model

Every public source and evidence object should converge on a common Record contract:

- title
- civilian description
- provenance / originating agency
- last verified or observed timestamp
- record type
- source status
- related records
- original-source URL
- CIVINT view URL, when normalized or indexed
- retrieval / publication timestamps where available
- confidence and transformation metadata where applicable

Record types can include Portal, API, Reading Room, Award, Filing, Bill, Document, FOIA release, Infrastructure, and similar public-record objects.

The catalog becomes the substrate for global search, the Framework/source browser, related-record panels, dossiers, timelines, the Desk Assistant, and future Watches.

**Principle:** remove the need to navigate the source's UI, not the source's attribution.

## Global discovery

The primary search surface becomes a global **Cmd/Ctrl+K** command/search experience.

Search should span, as data becomes available:

1. Framework/source records
2. live desk records
3. normalized public-record snapshots
4. Reading Room metadata
5. cross-desk relationships

Results should expose type, provenance, freshness/status, and confidence before a user opens them.

## Desk Assistant

The Desk Assistant is an always-available navigation and evidence interface.

Initial implementation should be deterministic and record-grounded. It may:

- translate natural language into filters
- jump to a desk, library, collection, or record
- pre-fill the Toolkit with a supported request
- explain a record using attached evidence
- surface related records

Every answer must resolve to records that exist in the CIVINT index and retain a provenance chip. Unsupported conclusions must be stated as unsupported. A real LLM layer can be added later without changing that evidence boundary.

## On-entry experience

The default entry experience should answer **“why should I care today?”** before asking the user to browse.

### What’s New

A dismissible panel or sheet presents 3–5 high-signal updates across the desks:

- civilian one-line summary
- record type
- provenance
- freshness
- direct navigation

Users can mark all as seen. A compact update strip can remain available without forcing the panel open every session.

No fabricated or synthetic updates are permitted.

## Watches and notifications

Notifications are opt-in and zero by default.

A Watch is a user-owned rule over indexed public records, for example:

- a new ALPR-related award above a chosen threshold
- a new Reading Room collection
- a new Oversight record tagged to a topic

Delivery can eventually include in-app feed, email digest, webhook, and browser/native push.

Watch evaluation must operate on real indexed records and preserve the same provenance and evidence rules as the web surface.

## Reading Rooms

Reading Rooms are a major activation track.

Initial curated federal libraries:

- CIA Electronic Reading Room / CREST
- FBI Vault
- State Department FOIA Virtual Reading Room
- DHS FOIA Library
- NSA Reading Room
- DIA FOIA Electronic Reading Room

The first release should favor official collection links, search guidance, attribution, and provenance. Normalized metadata/search can expand incrementally.

No synthetic records. No uncontrolled bulk mirroring. No replacement of originating agencies.

## CIVINT Desk companion

**CIVINT Desk** is a thin client, not a second application center of gravity.

It consumes the same CIVINT APIs and public endpoints and exposes:

- Desk Assistant
- What’s New
- global search / jump-to-record
- active Watches
- quick actions
- notifications
- optional widgets
- stable deep links back to web records

The existing `civwatch-app` Flutter repository is the intended starting point for native Android/iOS work. Desktop companions can follow the same thin-client contract.

### Rollout

**A — Web:** establish The Open Desk and the record/search substrate.

**B — PWA:** make the web surface installable.

**C — Native companion:** Android/iOS widgets and focused clients; desktop tray/menu-bar surfaces.

**D — Offline/richer native:** only after demand demonstrates the need.

The web application remains the source of truth. Heavy ingest, provenance, caching, and evidence processing stay server-side.

## Guardrails

- Evidence before inference.
- Source attribution remains attached.
- No synthetic production data.
- Public-interest intelligence must not become individual targeting.
- Live, unconfigured, degraded, and in-progress states remain distinct.
- Public ALPR surfaces describe infrastructure observations; they do not imply private account access, current operation, ownership, or individual vehicle tracking.
- Client applications never become a parallel source of truth.
