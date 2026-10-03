# CIVINT ingest

Keyless data pipelines that feed the CIVINTELLIGENCE data layer (Privacy desk, Finance desk, Veil).

## `civint_ingest.py`

```bash
pip install -r requirements.txt "osmium>=4"   # osmium (pyosmium 4.x) only needed for the osm command

export NWS_USER_AGENT="CIVINT (contact: you@real-address)"
# optional
export CIVINT_OUT=civint_data
export CIVINT_PBF=iowa-latest.osm.pbf

python civint_ingest.py nws                              # active NWS alerts (IA, IL, MO)
python civint_ingest.py usaspending                      # federal awards matching search terms
python civint_ingest.py osm --pbf iowa-latest.osm.pbf    # ALPR points from a Geofabrik extract
python civint_ingest.py verify --chunks chunks.json      # enforce extraction-schema quote rules
python civint_ingest.py daily                            # nws + usaspending (+ osm if CIVINT_PBF set)
```

## Outputs (`civint_data/` or `$CIVINT_OUT`)

| File | Consumer |
|------|----------|
| `civint.db` | SQLite master |
| `alerts.json` | Veil / NWS panel |
| `awards.json` | Veil / Finance AwardsPanel (one row per award, `terms[]` + `matched_by[]`) |
| `alpr_overpass.json` | Privacy AlprPanel (Overpass shape + extract timestamp) |
| `relations.json` / `rejected.jsonl` | Quote verifier output |

No API keys. Set `NWS_USER_AGENT` to a real contact address before calling NWS.

Nightly publish: `.github/workflows/ingest.yml` copies snapshots into `public/civint/`.
