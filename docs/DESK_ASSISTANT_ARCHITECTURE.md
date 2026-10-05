# Desk Assistant Foundation

The Desk Assistant is a constrained retrieval system, not a general chatbot.

## Indexes

1. Record Index — every indexed public record, with structured fields and searchable text.
2. Schema / Navigation Index — desks, routes, filters, card types, and supported actions.
3. Cluster / Signal Index — StoryCluster objects and their explainable record matches.

Every successful ingest should enqueue an index update. Schema/deploy changes should rebuild navigation metadata. Signal clusters refresh on their ingest cadence.

## Request path

**Cache/exact → deterministic intent → retrieval → optional generation → response contract.**

Common questions should resolve without an LLM. Retrieval should normally provide 5–12 chunks. Complex synthesis may use a stronger model, but only after grounded retrieval.

## Response contract

Every response contains:
- direct answer or navigation action;
- supporting record IDs, short titles, and provenance;
- confidence or explicit no-strong-match state;
- suggested next actions.

## Hard boundary

The assistant never treats model knowledge as CIVINT evidence. No retrieved evidence means no factual CIVINT answer. The absence state must say that the relevant record may not be indexed.

## Scale

Keep the interactive path stateless. Cache exact/structured results aggressively. Move embeddings, indexing, cluster refreshes, summaries, and complex work to background jobs. Add rate limits and latency/token telemetry before broad rollout.

## Privacy

Query logging must be minimized and anonymized where possible. User-specific watches and session context are opt-in. Personalization never expands the evidence boundary beyond the CIVINT index.
