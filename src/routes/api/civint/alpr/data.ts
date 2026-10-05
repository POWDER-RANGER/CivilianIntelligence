import { createFileRoute } from "@tanstack/react-router";
import { upsertIndexedRecord } from "@/lib/record-index";

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
  state: "live" | "unavailable";
  generated_at: string | null;
  source: { id: string; name: string; method: string };
  count: number;
  civint_index?: { attempted: boolean; indexed: number; state: "indexed" | "partial" | "unavailable" };
  features: Camera[];
};

let cachedFeed: Feed | null = null;
let cachedAt = 0;
let inflight: Promise<Feed> | null = null;

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

async function indexFeatures(features: Camera[]) {
  let indexed = 0;
  for (let start = 0; start < features.length; start += 40) {
    const batch = features.slice(start, start + 40);
    const results = await Promise.allSettled(batch.map(async (feature) => {
      await upsertIndexedRecord({
        sourceId: "alpr-flocklocations",
        sourceRecordId: feature.id,
        kind: "alpr-observation",
        title: "Flock Locations camera report " + feature.id,
        identifiers: [feature.id],
        entities: [feature.type, feature.mounted_on].filter((value): value is string => Boolean(value)),
        sourceUrl: "https://flocklocations.com/",
        retrievalMethod: "feed",
        adapterVersion: "flocklocations-geojson-v1",
        rawContent: JSON.stringify(feature),
        hashBasis: "observation",
      });
      return true;
    }));
    indexed += results.filter((result) => result.status === "fulfilled").length;
  }
  return indexed;
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
    const features = (payload.features ?? [])
      .map(normalizeFeature)
      .filter((x): x is Camera => x !== null);

    const feed: Feed = {
      state: "live",
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

    // Indexing is deliberately decoupled from the user-facing request. The map
    // should never wait on hundreds/thousands of database writes.
    void indexFeatures(features).catch(() => undefined);

    return feed;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

export const Route = createFileRoute("/api/civint/alpr/data")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const feed = await loadFeed();
          return Response.json(
            feed,
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
              { ...cachedFeed, state: "live" },
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
