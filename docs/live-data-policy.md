# CIVINTELLIGENCE live-data and attribution policy

**Project owner / software author:** Curtis Charles Farrar (GitHub: POWDER-RANGER).

## Source integrity
- Preserve factual source names, source URLs, timestamps, permitted dataset credits, and required third-party licenses. Dataset provenance is evidence, not authorship of CIVINTELLIGENCE.
- Label data **live** only when its observation and refresh time justify it. Mark older records historical; never replace a failed fetch with an empty feed.
- Maintain separate `publisher.government_level` and `event_jurisdiction.level`. A federal publisher does not make every event a federal enforcement matter. Do not derive legal jurisdiction from a place-name string.
- Rank display urgency with explicit deterministic criteria; a magnitude-based priority is not an emergency declaration.
- Preserve original observations and URLs when AI output adds summaries, classifications, or display recommendations. Never present model speculation as a verified incident.

## API and secret handling
- Public feeds that do not require credentials may be polled server-side, with timeouts and retry ceilings.
- Keep tokens out of Git, `public/`, client JavaScript, generated bundles, logs, and error responses. Use protected server-side Render environment variables in production and the protected local Dell secrets directory during development.
- Use narrowly scoped credentials, per-provider rate limits, usage monitoring, rotation, and revocation. Do not copy account passwords to source files.
- Hugging Face integration must use a fine-grained Inference Providers token supplied through `HF_TOKEN`; no token is embedded in repository files. Until authenticated and tested, label the cloud classification component **not connected**.
- Do not let a model choose third-party URLs, execute source instructions, change jurisdiction labels, or suppress critical official alerts without deterministic validation.

## Publication and delivery
- Run unit tests and source-contract validation before publishing an event adapter. Preserve the last successful snapshot during upstream outages.
- Separate direct source observations, inferred connections, and confirmed incidents in the public UI.
- Run TypeScript, lint, targeted tests, production bundling, and required GitHub CI before merging. Avoid running database migration steps as an unintended side effect of a local build.
- New first-party commits and release documents must use the owner's verified Git identity. Do not insert automated co-author markers or falsely attribute external work to the owner; retain source-required legal notices and historical Git audit records.

## Initial integration
- `python ingest/civint_ingest.py usgs`: official USGS significant-day GeoJSON, normalized by `ingest/live_intelligence.py`.
- `python ingest/civint_ingest.py daily`: existing NWS and federal spending collectors plus independently handled USGS.
- Output: `earthquakes.json` in `CIVINT_OUT`, saved by atomic replacement. A live UI connection and Hugging Face model activation require separate deployment and verification.
