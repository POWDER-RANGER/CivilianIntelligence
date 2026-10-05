# Find the Record, Don't Replace It

CIVINTELLIGENCE treats the record as the product. The Desk Assistant is a finder: it turns a plain-language request into a structured retrieval request, then points the user to the indexed record and the official source.

## Evidence-path rule

The model may touch the user's request and navigation metadata. It does not rewrite the retrieved result into an authoritative answer.

The Record Index is responsible for returning stable record IDs, title, agency, dates, identifiers, source/original URL, retrieval time and method, adapter version, hash/hash basis, and typed related-record edges. The UI renders these fields directly from the index.

## Chain of custody

A record is identified by a stable CIVINT ID derived from the source ID plus the source-native record ID. Every ingestion must provide either the retrieved content or an externally computed SHA-256 hash. The index records whether the hash covers the actual document or only an observation/metadata payload.

Each re-retrieval is retained in record_versions when its hash changes. CIVINT therefore never silently overwrites the historical observation.

The first Record Index release deliberately keeps embeddings as provider-neutral JSON metadata. pgvector is a later retrieval phase rather than a prerequisite for basic indexing or local preview compatibility.

## Search order

Search is deliberately explainable:

1. exact identifier match
2. PostgreSQL full-text search
3. structured filters
4. semantic/vector retrieval later, labeled explicitly as similarity retrieval

The API returns a human-readable match reason. No numeric relevance score is exposed as a truth claim.

## Dossier

Every indexed record has a stable Dossier route at /records/:id.

The Dossier puts the official/source record first, then provenance, typed relationships, version history, and a clearly separated CIVINT context panel. CIVINT-authored metadata must never be presented as source text.

When a safe internal body reference exists, a future renderer can show the document itself. Source HTML must never be injected directly into the CIVINT shell.

## Assistant boundary

The intended evidence path is:

`request -> intent/query -> Record Index -> record IDs -> Dossier`

Not:

`request -> model reads document -> model summarizes -> user trusts answer`

No-result behavior is explicit. An empty index response means only that no matching indexed record was found. The Toolkit becomes the next path for a public-record request.

## Extensions that preserve the principle

The same record and edge contract can support:

- citation/permalink export
- Verify and hash comparison
- record changelogs
- archive snapshots where licensing permits
- contradiction pairs
- What's New
- opt-in Watches
- timelines
- later semantic retrieval
- PWA/Desk client

These are consumers of the evidence layer, not replacements for it.
