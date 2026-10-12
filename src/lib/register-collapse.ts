import type { RegisterDoc } from "./feeds";

/**
 * The Federal Register often publishes several same-day documents with an
 * identical title (e.g. one safety-zone rule per waterway segment). They are
 * distinct records upstream but read as duplicates in a short feed, so collapse
 * them into one entry and keep the count visible (live audit P1-15).
 */
export function collapseRegisterDuplicates(docs: RegisterDoc[]): RegisterDoc[] {
  const byKey = new Map<string, RegisterDoc>();
  for (const doc of docs) {
    const key = [doc.publication_date, doc.type, doc.title.trim().toLowerCase()].join("|");
    const existing = byKey.get(key);
    if (existing) existing.duplicateCount = (existing.duplicateCount ?? 1) + 1;
    else byKey.set(key, { ...doc });
  }
  return [...byKey.values()];
}
