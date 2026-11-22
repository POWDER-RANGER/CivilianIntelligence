/** Official USGS source observations for the public intelligence API. */
export const USGS_FEED_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson";
const MAX_FEED_BYTES = 2_000_000;
const REFRESH_MS = 60_000;
const STALE_LIMIT_MS = 6 * 60 * 60_000;

export type UsgsEvent = {
  id: string;
  type: "earthquake";
  title: string;
  observed_at: string;
  fetched_at: string;
  freshness: "live" | "historical";
  review_status: "reviewed" | "preliminary";
  magnitude: number | null;
  importance: number;
  importance_basis: "earthquake_magnitude_only";
  publisher: { name: "USGS"; government_level: "federal" };
  event_jurisdiction: { level: "unresolved"; name: null };
  geography: { label: string; coordinates: { latitude: number; longitude: number } | null };
  source_url: string | null;
};

const SOURCE = {
  id: "usgs-significant-day",
  name: "USGS Significant Earthquakes (Past Day)",
  publisher: "U.S. Geological Survey",
  feed_url: USGS_FEED_URL,
} as const;

export type UsgsSnapshot = {
  state: "available" | "stale" | "unavailable";
  source: typeof SOURCE;
  checked_at: string;
  last_success_at: string | null;
  events: UsgsEvent[];
  reason?: "upstream-unavailable";
};

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
function hasControlChars(value: string): boolean {
  return [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127);
}
function validText(value: unknown, limit: number): string | null {
  if (typeof value !== "string" || !value.trim() || value.length > limit || hasControlChars(value))
    return null;
  return value.trim();
}
function observedTime(value: unknown): Date | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) ? date : null;
}
function coordinates(value: unknown): { latitude: number; longitude: number } | null {
  const arr = record(value)?.coordinates;
  if (!Array.isArray(arr) || arr.length < 2) return null;
  const [longitude, latitude] = arr;
  return typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    Math.abs(latitude) <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;
}
function sourceUrl(value: unknown): string | null {
  if (typeof value !== "string" || hasControlChars(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "earthquake.usgs.gov" &&
      (url.port === "" || url.port === "443") &&
      !url.username &&
      !url.password
      ? value
      : null;
  } catch {
    return null;
  }
}

export function normalizeUsgsFeed(payload: unknown, fetchedAt: Date): UsgsEvent[] {
  const root = record(payload);
  if (
    root?.type !== "FeatureCollection" ||
    !Array.isArray(root.features) ||
    !Number.isFinite(fetchedAt.valueOf())
  ) {
    throw new Error("Invalid USGS FeatureCollection");
  }
  const seen = new Map<string, UsgsEvent>();
  for (const feature of root.features) {
    const entry = record(feature);
    const props = record(entry?.properties);
    const sourceId = validText(entry?.id, 256);
    const observed = observedTime(props?.time);
    if (!props || !sourceId || !observed || observed.valueOf() > fetchedAt.valueOf() + 15 * 60_000)
      continue;
    const magnitude =
      typeof props.mag === "number" && Number.isFinite(props.mag) ? props.mag : null;
    const place = validText(props.place, 240) ?? "Location not specified";
    const candidate: UsgsEvent = {
      id: "usgs:" + sourceId,
      type: "earthquake",
      title: place,
      observed_at: observed.toISOString(),
      fetched_at: fetchedAt.toISOString(),
      freshness:
        fetchedAt.valueOf() - observed.valueOf() >= 0 &&
        fetchedAt.valueOf() - observed.valueOf() < 86_400_000
          ? "live"
          : "historical",
      review_status: props.status === "reviewed" ? "reviewed" : "preliminary",
      magnitude,
      importance:
        magnitude === null ? 1 : magnitude >= 6 ? 4 : magnitude >= 5 ? 3 : magnitude >= 4 ? 2 : 1,
      importance_basis: "earthquake_magnitude_only",
      publisher: { name: "USGS", government_level: "federal" },
      event_jurisdiction: { level: "unresolved", name: null },
      geography: { label: place, coordinates: coordinates(entry?.geometry) },
      source_url: sourceUrl(props.url),
    };
    const previous = seen.get(candidate.id);
    if (
      !previous ||
      candidate.observed_at > previous.observed_at ||
      (candidate.observed_at === previous.observed_at &&
        candidate.review_status === "reviewed" &&
        previous.review_status !== "reviewed")
    ) {
      seen.set(candidate.id, candidate);
    }
  }
  if (root.features.length && !seen.size) throw new Error("USGS feed has no usable records");
  return [...seen.values()].sort(
    (a, b) => b.importance - a.importance || b.observed_at.localeCompare(a.observed_at),
  );
}

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
export function createUsgsSnapshotService(
  fetcher: Fetcher = (url, init) => fetch(url, init),
  now: () => number = () => Date.now(),
) {
  let lastGood: { at: number; events: UsgsEvent[] } | null = null;
  let lastCheck = -Infinity;
  let lastFailed = false;
  let inFlight: Promise<UsgsSnapshot> | null = null;
  const snapshot = (state: UsgsSnapshot["state"], checkedAt: number): UsgsSnapshot => ({
    state,
    source: SOURCE,
    checked_at: new Date(checkedAt).toISOString(),
    last_success_at: lastGood ? new Date(lastGood.at).toISOString() : null,
    events:
      state === "unavailable"
        ? []
        : (lastGood?.events ?? []).map((event) => ({
            ...event,
            freshness:
              now() - Date.parse(event.observed_at) >= 0 &&
              now() - Date.parse(event.observed_at) < 86_400_000
                ? ("live" as const)
                : ("historical" as const),
          })),
    ...(state === "available" ? {} : { reason: "upstream-unavailable" as const }),
  });
  async function refresh(): Promise<UsgsSnapshot> {
    const checkedAt = now();
    lastCheck = checkedAt;
    try {
      const response = await fetcher(USGS_FEED_URL, {
        method: "GET",
        redirect: "error",
        credentials: "omit",
        headers: { Accept: "application/geo+json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error("USGS non-success response");
      const length = Number(response.headers.get("content-length"));
      if (Number.isFinite(length) && length > MAX_FEED_BYTES)
        throw new Error("USGS response oversized");
      const text = await response.text();
      if (new TextEncoder().encode(text).byteLength > MAX_FEED_BYTES)
        throw new Error("USGS response oversized");
      const events = normalizeUsgsFeed(JSON.parse(text), new Date(checkedAt));
      lastGood = { at: checkedAt, events };
      lastFailed = false;
      return snapshot("available", checkedAt);
    } catch (error) {
      lastFailed = true;
      console.warn(
        "[usgs] Feed refresh unavailable",
        error instanceof Error ? error.name : "Unknown",
      );
      return snapshot(
        lastGood && checkedAt - lastGood.at <= STALE_LIMIT_MS ? "stale" : "unavailable",
        checkedAt,
      );
    }
  }
  return async function getSnapshot(): Promise<UsgsSnapshot> {
    const time = now();
    if (inFlight) return inFlight;
    if (time - lastCheck < (lastFailed ? 15_000 : REFRESH_MS)) {
      return snapshot(
        lastFailed
          ? lastGood && time - lastGood.at <= STALE_LIMIT_MS
            ? "stale"
            : "unavailable"
          : "available",
        lastCheck,
      );
    }
    inFlight = refresh().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
export const getUsgsSnapshot = createUsgsSnapshotService();
