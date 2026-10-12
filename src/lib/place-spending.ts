// Federal money tied to surveillance technology for a place, from USAspending.
//
// USAspending keyword search is full-text and loose, so results are presented
// as "keyword matches to verify", never as confirmed surveillance purchases.
// Contracts are matched at state level (vendor names); grants at county level
// (descriptions name the technology the local agency is buying).
// Most local ALPR buys are local procurement and will NOT appear here — the
// dossier says so.

const API = "https://api.usaspending.gov/api/v2/search/spending_by_award/";

export const CONTRACT_KEYWORDS = ["Flock Safety", "ShotSpotter", "SoundThinking", "license plate reader", "license plate recognition"];
export const GRANT_KEYWORDS = ["license plate reader", "license plate recognition", "gunshot detection", "ShotSpotter", "Flock Safety", "surveillance camera"];
const CONTRACT_TYPES = ["A", "B", "C", "D"];
const GRANT_TYPES = ["02", "03", "04", "05"];
const FIELDS = ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Description", "Start Date", "generated_internal_id"];

export type PlaceAward = {
  id: string;
  kind: "contract" | "grant";
  recipient: string;
  amount: number | null;
  agency: string | null;
  description: string | null;
  startDate: string | null;
  url: string;
};

export type PlaceSpending = {
  state: "available" | "partial" | "unavailable";
  scope: { stateAbbr: string | null; countyFips: string | null };
  contracts: PlaceAward[];
  grants: PlaceAward[];
  totals: { contracts: number; grants: number };
  keywords: { contracts: string[]; grants: string[] };
  source: { name: string; url: string };
  note: string;
};

export function normalizeAward(row: Record<string, unknown>, kind: PlaceAward["kind"]): PlaceAward | null {
  const id = String(row["Award ID"] ?? "").trim();
  if (!id) return null;
  const amount = Number(row["Award Amount"]);
  const internal = row.generated_internal_id ? String(row.generated_internal_id) : null;
  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return {
    id,
    kind,
    recipient: text(row["Recipient Name"]) ?? "Unknown recipient",
    amount: Number.isFinite(amount) ? amount : null,
    agency: text(row["Awarding Agency"]),
    description: text(row.Description),
    startDate: text(row["Start Date"]),
    url: internal ? `https://www.usaspending.gov/award/${encodeURIComponent(internal)}` : "https://www.usaspending.gov/search",
  };
}

async function search(
  keywords: string[],
  types: string[],
  location: Record<string, string>,
  kind: PlaceAward["kind"],
): Promise<PlaceAward[]> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      filters: {
        keywords,
        award_type_codes: types,
        place_of_performance_locations: [{ country: "USA", ...location }],
        time_period: [{ start_date: "2008-10-01", end_date: new Date().toISOString().slice(0, 10) }],
      },
      fields: FIELDS,
      limit: 10,
      sort: "Award Amount",
      order: "desc",
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`USAspending returned ${res.status}`);
  const payload = (await res.json()) as { results?: Array<Record<string, unknown>> };
  return (payload.results ?? []).map((r) => normalizeAward(r, kind)).filter((a): a is PlaceAward => a !== null);
}

// USAspending keyword search also matches on fields we do not return (and on
// loose stems), so keep only awards whose recipient or description visibly
// names the technology or vendor. Keeps "verify each award" honest.
const RELEVANT = /license plate|\balpr\b|\blpr\b|flock|shotspotter|soundthinking|gunshot|surveillance|camera/i;
export function isRelevantAward(a: PlaceAward): boolean {
  return RELEVANT.test(`${a.recipient} ${a.description ?? ""}`);
}

const sum = (awards: PlaceAward[]) => awards.reduce((t, a) => t + (a.amount ?? 0), 0);

export async function surveillanceSpending(stateAbbr: string | null, countyGeoid: string | null): Promise<PlaceSpending> {
  const countyFips = countyGeoid && countyGeoid.length === 5 ? countyGeoid.slice(2) : null;
  const base = {
    scope: { stateAbbr, countyFips },
    keywords: { contracts: CONTRACT_KEYWORDS, grants: GRANT_KEYWORDS },
    source: { name: "USAspending.gov", url: "https://www.usaspending.gov/search" },
    note: "Keyword matches in federal award data. Verify each award; most local ALPR purchases use local funds and appear only in city/county procurement records.",
  };
  if (!stateAbbr) {
    return { ...base, state: "unavailable", contracts: [], grants: [], totals: { contracts: 0, grants: 0 } };
  }
  const [contracts, grants] = await Promise.allSettled([
    search(CONTRACT_KEYWORDS, CONTRACT_TYPES, { state: stateAbbr }, "contract"),
    search(GRANT_KEYWORDS, GRANT_TYPES, countyFips ? { state: stateAbbr, county: countyFips } : { state: stateAbbr }, "grant"),
  ]);
  const c = contracts.status === "fulfilled" ? contracts.value.filter(isRelevantAward) : [];
  const g = grants.status === "fulfilled" ? grants.value.filter(isRelevantAward) : [];
  const failures = [contracts, grants].filter((r) => r.status === "rejected").length;
  return {
    ...base,
    state: failures === 0 ? "available" : failures === 2 ? "unavailable" : "partial",
    contracts: c,
    grants: g,
    totals: { contracts: sum(c), grants: sum(g) },
  };
}
