/**
 * CIVINT ingest feed loaders.
 *
 * These read the dashboard-ready JSON produced by ingest/civint_ingest.py
 * (alerts.json, awards.json, alpr_overpass.json, surveillance.json, sources.json). In production the files
 * live under /data/civint/ or are served by a small static endpoint;
 * during local dev they can be dropped in public/civint/.
 *
 * All loaders fail soft — empty arrays on network / parse error — so the
 * rest of the dashboard stays usable when the pipeline has not run yet.
 */

export type CivintAlert = {
  id: string;
  event: string;
  severity: string;
  area: string;
  onset: string | null;
  ends: string | null;
  headline: string;
  fetched: string;
};

export type CivintAward = {
  award_id: string;
  term: string;
  recipient: string;
  amount: number;
  agency: string;
  start_date: string;
  award_group: string;
  fetched: string;
};

export type CivintAlprNode = {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
};

export type CivintSurveillanceAsset = {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  category: "alpr" | "gunshot_detector" | "camera" | "other";
  surveillance_type: string | null;
  operator: string | null;
  manufacturer: string | null;
  name: string | null;
  zone: string | null;
  direction: string | null;
  tags: Record<string, string>;
  confidence: number | null;
  provenance: {
    source_id: string;
    source_url: string;
    observed_at: string | null;
    method: string;
    state: "snapshot" | "live" | "demo" | "unavailable";
    attribution?: string;
  };
};

export type CivintSource = {
  id: string;
  name: string;
  url: string;
  integration: string;
  status: string;
  scope?: string;
  license?: string;
  attribution?: string;
  direct_database_ingest?: boolean;
};

export type CivintSurveillanceFeed = {
  schema_version: string;
  state: "snapshot" | "live" | "demo" | "unavailable";
  generated_at: string | null;
  as_of: string | null;
  source: {
    id: string;
    name: string;
    url: string;
    license?: string;
    attribution?: string;
  };
  counts: Record<string, number>;
  elements: CivintSurveillanceAsset[];
};

const BASE = "/civint"; // public/civint/ in the Vite app, or CDN path in prod

async function softJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getCivintAlerts(): Promise<CivintAlert[]> {
  const data = await softJson<CivintAlert[]>("/alerts.json");
  return data ?? [];
}

export async function getCivintAwards(): Promise<CivintAward[]> {
  const data = await softJson<CivintAward[]>("/awards.json");
  return data ?? [];
}

export async function getCivintAlpr(): Promise<CivintAlprNode[]> {
  const data = await softJson<{ elements?: CivintAlprNode[] }>("/alpr_overpass.json");
  return data?.elements ?? [];
}

export async function getCivintSurveillance(): Promise<CivintSurveillanceFeed | null> {
  return softJson<CivintSurveillanceFeed>("/surveillance.json");
}

export type CivintSourceRegistry = {
  schema_version: string;
  purpose: string;
  updated: string;
  sources: CivintSource[];
};

export async function getCivintSources(): Promise<CivintSource[]> {
  const data = await softJson<CivintSourceRegistry>("/sources.json");
  return Array.isArray(data?.sources) ? data.sources : [];
}

/** Format a USD amount for display cards. */
export function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
