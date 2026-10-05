import { createFileRoute } from "@tanstack/react-router";
const UPSTREAM = "https://flocklocations.com/api/cameras/export?format=geojson";
const CACHE_TTL_MS = 10 * 60 * 1000;

type Camera = {
  id: string;
  latitude: number;
  longitude: number;
  type: string | null;
  mounted_on: string | null;
  reported_at: string | null;
  verified: boolean;
  source: "flock-locations";
};

type Feed = {
  state: "live" | "unavailable" | "degraded" | "awaiting_feed" | "caching";
  generated_at: string | null;
  source: { id: string; name: string; method: string };
  count: number;
  cache_age_seconds?: number;
  error_class?: "timeout" | "upstream" | "schema" | "empty";
  civint_index?: { attempted: boolean; indexed: number; state: "indexed" | "partial" | "unavailable" };
  total_count?: number;
  features: Camera[];
};

let cachedFeed: Feed | null = null;
let cachedAt = 0;
let inflight: Promise<Feed> | null = null;

function selectViewport(features: Camera[], west: number, south: number, east: number, north: number, limit: number): Camera[] {
  const inView = features.filter((camera) =>
    camera.longitude >= west && camera.longitude <= east &&
    camera.latitude >= south && camera.latitude <= north
  );
  if (inView.length <= limit) return inView;

  // Preserve geographic coverage instead of taking the first N records.
  const cols = Math.max(1, Math.ceil(Math.sqrt(limit * Math.max(0.35, Math.cos(((south + north) / 2) * Math.PI / 180)))));
  const rows = Math.max(1, Math.ceil(limit / cols));
  const cellW = Math.max((east - west) / cols, 0.0001);
  const cellH = Math.max((north - south) / rows, 0.0001);
  const picked = new Map<string, Camera>();
  for (const camera of inView) {
    const col = Math.min(cols - 1, Math.max(0, Math.floor((camera.longitude - west) / cellW)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor((camera.latitude - south) / cellH)));
    const key = row + ":" + col;
    if (!picked.has(key)) picked.set(key, camera);
    if (picked.size >= limit) break;
  }
  return [...picked.values()];
}

function normalizeFeature(feature: any, index: number): Camera | null {
  const coords = feature?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const longitude = Number(coords[0]);
  const latitude = Number(coords[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const p = feature?.properties ?? {};
  return {
    id: String(p.id ?? p.camera_id ?? index),
    latitude,
    longitude,
    type: p.type ? String(p.type) : null,
    mounted_on: p.mounted_on ? String(p.mounted_on) : null,
    reported_at: p.reported_at ? String(p.reported_at) : null,
    verified: Boolean(p.verified ?? p.verification_status === "verified"),
    source: "flock-locations",
  };
}

async function loadFeed(): Promise<Feed> {
  const now = Date.now();
  if (cachedFeed && now - cachedAt < CACHE_TTL_MS) return cachedFeed;
  if (inflight) return inflight;

  inflight = (async () => {
    const upstream = await fetch(UPSTREAM, {
      headers: { Accept: "application/geo+json, application/json" },
      signal: AbortSignal.timeout(12000),
    });

    if (!upstream.ok) throw new Error("Upstream returned " + upstream.status);

    const payload = await upstream.json() as { features?: any[] };
    if (!Array.isArray(payload.features)) throw Object.assign(new Error("Upstream schema missing features"), { code: "schema" });
    const features = (payload.features ?? [])
      .map(normalizeFeature)
      .filter((x): x is Camera => x !== null);

    const feed: Feed = {
      state: features.length ? "live" : "degraded",
      generated_at: new Date().toISOString(),
      source: {
        id: "flock-locations",
        name: "Flock Locations public camera reports",
        method: "server-side public GeoJSON ingestion",
      },
      count: features.length,
      features,
    };

    cachedFeed = feed;
    cachedAt = Date.now();

    return feed;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

export const Route = createFileRoute("/api/civint/alpr/data")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const feed = await loadFeed();
          const url = new URL(request.url);
          const bbox = ["west","south","east","north"].map((key) => Number(url.searchParams.get(key)));
          const hasBbox = bbox.every(Number.isFinite) && bbox[0] < bbox[2] && bbox[1] < bbox[3];
          const limitParam = Number(url.searchParams.get("limit") ?? "5000");
          const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 5000, 500), 15000);
          const visible = hasBbox ? selectViewport(feed.features, bbox[0], bbox[1], bbox[2], bbox[3], limit) : feed.features.slice(0, limit);
          const responseFeed = { ...feed, count: visible.length, total_count: feed.features.length, features: visible };
          return Response.json(
            responseFeed,
            {
              headers: {
                "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=1800",
                "Content-Type": "application/json; charset=utf-8",
              },
            },
          );
        } catch (error) {
          if (cachedFeed) {
            return Response.json(
              { ...cachedFeed, state: "degraded", cache_age_seconds: Math.max(0, Math.round((Date.now() - cachedAt) / 1000)) },
              {
                headers: {
                  "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
                  "X-CIVINT-Cache": "stale",
                  "Content-Type": "application/json; charset=utf-8",
                },
              },
            );
          }

          return Response.json(
            {
              state: "unavailable",
              error_class: (error as any)?.code === "schema" ? "schema" : (error as any)?.name === "TimeoutError" ? "timeout" : "upstream",
              error: error instanceof Error ? error.message : "Upstream unavailable",
              features: [],
            },
            { status: 502, headers: { "Cache-Control": "public, max-age=30" } },
          );
        }
      },
    },
  },
});
