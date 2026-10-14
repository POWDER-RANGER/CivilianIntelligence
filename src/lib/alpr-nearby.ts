// Cameras near a point, read from the DeFlock / FlockHopper vector tiles.
//
// Why tiles and not the Flock Locations GeoJSON export: that export is ~56 MB /
// ~136k features and costs ~270 MB of RSS to parse — over half of a 512 MB
// Render instance. A 3×3 block of zoom-12 tiles around a point is a few hundred
// KB, carries every camera at full detail (the tileset uses --drop-rate=1 from
// z9 up), and includes OSM `operator` / `brand` tags, which is exactly what a
// "who is watching here" answer needs.

import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";
import { PRIMARY_ALPR_PROVIDER } from "@/lib/alpr-providers";

export const NEARBY_ZOOM = 12;
const TILE_TEMPLATE = "https://tiles.dontgetflocked.com/cameras-us-hourly/{z}/{x}/{y}.mvt";
const EARTH_RADIUS_M = 6_371_008.8;
const METERS_PER_MILE = 1609.344;

export type NearbyCamera = {
  id: string;
  latitude: number;
  longitude: number;
  distanceMiles: number;
  operator: string | null;
  brand: string | null;
  direction: string | null;
  mountType: string | null;
  zone: string | null;
  osmUrl: string | null;
  lastEdited: string | null;
};

export type CountBucket = { name: string; count: number };

export type NearbySummary = {
  radiusMiles: number;
  total: number;
  withinOneMile: number;
  operators: CountBucket[];
  brands: CountBucket[];
  nearest: NearbyCamera[];
  cameras: NearbyCamera[];
  tilesRequested: number;
  tilesFailed: number;
  source: { id: string; name: string; url: string; attribution: string; zoom: number };
};

export function lonLatToTile(lon: number, lat: number, z: number): { x: number; y: number } {
  const n = 2 ** z;
  const clampedLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const rad = (clampedLat * Math.PI) / 180;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n);
  return { x: Math.min(n - 1, Math.max(0, x)), y: Math.min(n - 1, Math.max(0, y)) };
}

export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return (2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)))) / METERS_PER_MILE;
}

/** Tiles (x,y at `z`) whose union covers `radiusMiles` around the point. */
export function tilesCovering(lat: number, lon: number, radiusMiles: number, z = NEARBY_ZOOM): Array<{ x: number; y: number }> {
  const dLat = radiusMiles / 69.0;
  const dLon = radiusMiles / (69.172 * Math.max(0.05, Math.cos((lat * Math.PI) / 180)));
  const a = lonLatToTile(lon - dLon, lat + dLat, z);
  const b = lonLatToTile(lon + dLon, lat - dLat, z);
  const tiles: Array<{ x: number; y: number }> = [];
  for (let x = a.x; x <= b.x; x++) for (let y = a.y; y <= b.y; y++) tiles.push({ x, y });
  return tiles;
}

function str(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export function tally(values: Array<string | null>, unknownLabel: string, limit = 8): CountBucket[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value ?? unknownLabel;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Decode one MVT tile into cameras (no distance filter yet). */
export function decodeTile(buffer: Uint8Array, x: number, y: number, z: number): Omit<NearbyCamera, "distanceMiles">[] {
  const tile = new VectorTile(new PbfReader(buffer));
  const layer = tile.layers[PRIMARY_ALPR_PROVIDER.sourceLayer];
  if (!layer) return [];
  const out: Omit<NearbyCamera, "distanceMiles">[] = [];
  for (let i = 0; i < layer.length; i++) {
    const feature = layer.feature(i);
    const geo = feature.toGeoJSON(x, y, z);
    if (geo.geometry.type !== "Point") continue;
    const [longitude, latitude] = geo.geometry.coordinates as [number, number];
    const p = feature.properties as Record<string, unknown>;
    const osmType = str(p.osmType);
    const osmId = str(p.osmId);
    out.push({
      id: osmType && osmId ? `${osmType}/${osmId}` : `${z}/${x}/${y}/${i}`,
      latitude,
      longitude,
      operator: str(p.operator),
      brand: str(p.brand),
      direction: str(p.directionCardinal) ?? str(p.direction),
      mountType: str(p.mountType),
      zone: str(p.surveillanceZone),
      osmUrl: osmType && osmId ? `https://www.openstreetmap.org/${osmType}/${osmId}` : null,
      lastEdited: str(p.osmTimestamp),
    });
  }
  return out;
}

// Small in-process tile cache: tiles regenerate hourly upstream, and a dossier
// for one address fetches 4–9 tiles, so repeat lookups nearby are free.
const TILE_TTL_MS = 30 * 60 * 1000;
const TILE_CACHE_MAX = 400;
const tileCache = new Map<string, { at: number; bytes: Uint8Array }>();

async function fetchTile(z: number, x: number, y: number): Promise<Uint8Array | null> {
  const key = `${z}/${x}/${y}`;
  const hit = tileCache.get(key);
  if (hit && Date.now() - hit.at < TILE_TTL_MS) return hit.bytes;
  const url = TILE_TEMPLATE.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
  const res = await fetch(url, {
    headers: { Accept: "application/x-protobuf", "User-Agent": "CIVWATCH/1.0 (+https://civintelligence.onrender.com)" },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 204 || res.status === 404) {
    const empty = new Uint8Array();
    tileCache.set(key, { at: Date.now(), bytes: empty });
    return empty;
  }
  if (!res.ok) throw new Error(`tile ${key} returned ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (tileCache.size >= TILE_CACHE_MAX) tileCache.delete(tileCache.keys().next().value as string);
  tileCache.set(key, { at: Date.now(), bytes });
  return bytes;
}

export function summarize(
  lat: number,
  lon: number,
  radiusMiles: number,
  raw: Omit<NearbyCamera, "distanceMiles">[],
  tilesRequested: number,
  tilesFailed: number,
): NearbySummary {
  const seen = new Set<string>();
  const cameras: NearbyCamera[] = [];
  for (const cam of raw) {
    if (seen.has(cam.id)) continue;
    seen.add(cam.id);
    const distanceMiles = haversineMiles(lat, lon, cam.latitude, cam.longitude);
    if (distanceMiles <= radiusMiles) cameras.push({ ...cam, distanceMiles: Math.round(distanceMiles * 100) / 100 });
  }
  cameras.sort((a, b) => a.distanceMiles - b.distanceMiles);
  return {
    radiusMiles,
    total: cameras.length,
    withinOneMile: cameras.filter((c) => c.distanceMiles <= 1).length,
    operators: tally(cameras.map((c) => c.operator), "Operator not recorded"),
    brands: tally(cameras.map((c) => c.brand), "Brand not recorded"),
    nearest: cameras.slice(0, 8),
    cameras: cameras.slice(0, 600),
    tilesRequested,
    tilesFailed,
    source: {
      id: PRIMARY_ALPR_PROVIDER.id,
      name: PRIMARY_ALPR_PROVIDER.name,
      url: PRIMARY_ALPR_PROVIDER.sourceUrl,
      attribution: PRIMARY_ALPR_PROVIDER.attribution,
      zoom: NEARBY_ZOOM,
    },
  };
}

export async function camerasNear(lat: number, lon: number, radiusMiles = 5): Promise<NearbySummary> {
  const tiles = tilesCovering(lat, lon, radiusMiles);
  const results = await Promise.allSettled(
    tiles.map(async ({ x, y }) => {
      const bytes = await fetchTile(NEARBY_ZOOM, x, y);
      return bytes && bytes.length ? decodeTile(bytes, x, y, NEARBY_ZOOM) : [];
    }),
  );
  const raw = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed === tiles.length) throw new Error("ALPR tile provider unavailable");
  return summarize(lat, lon, radiusMiles, raw, tiles.length, failed);
}
