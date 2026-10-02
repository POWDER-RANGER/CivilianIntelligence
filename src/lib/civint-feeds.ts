/**
 * CIVINT ingest feed loaders.
 *
 * These read the dashboard-ready JSON produced by ingest/civint_ingest.py
 * (alerts.json, awards.json, alpr_overpass.json). In production the files
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

/** Format a USD amount for display cards. */
export function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
