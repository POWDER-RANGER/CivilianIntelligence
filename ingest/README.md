# CIVINT Ingest

Keyless data pipelines that feed the CIVINTELLIGENCE data layer (Privacy desk, Finance desk, Watchtower / Veil).

The pipeline treats mature public/community projects as upstream evidence, not competitors to rebuild:
OpenStreetMap is the canonical mapped-infrastructure source; DeFlock and FlockHopper data are
consumed through the OSM objects they already publish rather than scraped into a duplicate
database.

## `civint_ingest.py`

```bash
pip install requests osmium   # osmium only needed for the osm command

export NWS_USER_AGENT="CIVINT (contact: you@real-address)"
# optional
export CIVINT_OUT=civint_data
export CIVINT_PBF=iowa-latest.osm.pbf
# optional Atlas CSV source for daily runs
export CIVINT_ATLAS_URL=https://www.atlasofsurveillance.org/download.csv

python civint_ingest.py nws
python civint_ingest.py usaspending
python civint_ingest.py osm --pbf iowa-latest.osm.pbf
python civint_ingest.py verify --chunks chunks.json
python civint_ingest.py daily
```

### Outputs (`civint_data/`)

| File | Purpose |
|------|---------|
| `civint.db` | SQLite master (alerts, awards, points, surveillance records) |
| `alerts.json` | Active NWS alerts |
| `awards.json` | Federal awards matching search terms |
| `alpr_overpass.json` | Backward-compatible ALPR nodes |
| `surveillance.json` | Normalized ALPR, gunshot-detector, camera, and other mapped surveillance infrastructure with provenance |
| `atlas_surveillance.json` | Jurisdiction-level Atlas of Surveillance records with publisher provenance |
| `relations.json` / `rejected.jsonl` | Quote-verified entity/relation extraction |

### Design notes

- **No API keys.** The ingest uses public HTTP sources; NWS still requires a descriptive `NWS_USER_AGENT`.
  Atlas can be enabled for `daily` with `CIVINT_ATLAS_URL`.
- USAspending covers **federal** awards only — local city contracts with Flock Safety will not appear; those need the Legistar + PDF agenda pipeline.
- Quote verifier enforces closed entity/relation sets, quote presence after normalization (including hyphenated PDF line-breaks), length bounds, and endpoint presence in the chunk's entity list. Missing page endpoints are kept with `endpoints_on_page` flags rather than rejected (jurisdictions are often header-implied).
- `daily` continues if one source fails.

### Integration now active

- OSM surveillance nodes are normalized into `surveillance.json` with source URLs,
  snapshot age, attribution, operator/manufacturer tags when present, and explicit confidence.
- `alpr_overpass.json` remains for compatibility with existing Watchtower/App clients.
- DeFlock and FlockHopper remain visible as source references while OSM is the canonical
  machine-readable mapped-infrastructure path.
- Atlas of Surveillance is a separate record/evidence path; its agency/vendor narratives
  are not converted into precise physical locations without an independent geographic source.
- Watchtower consumes the normalized surveillance feed instead of treating its demo feature
  array as the primary map source.

### Next

- City agenda ingestion (Legistar keyless API + PDF text → model extraction → `verify`)
- Evidence-backed local contract joins between mapped assets, operators, and public spending
