export type AlprProvider = {
  id: string;
  name: string;
  role: "primary" | "fallback" | "validation";
  endpoint: string;
  format: "vector-tiles" | "geojson";
  coverage: string;
  cadence: string;
  provenance: string;
  notes: string;
};

export const ALPR_PROVIDERS: AlprProvider[] = [
  {
    id: "deflock-vector-tiles",
    name: "DeFlock / FlockHopper camera tiles",
    role: "primary",
    endpoint: "https://tiles.dontgetflocked.com/cameras-us-hourly.json",
    format: "vector-tiles",
    coverage: "United States",
    cadence: "hourly",
    provenance: "OpenStreetMap / DeFlock community",
    notes: "Viewport-native vector tiles; the map only requests tiles covering the current view.",
  },
  {
    id: "flock-locations",
    name: "Flock Locations",
    role: "fallback",
    endpoint: "https://flocklocations.com/api/cameras/export?format=geojson",
    format: "geojson",
    coverage: "United States",
    cadence: "published feed",
    provenance: "Independent community-run dataset",
    notes: "Retained for source comparison, fallback ingestion, and provenance; never blocks the primary map.",
  },
  {
    id: "openstreetmap-alpr",
    name: "OpenStreetMap ALPR",
    role: "validation",
    endpoint: "https://www.openstreetmap.org/",
    format: "geojson",
    coverage: "Global",
    cadence: "continuously edited",
    provenance: "OpenStreetMap contributors",
    notes: "Underlying public observation layer used by major ALPR transparency projects.",
  },
];

export const PRIMARY_ALPR_PROVIDER = ALPR_PROVIDERS.find((provider) => provider.role === "primary")!;
