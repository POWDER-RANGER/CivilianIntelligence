export type RecentRecord = {
  id: string;
  title: string;
  kind: string;
  sourceName: string;
  viewedAt: string;
};

const KEY = "civint.recent-records";
const MAX = 8;

export function rememberRecentRecord(record: Omit<RecentRecord, "viewedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as RecentRecord[];
    const next = [
      { ...record, viewedAt: new Date().toISOString() },
      ...existing.filter((item) => item.id !== record.id),
    ].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Local memory is optional; never block evidence access when storage is unavailable.
  }
}

export function readRecentRecords(): RecentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, MAX) as RecentRecord[] : [];
  } catch {
    return [];
  }
}
