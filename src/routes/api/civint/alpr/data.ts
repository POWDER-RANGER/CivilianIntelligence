import { createFileRoute } from "@tanstack/react-router";

const UPSTREAM = "https://flocklocations.com/api/cameras/export?format=geojson";

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

export const Route = createFileRoute("/api/civint/alpr/data")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const upstream = await fetch(UPSTREAM, {
            headers: { Accept: "application/geo+json, application/json" },
            signal: AbortSignal.timeout(15000),
          });
          if (!upstream.ok) {
            return Response.json(
              { state: "unavailable", error: `Upstream returned ${upstream.status}`, features: [] },
              { status: 502, headers: { "Cache-Control": "public, max-age=60" } },
            );
          }
          const payload = await upstream.json() as { features?: any[] };
          const features = (payload.features ?? [])
            .map(normalizeFeature)
            .filter((x): x is Camera => x !== null);
          return Response.json(
            {
              state: "live",
              generated_at: new Date().toISOString(),
              source: {
                id: "flock-locations",
                name: "Flock Locations public camera reports",
                method: "server-side public GeoJSON ingestion",
              },
              count: features.length,
              features,
            },
            {
              headers: {
                "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=1800",
                "Content-Type": "application/json; charset=utf-8",
              },
            },
          );
        } catch (error) {
          return Response.json(
            { state: "unavailable", error: error instanceof Error ? error.message : "Upstream unavailable", features: [] },
            { status: 502, headers: { "Cache-Control": "public, max-age=60" } },
          );
        }
      },
    },
  },
});
