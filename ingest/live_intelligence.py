"""Canonical public-event normalization and freshness policy for CIVINTELLIGENCE.

Data-source attribution is retained as evidence, not as software authorship.
"""
from datetime import datetime, timedelta, timezone
from math import isfinite
from urllib.parse import urlsplit

USGS_SIGNIFICANT_DAY = (
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson"
)


def _timestamp(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not isfinite(value):
        return None
    try:
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc)
    except (ValueError, OverflowError, OSError):
        return None


def _coordinates(geometry):
    coords = (geometry or {}).get("coordinates") if isinstance(geometry, dict) else None
    if not isinstance(coords, (list, tuple)) or len(coords) < 2:
        return None
    lon, lat = coords[:2]
    if any(isinstance(x, bool) or not isinstance(x, (int, float)) or not isfinite(x)
           for x in (lon, lat)):
        return None
    if not (-180 <= lon <= 180 and -90 <= lat <= 90):
        return None
    return {"longitude": lon, "latitude": lat}


def _source_link(value):
    if not isinstance(value, str):
        return None
    try:
        url = urlsplit(value)
        if (url.scheme == "https" and url.hostname == "earthquake.usgs.gov"
                and url.port in (None, 443) and not url.username and not url.password):
            return value
    except ValueError:
        pass
    return None


def normalize_usgs_feature(feature, fetched_at):
    """Separate the publishing agency's level from event location/jurisdiction."""
    if not isinstance(feature, dict):
        return None
    identity = feature.get("id")
    properties = feature.get("properties")
    if not isinstance(identity, str) or not identity.strip() or not isinstance(properties, dict):
        return None
    observed = _timestamp(properties.get("time"))
    if observed is None or observed > fetched_at + timedelta(minutes=15):
        return None
    magnitude = properties.get("mag")
    if (isinstance(magnitude, bool) or not isinstance(magnitude, (int, float))
            or not isfinite(magnitude)):
        magnitude = None
    priority = (4 if magnitude >= 6 else 3 if magnitude >= 5 else 2 if magnitude >= 4
                else 1) if magnitude is not None else 1
    place = properties.get("place")
    place = place.strip() if isinstance(place, str) and place.strip() else "Location not specified"
    raw_status = properties.get("status")
    review = "reviewed" if raw_status == "reviewed" else "preliminary"
    age = fetched_at - observed
    return {
        "id": "usgs:" + identity,
        "type": "earthquake",
        "title": place,
        "observed_at": observed.isoformat(),
        "fetched_at": fetched_at.isoformat(),
        "freshness": "live" if timedelta(0) <= age < timedelta(hours=24) else "historical",
        "review_status": review,
        "magnitude": magnitude,
        "importance": priority,
        "importance_basis": "earthquake_magnitude_only",
        "publisher": {"name": "USGS", "government_level": "federal"},
        "event_jurisdiction": {"level": "unresolved", "name": None},
        "geography": {"label": place, "coordinates": _coordinates(feature.get("geometry"))},
        "source_url": _source_link(properties.get("url")),
    }


def normalize_usgs_feed(payload, fetched_at=None):
    """Fail closed on invalid responses; never overwrite last-good data with malformed feeds."""
    if not isinstance(payload, dict) or payload.get("type") != "FeatureCollection":
        raise ValueError("Expected USGS GeoJSON FeatureCollection")
    features = payload.get("features")
    if not isinstance(features, list):
        raise ValueError("USGS feed missing features array")
    timestamp = datetime.now(timezone.utc) if fetched_at is None else fetched_at
    if not isinstance(timestamp, datetime) or timestamp.tzinfo is None or timestamp.utcoffset() is None:
        raise ValueError("fetched_at must be a timezone-aware datetime")
    timestamp = timestamp.astimezone(timezone.utc)
    seen = {}
    for feature in features:
        event = normalize_usgs_feature(feature, timestamp)
        if event is not None:
            seen[event["id"]] = event
    if features and not seen:
        raise ValueError("USGS feed contains no usable features")
    return sorted(seen.values(), key=lambda x: (x["importance"], x["observed_at"]), reverse=True)
