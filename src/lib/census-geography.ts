// Parser for the U.S. Census Geocoder `geographies/coordinates` response.
//
// Verified response shape (benchmark=Public_AR_Current, vintage=Current_Current,
// checked 2026-10-11): `result.geographies` is an object whose keys are layer
// names such as "States", "Counties", "Incorporated Places", "Census Designated
// Places", "County Subdivisions", "120th Congressional Districts", and whose
// values are ARRAYS of feature records. Layer names that carry a Congress number
// or a year change over time, so those are matched by pattern, not literal key.
//
// Live audit 2026-10-11 (P0-3): the previous parser read "States (Census)" etc.
// as object maps — keys that do not exist — so every coordinate returned null.

export type CensusFeature = {
  NAME?: string;
  BASENAME?: string;
  GEOID?: string;
  STUSAB?: string;
};

export type CensusGeographies = Record<string, CensusFeature[] | undefined>;

export type ResolvedGeography = {
  city: string | null;
  cityGeoid: string | null;
  county: string | null;
  countyGeoid: string | null;
  state: string | null;
  stateAbbr: string | null;
  stateGeoid: string | null;
  congressionalDistrict: string | null;
  stateSenateDistrict: string | null;
  stateHouseDistrict: string | null;
};

function first(layer: CensusFeature[] | undefined): CensusFeature | null {
  return Array.isArray(layer) && layer.length > 0 ? layer[0] : null;
}

function byPattern(geographies: CensusGeographies, pattern: RegExp): CensusFeature | null {
  for (const [key, layer] of Object.entries(geographies)) {
    if (pattern.test(key)) {
      const hit = first(layer);
      if (hit) return hit;
    }
  }
  return null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function resolveGeography(payload: unknown): ResolvedGeography {
  const geographies =
    (payload as { result?: { geographies?: CensusGeographies } } | null)?.result?.geographies ?? {};

  // City: incorporated place first, then CDP (unincorporated communities), then
  // county subdivision (townships/boroughs) so rural points still resolve.
  const place =
    first(geographies["Incorporated Places"]) ??
    first(geographies["Census Designated Places"]) ??
    first(geographies["County Subdivisions"]);
  const county = first(geographies["Counties"]);
  const state = first(geographies["States"]);
  const congress = byPattern(geographies, /Congressional Districts$/);
  const upper = byPattern(geographies, /State Legislative Districts - Upper$/);
  const lower = byPattern(geographies, /State Legislative Districts - Lower$/);

  return {
    // BASENAME drops the LSAD suffix ("Palos Hills" vs "Palos Hills city"),
    // which is what public records and agendas use.
    city: text(place?.BASENAME) ?? text(place?.NAME),
    cityGeoid: text(place?.GEOID),
    county: text(county?.NAME),
    countyGeoid: text(county?.GEOID),
    state: text(state?.NAME),
    stateAbbr: text(state?.STUSAB),
    stateGeoid: text(state?.GEOID),
    congressionalDistrict: text(congress?.NAME),
    stateSenateDistrict: text(upper?.NAME),
    stateHouseDistrict: text(lower?.NAME),
  };
}
