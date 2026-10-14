import { createFileRoute } from "@tanstack/react-router";
import { resolvePlace } from "@/lib/place-geocode";
import { camerasNear, type NearbySummary } from "@/lib/alpr-nearby";
import { surveillanceSpending, type PlaceSpending } from "@/lib/place-spending";

// GET /api/civint/place/dossier?q=<address | city, ST | ZIP | lat,lon>&radius=<miles>
// One sourced answer to "who is watching here, and who paid for it".

const CACHE = new Map<string, { at: number; body: unknown }>();
const TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 200;

function radiusFrom(value: string | null): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.min(10, Math.max(0.5, Math.round(n * 2) / 2));
}

type Section<T> = { state: "available"; data: T } | { state: "unavailable"; error: string };

async function section<T>(work: Promise<T>): Promise<Section<T>> {
  try {
    return { state: "available", data: await work };
  } catch (error) {
    return { state: "unavailable", error: error instanceof Error ? error.message : "Unavailable" };
  }
}

export const Route = createFileRoute("/api/civint/place/dossier")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") ?? "").trim();
        const radius = radiusFrom(url.searchParams.get("radius"));
        if (q.length < 2) {
          return Response.json({ state: "invalid", message: "Enter an address, city and state, ZIP, or coordinates." }, { status: 400 });
        }

        const key = `${q.toLowerCase()}|${radius}`;
        const cached = CACHE.get(key);
        if (cached && Date.now() - cached.at < TTL_MS) {
          return Response.json(cached.body, { headers: { "Cache-Control": "public, max-age=300", "X-CIVINT-Cache": "hit" } });
        }

        let place;
        try {
          place = await resolvePlace(q);
        } catch (error) {
          return Response.json(
            { state: "unavailable", message: "Location services did not respond. Try again shortly.", error: error instanceof Error ? error.message : String(error) },
            { status: 502 },
          );
        }
        if (!place) {
          return Response.json({ state: "not-found", message: `No U.S. location matched “${q}”. Try a street address or “City, ST”.` }, { status: 404 });
        }

        const [cameras, spending] = await Promise.all([
          section<NearbySummary>(camerasNear(place.latitude, place.longitude, radius)),
          section<PlaceSpending>(surveillanceSpending(place.geography.stateAbbr, place.geography.countyGeoid)),
        ]);

        const body = {
          state: "available",
          generatedAt: new Date().toISOString(),
          place,
          cameras,
          spending,
          request: {
            template: "state",
            state: place.geography.stateAbbr,
            suggestedAgencies: [
              place.geography.city ? `${place.geography.city} Police Department` : null,
              place.geography.county ? `${place.geography.county} Sheriff's Office` : null,
            ].filter((v): v is string => Boolean(v)),
          },
        };

        if (cameras.state === "available" || spending.state === "available") {
          if (CACHE.size >= MAX_ENTRIES) CACHE.delete(CACHE.keys().next().value as string);
          CACHE.set(key, { at: Date.now(), body });
        }
        return Response.json(body, { headers: { "Cache-Control": "public, max-age=300" } });
      },
    },
  },
});
