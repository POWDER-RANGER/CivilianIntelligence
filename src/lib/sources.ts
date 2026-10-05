export type SourceCategory = "surveillance infrastructure" | "federal spending" | "corporate filings" | "legislation" | "oversight" | "regulatory";

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
  {
    id: "congress-gov",
    name: "Congress.gov",
    category: "legislation",
    endpoint: "https://api.congress.gov/v3/",
    healthcheckUrl: "https://api.congress.gov/",
    accessMethod: "Server-side JSON API",
    license: "Public federal data",
    attribution: "U.S. Congress",
    cadence: "Continuously maintained",
    nativeSurface: "Legislation / Public Records",
  },
  {
    id: "foia-gov",
    name: "FOIA.gov",
    category: "oversight",
    endpoint: "https://api.foia.gov/api/",
    healthcheckUrl: "https://www.foia.gov/reports.html",
    accessMethod: "Server-side JSON/XML API",
    license: "Public federal data",
    attribution: "U.S. Department of Justice",
    cadence: "Annual and quarterly reporting",
    nativeSurface: "Oversight / FOIA",
  },
  {
    id: "cia-reading-room",
    name: "CIA Electronic Reading Room",
    category: "oversight",
    endpoint: "https://www.cia.gov/readingroom/",
    healthcheckUrl: "https://www.cia.gov/readingroom/",
    accessMethod: "Curated public index + official deep links",
    license: "Public federal records; source terms apply",
    attribution: "Central Intelligence Agency",
    cadence: "Agency-maintained collection",
    nativeSurface: "Reading Room / Declassified Libraries",
  },
  {
    id: "federal-register",
    name: "Federal Register",
    category: "regulatory",
    endpoint: "https://www.federalregister.gov/api/v1/",
    healthcheckUrl: "https://www.federalregister.gov/",
    accessMethod: "Server-side JSON API",
    license: "Public federal data",
    attribution: "Office of the Federal Register",
    cadence: "Daily publication",
    nativeSurface: "Oversight / Regulations",
  },
];

export function getSource(id: string) {
  return SOURCES.find((source) => source.id === id);
}
