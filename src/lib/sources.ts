export type SourceCategory = "surveillance infrastructure" | "federal spending" | "corporate filings";

export type SourceDefinition = {
  id: string;
  name: string;
  category: SourceCategory;
  endpoint: string;
  healthcheckUrl: string;
  accessMethod: string;
  license: string;
  attribution: string;
  cadence: string;
  nativeSurface: string;
};

export const SOURCES: SourceDefinition[] = [
  {
    id: "alpr-flocklocations",
    name: "Flock Locations",
    category: "surveillance infrastructure",
    endpoint: "https://flocklocations.com/api/cameras/export?format=geojson",
    healthcheckUrl: "https://flocklocations.com/press",
    accessMethod: "Server-side GeoJSON",
    license: "CC BY 4.0",
    attribution: "Independent community-run dataset",
    cadence: "Published feed",
    nativeSurface: "Watchtower / ALPR Atlas",
  },
  {
    id: "usaspending",
    name: "USAspending",
    category: "federal spending",
    endpoint: "https://api.usaspending.gov/api/v2/",
    healthcheckUrl: "https://api.usaspending.gov/",
    accessMethod: "Server-side JSON API",
    license: "Public federal data",
    attribution: "USAspending.gov",
    cadence: "Continuously maintained",
    nativeSurface: "Finance / Federal Spending",
  },
  {
    id: "sec-edgar",
    name: "SEC EDGAR",
    category: "corporate filings",
    endpoint: "https://data.sec.gov/",
    healthcheckUrl: "https://data.sec.gov/",
    accessMethod: "Server-side JSON API",
    license: "Public federal data",
    attribution: "U.S. Securities and Exchange Commission",
    cadence: "Real-time filings",
    nativeSurface: "Finance / Corporate Records",
  },
];

export function getSource(id: string) {
  return SOURCES.find((source) => source.id === id);
}
