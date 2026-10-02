#!/usr/bin/env python3
"""CIVINT ingest: keyless sources -> SQLite (civint_data/civint.db) + dashboard-ready JSON.

  python civint_ingest.py nws                              active NWS alerts (IA, IL, MO)
  python civint_ingest.py usaspending                      federal awards matching search terms
  python civint_ingest.py osm --pbf iowa-latest.osm.pbf    ALPR points from a Geofabrik extract
  python civint_ingest.py verify --chunks chunks.json      enforce the extraction-schema quote rules
  python civint_ingest.py daily                            nws + usaspending (+ osm if CIVINT_PBF is set)

Install:  pip install requests osmium      (osmium only needed for the osm command)
Config (env or a .env file next to this script's working dir):
  NWS_USER_AGENT="CIVINT (contact: you@real-address)"
  CIVINT_OUT=civint_data       (optional output folder)
  CIVINT_PBF=iowa-latest.osm.pbf  (optional, used by `daily`)
No API keys are needed by anything in this file.
"""
import argparse
import json
import os
import re
import sqlite3
import sys
import time
import unicodedata
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path

import requests

OUT = Path(os.environ.get("CIVINT_OUT", "civint_data"))
USA_URL = "https://api.usaspending.gov/api/v2/search/spending_by_award/"
AWARD_GROUPS = {"contracts": ["A", "B", "C", "D"], "grants": ["02", "03", "04", "05"]}
ENTITY_TYPES = {"Legislation", "Agency", "Jurisdiction", "Vendor", "Contract", "Location",
                "Court", "Case", "Person", "Organization", "Technology"}
RELATION_TYPES = {"sponsors", "awards_contract_to", "funds", "deployed_in", "operates", "regulates",
                  "restricts", "challenges", "cites", "shares_data_with", "located_at", "party_to", "other"}


def load_env(path=".env"):
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def connect():
    OUT.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(OUT / "civint.db")
    con.row_factory = sqlite3.Row
    con.executescript("""
    CREATE TABLE IF NOT EXISTS alerts(id TEXT PRIMARY KEY, event TEXT, severity TEXT, area TEXT,
        onset TEXT, ends TEXT, headline TEXT, fetched TEXT);
    CREATE TABLE IF NOT EXISTS awards(award_id TEXT, term TEXT, recipient TEXT, amount REAL, agency TEXT,
        start_date TEXT, award_group TEXT, fetched TEXT, PRIMARY KEY(award_id, term));
    CREATE TABLE IF NOT EXISTS points(osm_id INTEGER PRIMARY KEY, lat REAL, lon REAL, tags TEXT, fetched TEXT);
    """)
    return con


def export(con, table, filename):
    rows = [dict(r) for r in con.execute(f"SELECT * FROM {table}")]
    (OUT / filename).write_text(json.dumps(rows, indent=1), encoding="utf-8")
    return len(rows)


# ---------------------------------------------------------------- NWS alerts
def nws(states=("IA", "IL", "MO")):
    ua = os.environ.get("NWS_USER_AGENT")
    if not ua:
        sys.exit("Set NWS_USER_AGENT, e.g. CIVINT (contact: you@real-address)")
    r = requests.get("https://api.weather.gov/alerts/active", params={"area": ",".join(states)},
                     headers={"User-Agent": ua, "Accept": "application/geo+json"}, timeout=30)
    r.raise_for_status()
    con = connect()
    with con:
        con.execute("DELETE FROM alerts")  # active-alert snapshot, not history
        for f in r.json().get("features", []):
            p = f.get("properties", {})
            con.execute("INSERT OR REPLACE INTO alerts VALUES (?,?,?,?,?,?,?,?)",
                        (p.get("id") or f.get("id"), p.get("event"), p.get("severity"), p.get("areaDesc"),
                         p.get("onset") or p.get("effective"), p.get("ends") or p.get("expires"),
                         p.get("headline"), now()))
    print("nws: alerts ->", export(con, "alerts", "alerts.json"))


# ---------------------------------------------------------------- USAspending
def usaspending(terms=("Flock Safety", "license plate reader"), start="2021-10-01", end=None, max_pages=5):
    """Federal awards only. Local city contracts with vendors mostly will not appear here."""
    end = end or date.today().isoformat()
    con = connect()
    for term in terms:
        for filt in ("keywords", "recipient_search_text"):
            for group, codes in AWARD_GROUPS.items():
                for page in range(1, max_pages + 1):
                    body = {"filters": {filt: [term], "award_type_codes": codes,
                                        "time_period": [{"start_date": start, "end_date": end}]},
                            "fields": ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Start Date"],
                            "page": page, "limit": 100, "sort": "Award Amount", "order": "desc"}
                    r = requests.post(USA_URL, json=body, timeout=60)
                    if not r.ok:
                        print(f"usaspending: {term}/{filt}/{group} HTTP {r.status_code}: {r.text[:200]}")
                        break
                    j = r.json()
                    with con:
                        for x in j.get("results", []):
                            con.execute("INSERT OR REPLACE INTO awards VALUES (?,?,?,?,?,?,?,?)",
                                        (x.get("Award ID"), term, x.get("Recipient Name"), x.get("Award Amount"),
                                         x.get("Awarding Agency"), x.get("Start Date"), group, now()))
                    if not j.get("page_metadata", {}).get("hasNext"):
                        break
                    time.sleep(0.5)
    print("usaspending: awards ->", export(con, "awards", "awards.json"))


# ---------------------------------------------------------------- OSM ALPR points
def osm(pbfs):
    """Filter local Geofabrik .osm.pbf extracts for ALPR nodes; write Overpass-style JSON for the dashboard."""
    try:
        import osmium
    except ImportError:
        sys.exit("pip install osmium")
    pts = {}

    class Handler(osmium.SimpleHandler):
        def node(self, n):
            tags = {t.k: t.v for t in n.tags}
            if tags.get("man_made") == "surveillance" and tags.get("surveillance:type") == "ALPR" \
                    and n.location.valid():
                pts[n.id] = (n.location.lat, n.location.lon, tags)

    for f in pbfs:
        Handler().apply_file(str(f))
    con = connect()
    with con:
        con.execute("DELETE FROM points")
        for i, (lat, lon, tags) in pts.items():
            con.execute("INSERT OR REPLACE INTO points VALUES (?,?,?,?,?)", (i, lat, lon, json.dumps(tags), now()))
    elements = [{"type": "node", "id": i, "lat": lat, "lon": lon, "tags": tags} for i, (lat, lon, tags) in pts.items()]
    (OUT / "alpr_overpass.json").write_text(
        json.dumps({"version": 0.6, "generator": "civint_ingest", "elements": elements}), encoding="utf-8")
    print("osm: ALPR points ->", len(elements), "(import OUT/alpr_overpass.json in the dashboard)")


# ---------------------------------------------------------------- quote verifier
_PUNCT = {0x2018: "'", 0x2019: "'", 0x201C: '"', 0x201D: '"', 0x2013: "-", 0x2014: "-"}


def norm(s):
    s = unicodedata.normalize("NFKC", s or "").replace("\u00ad", "").translate(_PUNCT)
    s = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", s)  # rejoin words hyphenated across PDF line breaks
    return re.sub(r"\s+", " ", s).strip().lower()


def _parse(output):
    if isinstance(output, dict):
        return output
    s = re.sub(r"^```(?:json)?|```$", "", (output or "").strip(), flags=re.M).strip()
    return json.loads(s)


def verify_chunk(output, page, text):
    """Apply the extraction-schema rules to one chunk. Returns (entities, relations, rejected)."""
    t = norm(text)
    ents, rejected = {}, []
    for e in output.get("entities", []):
        if e.get("type") not in ENTITY_TYPES or not e.get("name"):
            rejected.append({"reason": "bad_entity", "item": e})
            continue
        attrs = dict(e.get("attrs") or {})
        for k in ("amount", "date"):  # kept only if the exact string is on the page
            if attrs.get(k) is not None and norm(str(attrs[k])) not in t:
                attrs[k] = None
        ents[norm(e["name"])] = {"id": f"{e['type'].lower()}:{norm(e['name'])}", "type": e["type"],
                                 "name": e["name"], "pages": [page], "attrs": attrs}
    rels = []
    for r in output.get("relations", []):
        s, d, q = norm(r.get("source")), norm(r.get("target")), norm(r.get("quote"))
        reason = None
        if r.get("type") not in RELATION_TYPES:
            reason = "bad_relation_type"
        elif s not in ents or d not in ents:
            reason = "endpoint_not_in_entities"
        elif len(r.get("quote") or "") > 200:
            reason = "quote_too_long"
        elif len(q) < 12:
            reason = "quote_too_short"
        elif q not in t:
            reason = "quote_not_found"
        elif s not in q and d not in q:  # heuristic: the quote itself must name at least one endpoint
            reason = "quote_mentions_no_endpoint"
        if reason:
            rejected.append({"reason": reason, "item": r})
        else:
            # A jurisdiction is often implied by the document header, so a missing endpoint on the
            # page is flagged for the dashboard to show as lower confidence, not rejected.
            rels.append({"source": ents[s]["id"], "target": ents[d]["id"], "type": r["type"],
                         "quote": r["quote"], "page": page, "verified": True,
                         "endpoints_on_page": [s in t, d in t]})
    return list(ents.values()), rels, rejected


def verify(chunks_path, out_name="relations.json"):
    """chunks.json: [{"file","sha256","page","text","output": <model JSON, dict or string>}, ...]"""
    chunks = json.loads(Path(chunks_path).read_text(encoding="utf-8"))
    entities, relations, rejected, failures = {}, [], [], 0
    for c in chunks:
        try:
            out = _parse(c["output"])
        except (ValueError, TypeError):
            failures += 1
            continue
        es, rs, rj = verify_chunk(out, c["page"], c["text"])
        for e in es:
            if e["id"] in entities:
                entities[e["id"]]["pages"] = sorted(set(entities[e["id"]]["pages"] + e["pages"]))
            else:
                entities[e["id"]] = e
        relations += rs
        rejected += rj
    first = chunks[0] if chunks else {}
    result = {"source": {"file": first.get("file"), "sha256": first.get("sha256")},
              "entities": list(entities.values()), "relations": relations,
              "stats": {"chunks": len(chunks), "parse_failures": failures,
                        "rejected_relations": sum(1 for r in rejected if "source" in r["item"]),
                        "kept_relations": len(relations),
                        "reasons": dict(Counter(r["reason"] for r in rejected))}}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / out_name).write_text(json.dumps(result, indent=1), encoding="utf-8")
    (OUT / "rejected.jsonl").write_text("\n".join(json.dumps(r) for r in rejected), encoding="utf-8")
    print("verify:", result["stats"])


# ---------------------------------------------------------------- CLI
def main():
    load_env()
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("nws"); p.add_argument("--states", nargs="+", default=["IA", "IL", "MO"])
    p = sub.add_parser("usaspending")
    p.add_argument("--terms", nargs="+", default=["Flock Safety", "license plate reader"])
    p.add_argument("--start", default="2021-10-01"); p.add_argument("--end"); p.add_argument("--max-pages", type=int, default=5)
    p = sub.add_parser("osm"); p.add_argument("--pbf", nargs="+", required=True)
    p = sub.add_parser("verify"); p.add_argument("--chunks", required=True)
    sub.add_parser("daily")
    a = ap.parse_args()
    if a.cmd == "nws":
        nws(a.states)
    elif a.cmd == "usaspending":
        usaspending(a.terms, a.start, a.end, a.max_pages)
    elif a.cmd == "osm":
        osm(a.pbf)
    elif a.cmd == "verify":
        verify(a.chunks)
    else:
        for step in (nws, usaspending):
            try:
                step()
            except Exception as ex:  # one failing source must not stop the rest
                print(f"daily: {step.__name__} failed: {ex}", file=sys.stderr)
        if os.environ.get("CIVINT_PBF"):
            osm(os.environ["CIVINT_PBF"].split(os.pathsep))


if __name__ == "__main__":
    main()
