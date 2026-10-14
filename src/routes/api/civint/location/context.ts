import { createFileRoute } from "@tanstack/react-router";
import { searchIndexedRecords } from "@/lib/record-index";
import { resolveGeography } from "@/lib/census-geography";

const CENSUS = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";

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
            "&benchmark=Public_AR_Current&vintage=Current_Current&format=json",
            { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) },
          );
          if (!upstream.ok) throw new Error(`Census geocoder returned ${upstream.status}`);
          const geo = resolveGeography(await upstream.json());
          const { city, county, state } = geo;
          let indexFailed = false;

          const [cityRecords, countyRecords, stateRecords] = await Promise.all([
            city ? searchIndexedRecords({ query: city, limit: 5 }).catch(() => { indexFailed = true; return []; }) : Promise.resolve([]),
            county ? searchIndexedRecords({ query: county, limit: 5 }).catch(() => { indexFailed = true; return []; }) : Promise.resolve([]),
            state ? searchIndexedRecords({ query: state, limit: 8 }).catch(() => { indexFailed = true; return []; }) : Promise.resolve([]),
          ]);

          return Response.json(
            {
              state: "available",
              geography: {
                city,
                county,
                state,
                stateAbbr: geo.stateAbbr,
                geoids: { city: geo.cityGeoid, county: geo.countyGeoid, state: geo.stateGeoid },
                districts: {
                  congressional: geo.congressionalDistrict,
                  stateSenate: geo.stateSenateDistrict,
                  stateHouse: geo.stateHouseDistrict,
                },
              },
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
              recordIndex: indexFailed ? "unavailable" : "available",
              provenance: {
                geography: "U.S. Census Bureau Geocoder",
                evidence: "CIVWATCH Record Index",
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
