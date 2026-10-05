# Signal vs. Record

## Purpose

Signal vs. Record is the first flagship VEIL evidence-layer surface. It separates attention from record without asking CIVINT to decide which is true.

- Signal: permitted headline/feed metadata and the volume/timing of coverage.
- Record: indexed primary public records with provenance, identifiers, dates, and original-source links.
- CIVINT: the interface, matching, provenance, and evidence layer — not an adjudicator.

## Common contract

StoryCluster is a first-class object so the same cluster can later power global search, Desk Assistant context, What’s New, watches, and timelines. EvidenceRecord is the shared public-record contract.

## Matching

1. Exact identifier/entity + time window → hard match (1.0).
2. Strong keyword + entity overlap → strong match (0.7–0.9).
3. Agency + topic co-occurrence → soft match (0.4–0.6).
4. Historical Reading Room relationship → historical boost (0.3).
5. Default display threshold → 0.4; weaker matches can be exposed explicitly.

Match explanations are stored with the cluster. Bias/reputation labels never influence matching.

## Absence language

Use: "No matching indexed public record found in this window."

Always follow it with: "This does not establish that no record exists. CIVINT may not have the relevant source, document, or indexing coverage yet."

## Media ingestion guardrails

Initial adapters should prefer official RSS or other permitted feeds. Store outlet, headline, URL, publication time, optional author, permitted description/snippet, extracted entities, and provenance. Do not mirror full article text without the rights to do so.

The first implementation intentionally contains no synthetic stories or fabricated matches. The UI remains useful as an activation surface until permitted feed adapters are configured.

## Next build sequence

1. Add server-side permitted-feed adapters with timeouts, cache headers, source attribution, and per-source licensing notes.
2. Normalize media items into MediaItem and public records into EvidenceRecord.
3. Run deterministic clustering/matching and persist only explainable evidence.
4. Replace the empty activation state with live clusters.
5. Feed clusters into global search, Desk Assistant, What’s New, and Watches.
6. Expose the same APIs to the future CIVINT Desk companion.
