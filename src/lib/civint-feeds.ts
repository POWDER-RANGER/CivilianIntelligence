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
  const data = await softJson<unknown>("/awards.json");
  return normalizeAwards(data);
}

export type CivintAlprSnapshot = {
  nodes: CivintAlprNode[];
  /** OSM extract timestamp (osm3s.timestamp_osm_base), or null if the file predates the field. */
  asOf: string | null;
  generator: string | null;
};

export async function getCivintAlprSnapshot(): Promise<CivintAlprSnapshot> {
  const data = await softJson<{
    osm3s?: { timestamp_osm_base?: string };
    generator?: string;
    elements?: CivintAlprNode[];
  }>("/alpr_overpass.json");
  return {
    nodes: Array.isArray(data?.elements) ? data.elements : [],
    asOf: data?.osm3s?.timestamp_osm_base ?? null,
    generator: data?.generator ?? null,
  };
}

export async function getCivintAlpr(): Promise<CivintAlprNode[]> {
  return (await getCivintAlprSnapshot()).nodes;
}

/**
 * Accepts the current shape and the pre-audit shape (one row per term, no internal_id/terms), de-dupes by
 * award, and sorts by amount so a consumer's "top N" is meaningful. Rows that are not objects are dropped.
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
    const matchedBy = Array.isArray(r.matched_by) ? r.matched_by.map(String) : r.matched_by ? [String(r.matched_by)] : [];
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

/** Format a USD amount for display cards. */
export function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function totalAwardAmount(awards: CivintAward[]): number {
  return awards.reduce((sum, a) => sum + (Number.isFinite(a.amount) ? a.amount : 0), 0);
}

/** Awards whose recipient name matched the search term (stronger evidence than a free-text keyword hit). */
export function isRecipientMatch(a: CivintAward): boolean {
  return a.matched_by.includes("recipient_search_text");
}

/** Public USAspending record for an award, keyed by generated_internal_id. */
export function usaspendingAwardUrl(internalId: string): string {
  return `https://www.usaspending.gov/award/${encodeURIComponent(internalId)}`;
}

export function topRecipients(
  awards: CivintAward[],
  n = 5,
): Array<{ recipient: string; total: number; count: number }> {
  const by = new Map<string, { recipient: string; total: number; count: number }>();
  for (const a of awards) {
    const key = a.recipient.trim().toLowerCase();
    if (!key) continue;
    const cur = by.get(key) ?? { recipient: a.recipient.trim(), total: 0, count: 0 };
    cur.total += Number.isFinite(a.amount) ? a.amount : 0;
    cur.count += 1;
    by.set(key, cur);
  }
  return [...by.values()].sort((x, y) => y.total - x.total).slice(0, n);
}

export type AlprSummary = {
  total: number;
  withOperator: number;
  withDirection: number;
  operators: Array<{ name: string; count: number }>;
};

export function alprOperator(tags: Record<string, string> | undefined): string | null {
  const v = (tags?.operator ?? tags?.brand ?? tags?.manufacturer ?? "").trim();
  return v || null;
}

/**
 * Summarises OSM ALPR nodes. These are crowd-mapped points, not an official inventory, so counts are a
 * floor on what exists; the UI says so.
 */
export function summarizeAlpr(nodes: CivintAlprNode[], topN = 5): AlprSummary {
  const ops = new Map<string, { name: string; count: number }>();
  let withOperator = 0;
  let withDirection = 0;
  for (const n of nodes) {
    const op = alprOperator(n.tags);
    if (op) {
      withOperator += 1;
      const key = op.toLowerCase();
      const cur = ops.get(key) ?? { name: op, count: 0 };
      cur.count += 1;
      ops.set(key, cur);
    }
    if ((n.tags?.direction ?? n.tags?.["camera:direction"] ?? "").trim()) withDirection += 1;
  }
  return {
    total: nodes.length,
    withOperator,
    withDirection,
    operators: [...ops.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, topN),
  };
}

/** Whole days between an ISO timestamp and `now`; null if unparseable. Clamped at 0 for clock skew. */
export function snapshotAgeDays(iso: string | null, now: number = Date.now()): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((now - t) / 86_400_000));
}
