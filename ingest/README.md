# CIVINT Ingest

Keyless data pipelines that feed the CIVINTELLIGENCE data layer (Privacy desk, Finance desk, Watchtower / Veil).

## `civint_ingest.py`

```bash
pip install requests osmium   # osmium only needed for the osm command

export NWS_USER_AGENT="CIVINT (contact: you@real-address)"
# optional
export CIVINT_OUT=civint_data
export CIVINT_PBF=iowa-latest.osm.pbf

python civint_ingest.py nws
python civint_ingest.py usaspending
python civint_ingest.py osm --pbf iowa-latest.osm.pbf
python civint_ingest.py verify --chunks chunks.json
python civint_ingest.py daily
```

### Outputs (`civint_data/`)

| File | Purpose |
|------|---------|
| `civint.db` | SQLite master (alerts, awards, points) |
| `alerts.json` | Active NWS alerts |
| `awards.json` | Federal awards matching search terms |
| `alpr_overpass.json` | Overpass-style ALPR nodes (import via dashboard) |
| `relations.json` / `rejected.jsonl` | Quote-verified entity/relation extraction |

### Design notes

- **No API keys.** Only `NWS_USER_AGENT` (real contact address) is required.
- USAspending covers **federal** awards only — local city contracts with Flock Safety will not appear; those need the Legistar + PDF agenda pipeline.
- Quote verifier enforces closed entity/relation sets, quote presence after normalization (including hyphenated PDF line-breaks), length bounds, and endpoint presence in the chunk's entity list. Missing page endpoints are kept with `endpoints_on_page` flags rather than rejected (jurisdictions are often header-implied).
- `daily` continues if one source fails.

### Next

- City agenda ingestion (Legistar keyless API + PDF text → model extraction → `verify`)
- Wire JSON loaders into Privacy / Finance / Watchtower routes
