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
