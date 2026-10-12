# U.S.-Only God's Eye Data Integration

**Status:** Implementation contract; not yet a completed data integration  
**Product scope:** CIVINTELLIGENCE currently serves the United States.  
**Goal:** Reuse useful public-data layers from God's Eye View inside CIVINTELLIGENCE's U.S.-focused experience without presenting a worldwide dashboard as U.S.-filtered.

## Current state

The route src/routes/globe.tsx embeds the separate God's Eye View service in an iframe. The URL sets an initial camera position over Austin, Texas, but a U.S. camera position is not a geographic data filter. The embedded viewer can still request global or non-U.S. feeds.

The ALPR map is separately implemented with MapLibre, a U.S.-focused initial extent, and a vector-tile provider. Its map bounds are navigation settings, not a substitute for enforcing geographic scope at the source or adapter level.

## Required integration behavior

1. **United States scope:** include the 50 states and District of Columbia by default. Include U.S. territories only when explicitly supported by the selected source and labeled. Do not imply that a source covers all states or territories when it does not.
2. **Filter before display:** apply a geographic or jurisdiction filter in the data adapter or source query where supported. Use U.S. jurisdiction geometry when rectangular bounds would include Canada, Mexico, oceans, or other unwanted areas. A viewport over the U.S. alone does not enforce scope.
3. **Normalize, don't blindly copy:** map provider-specific payloads into a documented feature contract with coordinates, provider/source URL, observed or retrieved time, freshness, quality, and availability state.
4. **Preserve provenance:** every feature/layer must identify its original provider and attribution. Keep live, snapshot, estimated, simulated, stale, and unavailable states distinct. Never label a layer live just because the viewer rendered.
5. **Keep optional sources optional:** unavailable or rate-limited providers should degrade that layer without breaking the map.
6. **Respect licenses and access terms:** do not mirror, cache, or rehost third-party content unless its terms permit it. Verify each source's commercial terms before positioning this as a commercial asset.
7. **Do not infer conclusions:** a mapped camera or facility does not prove operational status, ownership, activity, or legality.

## Candidate layers and U.S. scope

| Layer | Candidate source | U.S.-scope approach | Important caveat |
|---|---|---|---|
| ALPR / mapped surveillance | Existing CIVINT OSM/DeFlock-compatible vector tiles | Keep existing U.S.-focused map and source attribution | Mapped location is not proof of operation or vehicle observations |
| Earthquakes | USGS | Use authoritative U.S. event endpoints or filter by U.S. jurisdiction/geography | Global USGS feeds may include global events; select intentionally |
| Weather alerts | NOAA/NWS | Filter active alerts to supported U.S. zones/geographies | U.S. coverage and availability vary by product |
| Aircraft | OpenSky / adsb.lol or another authorized ADS-B source | Request bounded U.S. regional snapshots and/or filter returned positions to the agreed geography | Rate limits, coverage gaps, and provider terms; OpenSky terms need review for commercial deployment |
| Public cameras / traffic | State DOT and municipal open-data sources, where permitted | Maintain an explicit state-by-state source registry and jurisdiction filter | A public camera location does not imply that a public video stream exists |
| Active fires | NASA FIRMS | Query or filter U.S. geometry and preserve observation time | Relevant endpoints require a provider key; coverage can be delayed |
| Satellites / orbital objects | CelesTrak or another permitted source | Treat orbital tracks as global by nature; only show objects relevant to a U.S. region/ground track when the use case is defined | A satellite's orbit is not confined to U.S. borders; do not mislabel it as a U.S.-only dataset |
| Maritime / vessel feeds | Authorized public/AIS source | Filter to defined U.S. coastal, territorial-water, or port geometry if approved | Coverage and access terms vary; do not imply complete vessel tracking |
| Global imagery / 3D basemap | Licensed tile/imagery provider | Set the initial view to the U.S.; imagery itself may remain worldwide | Map extent is not data-scope enforcement; preserve attribution and usage terms |

## Suggested implementation design

    God's Eye source modules
             |
             v
    CIVINT U.S. data adapters
      - provider allowlist
      - U.S. jurisdiction geometry
      - schema normalization
      - provenance and timestamps
      - per-source timeout and cache policy
             |
             v
    Shared feature contract
      { id, geometry, layer, source, observedAt,
        retrievedAt, freshness, status, quality }
             |
             v
    Existing CIVINT MapLibre / Watchtower experience

Prefer server-side adapters for sources that need secrets, provider-specific rate limiting, schema normalization, or CORS handling. Keep provider keys server-side and never embed them in the browser or iframe URL.

## Delivery phases

### Phase 1 — define and verify
- Inventory the exact feeds enabled in the deployed God's Eye build and corresponding source modules/endpoints.
- Create a source registry with geographic scope, license, attribution, authentication, rate limits, freshness, and current production status.
- Select the initial U.S. layers based on reliability and legal use, not visual appeal alone.

### Phase 2 — deliver the first vertical slice
- Implement one or two high-confidence feeds through server-side U.S.-bounded adapters.
- Render them in the existing CIVINT MapLibre experience with source, timestamp, freshness, and degraded-state UI.
- Test boundary cases at the northern/southern borders, Alaska, Hawaii, and any included territories.
- Add contract tests for U.S. filtering and tests proving out-of-scope features are excluded.

### Phase 3 — expand carefully
- Add remaining approved layers incrementally.
- Measure response latency, upstream error rate, freshness, and coverage.
- Keep the separate global God's Eye viewer clearly labeled as a separate global experience until its data is genuinely filtered or replaced by the U.S.-only integrated view.

## Acceptance criteria

- The default CIVINT experience is U.S.-focused, including the agreed state/territory scope.
- Out-of-scope point/area features are excluded by adapter/query logic, not merely hidden by camera position.
- Every visible layer has provider attribution, source timestamp/freshness, and explicit status.
- A failed upstream provider degrades only its layer.
- No credentials appear in client bundles or URLs.
- Tests cover U.S. boundary filtering, Alaska/Hawaii, malformed coordinates, stale data, and upstream failure.
- Source license and commercial-use review is complete before any commercial claim or transaction.
- The embedded global viewer is not represented as U.S.-only until this acceptance gate passes.

## Source and license diligence

The upstream God's Eye View documentation notes that code licensing does not automatically grant rights to third-party data/assets. It flags source-specific terms, required attribution, and commercial restrictions for some feeds and bundled data. Reuse only permitted data and preserve attribution. See the upstream [Data Sources & Attribution](https://github.com/bilawalsidhu/gods-eye-view/blob/main/DATA_SOURCES.md), and review the exact deployed fork/commit before implementation.

## Definition of done

A U.S.-only data adapter and map integration is complete only when source-level geographic filtering, provenance, license review, automated tests, and production verification are demonstrated. An iframe pointing at a U.S. coordinate does not satisfy this definition.
