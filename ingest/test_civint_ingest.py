"""Tests for the verify_chunk extraction-schema rules. Run from this dir: pytest"""
import civint_ingest as ci

TEXT = "The City of Cedar Rapids approved a contract with Flock Safety for 25 cameras. Total: $120,000."
ENTS = [{"type": "Jurisdiction", "name": "City of Cedar Rapids"}, {"type": "Vendor", "name": "Flock Safety"}]


def run(rel, ents=ENTS):
    return ci.verify_chunk({"entities": ents, "relations": [rel]}, 1, TEXT)


REL = {"source": "City of Cedar Rapids", "target": "Flock Safety", "type": "awards_contract_to",
       "quote": "approved a contract with Flock Safety for 25 cameras"}


def test_keeps_verbatim_quote():
    _, rels, rej = run(REL)
    assert len(rels) == 1 and not rej and rels[0]["verified"] is True


def test_rejects_fabricated_quote():
    _, rels, rej = run({**REL, "quote": "awarded $5 million to Flock Safety for surveillance"})
    assert not rels and rej[0]["reason"] == "quote_not_found"


def test_rejects_unknown_relation_type():
    _, rels, rej = run({**REL, "type": "owns"})
    assert not rels and rej[0]["reason"] == "bad_relation_type"


def test_nulls_unsupported_amount_keeps_supported():
    ents = [{"type": "Contract", "name": "A", "attrs": {"amount": "$999,999"}},
            {"type": "Contract", "name": "B", "attrs": {"amount": "$120,000"}}]
    es, _, _ = ci.verify_chunk({"entities": ents, "relations": []}, 1, TEXT)
    amounts = {e["name"]: e["attrs"]["amount"] for e in es}
    assert amounts == {"A": None, "B": "$120,000"}


SURVEILLANCE = [
    {"man_made": "surveillance", "surveillance:type": "ALPR", "operator": "Flock Safety"},
    {"man_made": "surveillance", "surveillance:type": "gunshot_detector"},
    {"man_made": "surveillance", "surveillance:type": "camera"},
    {"man_made": "surveillance", "camera:type": "ALPR"},
    {"man_made": "surveillance", "surveillance:type": "other"},
]

def test_surveillance_categories():
    assert [ci._surveillance_category(tags) for tags in SURVEILLANCE] == [
        "alpr", "gunshot_detector", "camera", "alpr", "other"
    ]


def test_non_surveillance_is_not_promoted():
    assert ci._surveillance_category({"surveillance:type": "ALPR"}) == "other"
    assert ci._surveillance_category({"amenity": "cafe"}) == "other"


def test_normalize_atlas_row():
    item = ci.normalize_atlas_row({
        "Agency": "Example Police Department",
        "City": "Example City",
        "County": "Example County",
        "State": "EX",
        "Technology": "Automated License Plate Readers",
        "Vendor": "Flock Safety",
        "Description": "Uses ALPR technology.",
    })
    assert item["id"].startswith("aos:")
    assert item["agency"] == "Example Police Department"
    assert item["technology"] == "Automated License Plate Readers"
    assert item["provenance"]["license"] == "CC-BY"
    assert ci.normalize_atlas_row({"Agency": "", "Technology": ""}) is None
