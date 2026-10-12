import { createFileRoute } from "@tanstack/react-router";
import { searchIndexedRecords } from "@/lib/record-index";

const CENSUS = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";

type Geography = {
  NAME?: string;
  BASENAME?: string;
  STATE?: string;
  COUNTY?: string;
  PLACE?: string;
  PLACEFP?: string;
  COUNTYFP?: string;
  STATEFP?: string;
};

function firstName(group: unknown): string | null {
  // The Census Geocoder returns geography groups as arrays of geography
  // objects. Accept object maps as well so a response-shape change does not
  // silently turn valid coordinates into an empty location context.
  const entries = Array.isArray(group)
    ? group
    : group && typeof group === "object"
      ? Object.values(group as Record<string, unknown>)
      : [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const geography = entry as Geography;
    const value = geography.NAME ?? geography.BASENAME;
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function geographyGroup(
  groups: Record<string, unknown> | undefined,
  ...names: string[]
): unknown {
  if (!groups) return undefined;
  for (const name of names) {
    const value = groups[name];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function uniqueResults(groups: Array<Awaited<ReturnType<typeof searchIndexedRecords>>>): Array<Awaited<ReturnType<typeof searchIndexedRecords>>[number]> {
  const seen = new Set<string>();
  const output: Array<Awaited<ReturnType<typeof searchIndexedRecords>>[number]> = [];
  for (const group of groups) for (const record of group) {
    if (seen.has(record.id)) continue;
    seen.add(record.id);
    output.push(record);
  }
  return output;
}

export const Route = createFileRoute("/api/civint/location/context")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { latitude?: unknown; longitude?: unknown };
        try {
          body = await request.json() as { latitude?: unknown; longitude?: unknown };
        } catch {
          return Response.json({ state: "invalid", message: "A JSON location request is required." }, { status: 400 });
        }
        const lat = Number(body.latitude);
        const lon = Number(body.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          return Response.json({ state: "invalid", message: "Valid latitude and longitude are required." }, { status: 400 });
        }

        try {
          const upstream = await fetch(
            CENSUS + "?x=" + encodeURIComponent(lon) +
            "&y=" + encodeURIComponent(lat) +
            "&benchmark=Public_AR_Current&vintage=Current_Current&layers=States,Counties,Places&format=json",
            { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) },
          );
          if (!upstream.ok) throw new Error(`Census geocoder returned ${upstream.status}`);
          const payload = await upstream.json() as {
            result?: { geographies?: Record<string, unknown> };
          };
          const geographies = payload.result?.geographies;
          const city = firstName(geographyGroup(geographies, "Places", "Incorporated Places", "Census Designated Places", "Places (Census)"));
          const county = firstName(geographyGroup(geographies, "Counties", "Counties (Census)"));
          const state = firstName(geographyGroup(geographies, "States", "States (Census)"));

          const [cityRecords, countyRecords, stateRecords] = await Promise.all([
            city ? searchIndexedRecords({ query: city, limit: 5 }) : Promise.resolve([]),
            county ? searchIndexedRecords({ query: county, limit: 5 }) : Promise.resolve([]),
            state ? searchIndexedRecords({ query: state, limit: 8 }) : Promise.resolve([]),
          ]);

          return Response.json(
            {
              state: "available",
              geography: { city, county, state },
              coverage: {
                city: cityRecords.length > 0,
                county: countyRecords.length > 0,
                state: stateRecords.length > 0,
                federal: stateRecords.length > 0,
              },
              records: {
                city: cityRecords,
                county: countyRecords,
                state: stateRecords,
                federal: uniqueResults([stateRecords]),
              },
              provenance: {
                geography: "U.S. Census Bureau Geocoder",
                evidence: "CIVINT Record Index",
              },
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch (error) {
          return Response.json(
            { state: "unavailable", message: error instanceof Error ? error.message : "Location context unavailable." },
            { status: 503 },
          );
        }
      },
    },
  },
});
