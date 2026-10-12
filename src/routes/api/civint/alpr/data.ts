import { createFileRoute } from "@tanstack/react-router";
import { camerasNear } from "@/lib/alpr-nearby";

// GET /api/civint/alpr/data?lat=&lon=&radius=
//
// Previously this route downloaded the full Flock Locations GeoJSON export
// (~56 MB, ~136k features), parsed it in-process (~270 MB RSS — over half a
// 512 MB Render instance) and upserted every camera into the Record Index every
// 10 minutes. Nothing in the UI called it; one stray request could OOM the
// service and burn the free Neon compute allowance.
//
// It now answers bounded, point-radius queries from the DeFlock vector tiles —
// the same provider the map uses — and never touches the database.

export const Route = createFileRoute("/api/civint/alpr/data")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const rawLat = url.searchParams.get("lat");
        const rawLon = url.searchParams.get("lon");
        const lat = rawLat === null || rawLat.trim() === "" ? Number.NaN : Number(rawLat);
        const lon = rawLon === null || rawLon.trim() === "" ? Number.NaN : Number(rawLon);
        const radius = Math.min(10, Math.max(0.5, Number(url.searchParams.get("radius")) || 5));
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
          return Response.json(
            {
              state: "invalid",
              message: "Pass lat and lon (and optional radius in miles, max 10). For a full map, use the vector tiles directly.",
              tiles: "https://tiles.dontgetflocked.com/cameras-us-hourly.json",
            },
            { status: 400 },
          );
        }
        try {
          const summary = await camerasNear(lat, lon, radius);
          return Response.json({ state: "live", ...summary }, { headers: { "Cache-Control": "public, max-age=600" } });
        } catch (error) {
          return Response.json(
            { state: "unavailable", error: error instanceof Error ? error.message : "Upstream unavailable" },
            { status: 502, headers: { "Cache-Control": "public, max-age=30" } },
          );
        }
      },
    },
  },
});
