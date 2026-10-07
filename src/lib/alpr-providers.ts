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
    notes:
      "Primary map feed. TileJSON resolves viewport-native MVT tiles; the browser never downloads a national GeoJSON export.",
  },
  {
    id: "flock-locations",
    name: "Flock Locations",
    role: "validation",
    endpoint: "https://flocklocations.com/api/cameras/export?format=geojson",
    format: "geojson",
    coverage: "United States",
    cadence: "published feed",
    provenance: "Independent community-run dataset",
    notes:
      "Validation/provenance feed only. It is GeoJSON, not TileJSON, and is never passed to the MapLibre vector source.",
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
    notes:
      "Public mapping source underlying the DeFlock community dataset; shown here as provenance, not as a synchronous map query.",
  },
];

export const PRIMARY_ALPR_PROVIDER = ALPR_PROVIDERS.find(
  (provider) => provider.role === "primary",
)!;
