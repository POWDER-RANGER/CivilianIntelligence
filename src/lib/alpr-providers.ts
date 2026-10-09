/**
 * Canonical external ALPR vector-tile provider.
 *
 * CIVINT keeps this as a referenced provider rather than copying or claiming
 * ownership of the upstream camera dataset. Its endpoint is also registered
 * in public/civint/sources.json.
 */
export const PRIMARY_ALPR_PROVIDER = {
  id: "flockhopper-deflock-tiles",
  name: "FlockHopper / DeFlock ALPR tiles",
  endpoint: "https://tiles.dontgetflocked.com/cameras-us-hourly.json",
  sourceLayer: "cameras",
  sourceUrl: "https://github.com/flockhopper3/deflock-data",
  attribution: "OpenStreetMap contributors / FlockHopper / DeFlock community",
} as const;
