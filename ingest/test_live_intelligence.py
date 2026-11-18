"""Regression tests for live-event provenance, jurisdiction and freshness."""
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import civint_ingest as ingest
from live_intelligence import normalize_usgs_feature, normalize_usgs_feed

REF = datetime(2026, 11, 17, 18, tzinfo=timezone.utc)


def quake(key="abcd", magnitude=5.7, age_hours=1, url="https://earthquake.usgs.gov/earthquakes/eventpage/abcd"):
    return {
        "type": "Feature",
        "id": key,
        "properties": {
            "time": int((REF - timedelta(hours=age_hours)).timestamp() * 1000),
            "mag": magnitude,
            "place": "10 km NE of Example",
            "status": "reviewed",
            "url": url,
        },
        "geometry": {"type": "Point", "coordinates": [-91.0, 41.0, 8.5]},
    }


class LiveIntelligenceTests(unittest.TestCase):
    def test_publisher_does_not_determine_event_jurisdiction(self):
        item = normalize_usgs_feature(quake(), REF)
        self.assertEqual(item["publisher"]["government_level"], "federal")
        self.assertEqual(item["event_jurisdiction"]["level"], "unresolved")
        self.assertEqual(item["geography"]["coordinates"], {"longitude": -91.0, "latitude": 41.0})
        self.assertEqual(item["review_status"], "reviewed")

    def test_importance_is_magnitude_based_not_an_emergency_declaration(self):
        self.assertEqual(normalize_usgs_feature(quake(magnitude=6.2), REF)["importance"], 4)
        self.assertEqual(normalize_usgs_feature(quake(magnitude=5.2), REF)["importance"], 3)
        self.assertEqual(normalize_usgs_feature(quake(magnitude=4.1), REF)["importance"], 2)
        self.assertEqual(normalize_usgs_feature(quake(magnitude=2.8), REF)["importance"], 1)
        self.assertEqual(normalize_usgs_feature(quake(magnitude=None), REF)["importance"], 1)

    def test_historical_records_remain_labeled_historical(self):
        self.assertEqual(normalize_usgs_feature(quake(age_hours=30), REF)["freshness"], "historical")

    def test_future_timestamp_is_rejected(self):
        self.assertIsNone(normalize_usgs_feature(quake(age_hours=-1), REF))

    def test_invalid_coordinates_are_not_plotted(self):
        bad = quake()
        bad["geometry"]["coordinates"] = [1000, 1000]
        self.assertIsNone(normalize_usgs_feature(bad, REF)["geography"]["coordinates"])

    def test_untrusted_links_are_not_forwarded(self):
        event = normalize_usgs_feature(quake(url="https://earthquake.usgs.gov.evil.example/x"), REF)
        self.assertIsNone(event["source_url"])

    def test_invalid_payload_does_not_become_empty_feed(self):
        with self.assertRaises(ValueError):
            normalize_usgs_feed({"features": []}, REF)
        with self.assertRaises(ValueError):
            normalize_usgs_feed({"type": "FeatureCollection", "features": None}, REF)

    def test_duplicates_and_priority_order(self):
        events = normalize_usgs_feed({"type": "FeatureCollection", "features": [
            quake("small", 4.1), quake("big", 6.5), quake("big", 6.5)
        ]}, REF)
        self.assertEqual([x["id"] for x in events], ["usgs:big", "usgs:small"])

    def test_snapshot_write_is_atomic_and_source_failure_preserves_data(self):
        class Response:
            def raise_for_status(self):
                return None
            def json(self):
                return {"type": "FeatureCollection", "features": [quake()]}

        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "earthquakes.json"
            with patch.object(ingest, "OUT", Path(td)), patch.object(ingest.requests, "get", return_value=Response()):
                ingest.usgs()
                saved = path.read_text(encoding="utf-8")
            self.assertEqual(len(json.loads(saved)), 1)
            with patch.object(ingest, "OUT", Path(td)), patch.object(ingest.requests, "get", side_effect=TimeoutError()):
                with self.assertRaises(TimeoutError):
                    ingest.usgs()
            self.assertEqual(path.read_text(encoding="utf-8"), saved)
            self.assertEqual(list(Path(td).glob("*.tmp")), [])


if __name__ == "__main__":
    unittest.main()
