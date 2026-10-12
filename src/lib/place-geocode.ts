// Resolve free text ("10400 S Roberts Rd, Palos Hills IL", "Austin, TX",
// "60465", or "41.70,-87.82") to a point plus Census jurisdiction.
//
// Order: literal coordinates → Census one-line address (authoritative, returns
// geographies in the same call) → OpenStreetMap Nominatim for places/ZIPs the
// Census street geocoder cannot match → Census coordinates lookup for the
// jurisdiction of that point.

import { resolveGeography, type ResolvedGeography } from "@/lib/census-geography";

const CENSUS_ADDRESS = "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";
const CENSUS_COORDS = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const UA = "CIVINT/1.0 (civic transparency; +https://civintelligence.onrender.com)";

export type GeocodeMethod = "coordinates" | "census-address" | "nominatim+census";

export type ResolvedPlace = {
  query: string;
  label: string;
  latitude: number;
  longitude: number;
  method: GeocodeMethod;
  geography: ResolvedGeography;
  sources: Array<{ name: string; url: string }>;
};

const CENSUS_SOURCE = { name: "U.S. Census Bureau Geocoder", url: "https://geocoding.geo.census.gov/" };
const OSM_SOURCE = { name: "OpenStreetMap Nominatim", url: "https://nominatim.openstreetmap.org/" };

export function parseCoordinates(input: string): { lat: number; lon: number } | null {
  const m = input.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

async function json(url: string, extraHeaders: Record<string, string> = {}): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA, ...extraHeaders },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${new URL(url).host} returned ${res.status}`);
  return res.json();
}

export async function geographyAt(lat: number, lon: number): Promise<ResolvedGeography> {
  const url = `${CENSUS_COORDS}?x=${encodeURIComponent(lon)}&y=${encodeURIComponent(lat)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
  return resolveGeography(await json(url));
}

type CensusAddressMatch = {
  matchedAddress?: string;
  coordinates?: { x?: number; y?: number };
  geographies?: Record<string, unknown>;
};

export function readCensusAddressMatch(payload: unknown): {
  label: string;
  lat: number;
  lon: number;
  geography: ResolvedGeography;
} | null {
  const match = (payload as { result?: { addressMatches?: CensusAddressMatch[] } } | null)?.result?.addressMatches?.[0];
  const lon = Number(match?.coordinates?.x);
  const lat = Number(match?.coordinates?.y);
  if (!match || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    label: match.matchedAddress ?? "",
    lat,
    lon,
    geography: resolveGeography({ result: { geographies: match.geographies ?? {} } }),
  };
}

export async function resolvePlace(query: string): Promise<ResolvedPlace | null> {
  const q = query.trim().slice(0, 200);
  if (!q) return null;

  const coords = parseCoordinates(q);
  if (coords) {
    const geography = await geographyAt(coords.lat, coords.lon);
    return {
      query: q,
      label: [geography.city, geography.stateAbbr].filter(Boolean).join(", ") || q,
      latitude: coords.lat,
      longitude: coords.lon,
      method: "coordinates",
      geography,
      sources: [CENSUS_SOURCE],
    };
  }

  try {
    const census = readCensusAddressMatch(
      await json(`${CENSUS_ADDRESS}?address=${encodeURIComponent(q)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`),
    );
    if (census) {
      return {
        query: q,
        label: census.label,
        latitude: census.lat,
        longitude: census.lon,
        method: "census-address",
        geography: census.geography,
        sources: [CENSUS_SOURCE],
      };
    }
  } catch {
    // Fall through to Nominatim; Census occasionally times out.
  }

  const hits = (await json(
    `${NOMINATIM}?q=${encodeURIComponent(q)}&format=jsonv2&countrycodes=us&limit=1&addressdetails=0`,
  )) as Array<{ lat?: string; lon?: string; display_name?: string }>;
  const hit = Array.isArray(hits) ? hits[0] : undefined;
  const lat = Number(hit?.lat);
  const lon = Number(hit?.lon);
  if (!hit || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const geography = await geographyAt(lat, lon);
  return {
    query: q,
    label: hit.display_name ?? q,
    latitude: lat,
    longitude: lon,
    method: "nominatim+census",
    geography,
    sources: [OSM_SOURCE, CENSUS_SOURCE],
  };
}
