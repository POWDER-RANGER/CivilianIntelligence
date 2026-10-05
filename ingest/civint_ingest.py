#!/usr/bin/env python3
"""CIVINT ingest: keyless sources -> SQLite (civint_data/civint.db) + dashboard-ready JSON.

  python civint_ingest.py nws                              active NWS alerts (IA, IL, MO)
  python civint_ingest.py usaspending                      federal awards matching search terms
  python civint_ingest.py osm --pbf iowa-latest.osm.pbf    surveillance/ALPR/gunshot/camera points from OSM PBF
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
    CREATE TABLE IF NOT EXISTS awards(internal_id TEXT, award_id TEXT, term TEXT, matched_by TEXT,
        recipient TEXT, amount REAL, agency TEXT, start_date TEXT, award_group TEXT, fetched TEXT,
        PRIMARY KEY(internal_id, term, matched_by));
    CREATE TABLE IF NOT EXISTS points(osm_id INTEGER PRIMARY KEY, lat REAL, lon REAL, tags TEXT, fetched TEXT);
    CREATE TABLE IF NOT EXISTS surveillance_assets(
        osm_id INTEGER PRIMARY KEY, category TEXT NOT NULL, lat REAL, lon REAL,
        surveillance_type TEXT, operator TEXT, manufacturer TEXT, tags TEXT,
        observed_at TEXT, source_url TEXT
    );
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
def usaspending(terms=("Flock Safety", "Flock Group", "license plate reader"), start="2021-10-01",
                end=None, max_pages=5):
    """Federal awards only. Local city contracts with vendors mostly will not appear here."""
    end = end or date.today().isoformat()
    con = connect()
    for term in terms:
        for filt in ("keywords", "recipient_search_text"):
            for group, codes in AWARD_GROUPS.items():
                for page in range(1, max_pages + 1):
                    body = {"filters": {filt: [term], "award_type_codes": codes,
                                        "time_period": [{"start_date": start, "end_date": end}]},
                            "fields": ["Award ID", "generated_internal_id", "Recipient Name", "Award Amount",
                                       "Awarding Agency", "Start Date"],
                            "page": page, "limit": 100, "sort": "Award Amount", "order": "desc"}
                    r = requests.post(USA_URL, json=body, timeout=60)
                    if not r.ok:
                        print(f"usaspending: {term}/{filt}/{group} HTTP {r.status_code}: {r.text[:200]}")
                        break
                    j = r.json()
                    with con:
                        for x in j.get("results", []):
                            con.execute("INSERT OR REPLACE INTO awards VALUES (?,?,?,?,?,?,?,?,?,?)",
                                        (x.get("generated_internal_id"), x.get("Award ID"), term, filt,
                                         x.get("Recipient Name"), x.get("Award Amount"),
                                         x.get("Awarding Agency"), x.get("Start Date"), group, now()))
                    if not j.get("page_metadata", {}).get("hasNext"):
                        break
                    time.sleep(0.5)
    print("usaspending: awards ->", export(con, "awards", "awards.json"))


# ---------------------------------------------------------------- OSM surveillance infrastructure
def _surveillance_category(tags):
    """Classify an explicitly mapped OSM surveillance object."""
    if tags.get("man_made") != "surveillance":
        return "other"
    st = (tags.get("surveillance:type") or "").strip().lower()
    if st == "alpr":
        return "alpr"
    if st == "gunshot_detector":
        return "gunshot_detector"
    if st == "camera":
        return "camera"
    # OSM documents camera:type=ALPR as a possible legacy/synonym tagging pattern.
    if (tags.get("camera:type") or "").strip().lower() == "alpr":
        return "alpr"
    return "other"


def _source_url(osm_id):
    return f"https://www.openstreetmap.org/node/{osm_id}"


def osm(pbfs):
    """Normalize mapped surveillance nodes from one or more OSM PBF extracts.

    The upstream dataset remains OpenStreetMap. DeFlock/FlockHopper compatibility is
    achieved by consuming the same OSM objects rather than scraping or duplicating
    their application-specific databases.
    """
    try:
        import osmium
    except ImportError:
        sys.exit("pip install osmium")

    assets = {}

    class Handler(osmium.SimpleHandler):
        def node(self, n):
            tags = {t.k: t.v for t in n.tags}
            if tags.get("man_made") != "surveillance" or not n.location.valid():
                return
            category = _surveillance_category(tags)
            assets[n.id] = {
                "type": "node",
                "id": n.id,
                "lat": n.location.lat,
                "lon": n.location.lon,
                "category": category,
                "surveillance_type": tags.get("surveillance:type") or None,
                "operator": tags.get("operator") or None,
                "manufacturer": tags.get("manufacturer") or None,
                "name": tags.get("name") or None,
                "zone": tags.get("surveillance:zone") or None,
                "direction": tags.get("camera:direction") or None,
                "tags": tags,
            }

    for f in pbfs:
        Handler().apply_file(str(f))

    con = connect()
    asof = min(_extract_ts(f) for f in pbfs)
    with con:
        con.execute("DELETE FROM points")
        con.execute("DELETE FROM surveillance_assets")
        for i, asset in assets.items():
            tags = json.dumps(asset["tags"], sort_keys=True)
            con.execute(
                "INSERT OR REPLACE INTO points VALUES (?,?,?,?,?)",
                (i, asset["lat"], asset["lon"], tags, now()),
            )
            con.execute(
                "INSERT OR REPLACE INTO surveillance_assets VALUES (?,?,?,?,?,?,?,?,?,?)",
                (
                    i,
                    asset["category"],
                    asset["lat"],
                    asset["lon"],
                    asset["surveillance_type"],
                    asset["operator"],
                    asset["manufacturer"],
                    tags,
                    asof,
                    _source_url(i),
                ),
            )

    elements = []
    for asset in assets.values():
        elements.append({
            **asset,
            "confidence": 0.9 if asset["category"] in {"alpr", "gunshot_detector"} else 0.75,
            "provenance": {
                "source_id": "osm",
                "source_url": _source_url(asset["id"]),
                "observed_at": asof,
                "method": "OSM PBF extract",
                "state": "snapshot",
                "attribution": "© OpenStreetMap contributors",
            },
        })

    counts = Counter(a["category"] for a in assets.values())
    surveillance = {
        "schema_version": "1.0",
        "state": "snapshot",
        "generated_at": now(),
        "as_of": asof,
        "source": {
            "id": "osm",
            "name": "OpenStreetMap",
            "url": "https://www.openstreetmap.org/",
            "license": "ODbL",
            "attribution": "© OpenStreetMap contributors",
        },
        "integration": {
            "deflock": "via OSM",
            "flockhopper_deflock_data": "via OSM",
            "direct_third_party_database_ingest": False,
        },
        "counts": dict(counts),
        "elements": elements,
    }
    (OUT / "surveillance.json").write_text(json.dumps(surveillance, indent=1), encoding="utf-8")

    alpr = {
        "version": 0.6,
        "generator": "civint_ingest",
        "osm3s": {"timestamp_osm_base": asof},
        "elements": [
            {
                "type": a["type"],
                "id": a["id"],
                "lat": a["lat"],
                "lon": a["lon"],
                "tags": a["tags"],
            }
            for a in assets.values()
            if a["category"] == "alpr"
        ],
    }
    (OUT / "alpr_overpass.json").write_text(json.dumps(alpr, indent=1), encoding="utf-8")
    print(
        "osm: surveillance ->",
        len(elements),
        f"(ALPR {counts.get('alpr', 0)}; gunshot detectors {counts.get('gunshot_detector', 0)}; "
        f"cameras {counts.get('camera', 0)}; extract as of {asof})"
    )


# ---------------------------------------------------------------- quote verifier
_PUNCT = {0x2018: "'", 0x2019: "'", 0x201C: '"', 0x201D: '"', 0x2013: "-", 0x2014: "-"}


def norm(s):
    s = unicodedata.normalize("NFKC", s or "").replace("\u00ad", "").translate(_PUNCT)
    s = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", s)  # rejoin words hyphenated across PDF line breaks
    return re.sub(r"\s+", " ", s).strip().lower()


def contains(t, q):
    """True if normalized quote q occurs in normalized text t, ignoring hyphens (PDF line breaks)."""
    return q in t or q.replace("-", "") in t.replace("-", "")


def _parse(output):
    if isinstance(output, dict):
        return output
    if not isinstance(output, str):
        raise TypeError("output must be a dict or JSON string")
    s = re.sub(r"^```(?:json)?|```$", "", output.strip(), flags=re.M).strip()
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
            if attrs.get(k) is not None and not contains(t, norm(str(attrs[k]))):
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
        elif not contains(t, q):
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
            if not isinstance(out, dict):
                raise ValueError("not an object")
        except (ValueError, TypeError, KeyError):
            failures += 1
            continue
        es, rs, rj = verify_chunk(out, c["page"], c["text"])
        for e in es:
            cur = entities.setdefault(e["id"], e)
            if cur is not e:
                cur["pages"] = sorted(set(cur["pages"] + e["pages"]))
                for k, v in e["attrs"].items():
                    if cur["attrs"].get(k) is None and v is not None:
                        cur["attrs"][k] = v
        for r in rs:
            r["file"], r["sha256"] = c.get("file"), c.get("sha256")
        relations += rs
        rejected += rj
    seen, uniq = set(), []
    for r in relations:
        k = (r["source"], r["target"], r["type"], norm(r["quote"]), r["sha256"])
        if k not in seen:
            seen.add(k)
            uniq.append(r)
    relations = uniq
    sources = [{"file": f, "sha256": s} for f, s in
               sorted({(c.get("file"), c.get("sha256") or "") for c in chunks if c.get("file")})]
    result = {"sources": sources,
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
    p.add_argument("--terms", nargs="+", default=["Flock Safety", "Flock Group", "license plate reader"])
    p.add_argument("--start", default="2021-10-01"); p.add_argument("--end"); p.add_argument("--max-pages", type=int, default=5)
    p = sub.add_parser("osm"); p.add_argument("--pbf", nargs="+", required=True,
                                                   help="one or more OSM PBF extracts")
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
        failed = []
        for step in (nws, usaspending):
            try:
                step()
            except Exception as ex:  # one failing source must not stop the rest
                failed.append(step.__name__)
                print(f"daily: {step.__name__} failed: {ex}", file=sys.stderr)
        if os.environ.get("CIVINT_PBF"):
            try:
                osm(os.environ["CIVINT_PBF"].split(os.pathsep))
            except Exception as ex:
                failed.append("osm")
                print(f"daily: osm failed: {ex}", file=sys.stderr)
        sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
