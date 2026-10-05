# CIVINT Desk — Implementation Roadmap

This roadmap turns the Open Desk vision into incremental, verifiable releases.

## Phase 1 — Structure & feel

1. Collapse primary navigation into Desks, Libraries, Maps, Tools, and Brief.
2. Keep Framework available as a global source browser/filter.
3. Promote global search to the primary discovery affordance.
4. Introduce Cmd/Ctrl+K search and a mobile equivalent.
5. Add the What’s New entry panel using only real indexed records.
6. Rewrite empty states around actionable next steps and source status.
7. Preserve stable URLs for every desk, library, and record.

**Acceptance:** a user can enter CIVINT, search for a public record/source, understand its provenance/status, and reach the correct surface without first learning the Framework taxonomy.

## Phase 2 — Libraries

1. Activate the curated federal Reading Room portal.
2. Wire CIA, FBI, State, DHS, NSA, and DIA collections.
3. Add collection-level search guidance and official deep links.
4. Add Reading Room metadata to global search as records become normalized.
5. Keep planned/unconfigured libraries visibly distinct from active ones.

**Acceptance:** a user can discover a declassified collection from global search and reach the originating official collection without leaving the evidence context unnecessarily.

## Phase 3 — Desk Assistant

Start rule-based and record-grounded.

1. Parse navigation/filter intents.
2. Resolve supported intents against the Record catalog.
3. Provide direct navigation and Toolkit pre-fill.
4. Explain records from attached evidence only.
5. Preserve provenance in every response.

Add an LLM only after the deterministic evidence boundary is stable.

## Phase 4 — Watches

1. Define a persisted user Watch model.
2. Evaluate Watches against real record updates.
3. Add in-app badges/feed.
4. Add optional email/webhook delivery.
5. Add browser/native push only with explicit permission.

Default state: no notifications.

## Phase 5 — CIVINT Desk clients

1. Make the web surface a strong installable PWA.
2. Extend `civwatch-app` into a focused Flutter companion.
3. Add Android/iOS widgets.
4. Add Windows system-tray and macOS menu-bar clients.
5. Add offline caching only for clearly bounded, previously retrieved public records.

Native clients consume CIVINT APIs; they do not duplicate ingest or become independent sources of truth.

## Verification gates

Each phase is complete only when the actual runtime demonstrates it.

- No “live” claim without a verified deployment.
- No “connected” claim without a successful upstream check.
- No synthetic records in production.
- No private surveillance access implied.
- No CI/build claim without execution evidence.
- Reading Room pages remain **in progress** until the Render deployment actually exposes them.

## Current state

As of October 5, 2026:

- The lighter Open Desk visual direction is already present.
- The existing app has Framework search and the current desk surfaces.
- Reading Room and source-registry work exists in mainline but still requires production deployment synchronization.
- The next engineering focus is the Open Desk navigation/search substrate, Reading Room activation, and the Record model that can unify both.
- The existing `civwatch-app` remains the native-client starting point, but mobile build readiness is not claimed until the platform projects and validation gates are complete.
