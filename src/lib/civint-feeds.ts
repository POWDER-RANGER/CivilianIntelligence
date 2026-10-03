/**
 * CIVINT ingest feed loaders.
 *
 * Reads dashboard-ready JSON from ingest/civint_ingest.py
 * (alerts.json, awards.json, alpr_overpass.json) served under /civint/.
 * All loaders fail soft so the rest of the dashboard stays usable when
 * the pipeline has not run yet.
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
  /** USAspending generated_internal_id; unique per award in awards.json. */
  internal_id: string;
  award_id: string;
  recipient: string;
  amount: number;
  agency: string;
  start_date: string;
  award_group: string;
  /** Search terms / match modes that surfaced this award (provenance). */
  terms: string[];
  matched_by: string[];
  fetched: string;
};

export type CivintAlprNode = {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
};

export type CivintAlprSnapshot = {
  nodes: CivintAlprNode[];
  /** OSM extract timestamp (osm3s.timestamp_osm_base), if present. */
  asOf: string | null;
  generator: string | null;
};

const BASE = "/civint";

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
  return Array.isArray(data) ? data : [];
}

export async function getCivintAwards(): Promise<CivintAward[]> {
  const data = await softJson<unknown>("/awards.json");
  return normalizeAwards(data);
}

export async function getCivintAlpr(): Promise<CivintAlprSnapshot> {
  const data = await softJson<{
    elements?: CivintAlprNode[];
    osm3s?: { timestamp_osm_base?: string };
    generator?: string;
  }>("/alpr_overpass.json");
  if (!data) return { nodes: [], asOf: null, generator: null };
  return {
    nodes: Array.isArray(data.elements) ? data.elements : [],
    asOf: data.osm3s?.timestamp_osm_base ?? null,
    generator: data.generator ?? null,
  };
}

/**
 * Accepts the current shape and the pre-audit shape (one row per term),
 * de-dupes by award, and sorts by amount so a consumer's "top N" is meaningful.
 */
export function normalizeAwards(data: unknown): CivintAward[] {
  if (!Array.isArray(data)) return [];
  const byId = new Map<string, CivintAward>();
  for (const raw of data) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const awardId = String(r.award_id ?? "");
    const id = String(r.internal_id ?? awardId);
    if (!id) continue;
    const terms = Array.isArray(r.terms) ? r.terms.map(String) : r.term ? [String(r.term)] : [];
    const matchedBy = Array.isArray(r.matched_by)
      ? r.matched_by.map(String)
      : r.matched_by
        ? [String(r.matched_by)]
        : [];
    const amount = typeof r.amount === "number" && Number.isFinite(r.amount) ? r.amount : 0;
    const prev = byId.get(id);
    if (prev) {
      prev.terms = [...new Set([...prev.terms, ...terms])].sort();
      prev.matched_by = [...new Set([...prev.matched_by, ...matchedBy])].sort();
      prev.amount = Math.max(prev.amount, amount);
      continue;
    }
    byId.set(id, {
      internal_id: id,
      award_id: awardId,
      recipient: String(r.recipient ?? ""),
      amount,
      agency: String(r.agency ?? ""),
      start_date: String(r.start_date ?? ""),
      award_group: String(r.award_group ?? ""),
      terms: [...new Set(terms)].sort(),
      matched_by: [...new Set(matchedBy)].sort(),
      fetched: String(r.fetched ?? ""),
    });
  }
  return [...byId.values()].sort((a, b) => b.amount - a.amount);
}

export function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function totalAwardAmount(awards: CivintAward[]): number {
  return awards.reduce((sum, a) => sum + (Number.isFinite(a.amount) ? a.amount : 0), 0);
}

export function alertSeverityRank(severity: string): number {
  switch (severity) {
    case "Extreme":
      return 0;
    case "Severe":
      return 1;
    case "Moderate":
      return 2;
    case "Minor":
      return 3;
    default:
      return 4;
  }
}
