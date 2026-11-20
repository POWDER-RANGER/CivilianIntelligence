// Public, unauthenticated search results only. No session material or credentials.
export const MAX_QUERIES = 8;
export const MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const STORAGE_KEY = "civint.native.public-records.v1";
export function safeRecord(item) {
  if (!item || typeof item.title !== "string" || typeof item.sourceUrl !== "string") return null;
  if (item.title.length > 400 || item.sourceUrl.length > 2048) return null;
  let url;
  try { url = new URL(item.sourceUrl); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const fields = ["agency", "kind", "publishedAt"];
  const out = {title: item.title, sourceUrl: url.href};
  for (const field of fields) if (typeof item[field] === "string") out[field] = item[field].slice(0, 200);
  return out;
}
export function normalizeQuery(query) { return String(query).trim().toLocaleLowerCase().slice(0, 160); }
export function readCache(storage, now = Date.now()) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw || raw.length > 200000) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(entry => entry && typeof entry.query === "string" && entry.query.length <= 160 &&
      Number.isFinite(entry.savedAt) && entry.savedAt <= now && now - entry.savedAt <= MAX_AGE_MS &&
      Array.isArray(entry.records) && entry.records.length <= 20)
      .map(entry => ({query: entry.query, savedAt: entry.savedAt, records: entry.records.map(safeRecord).filter(Boolean)}))
      .slice(0, MAX_QUERIES);
  } catch { return []; }
}
export function saveCache(storage, query, records, now = Date.now()) {
  const key = normalizeQuery(query);
  if (!key || !Array.isArray(records)) return false;
  const next = [{query: key, savedAt: now, records: records.slice(0, 20).map(safeRecord).filter(Boolean)},
    ...readCache(storage, now).filter(entry => entry.query !== key)].slice(0, MAX_QUERIES);
  try { storage.setItem(STORAGE_KEY, JSON.stringify(next)); return true; } catch { return false; }
}
export function findCached(storage, query, now = Date.now()) {
  return readCache(storage, now).find(entry => entry.query === normalizeQuery(query)) || null;
}
export function clearCache(storage) { try { storage.removeItem(STORAGE_KEY); return true; } catch { return false; } }
