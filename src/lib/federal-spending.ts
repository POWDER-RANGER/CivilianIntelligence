/**
 * Server-owned USAspending queries for the Finance desk (roadmap P1-4).
 *
 * The browser used to post an arbitrary `spending_by_award` body that the hub
 * forwarded upstream and then indexed into the Record Index. Now the browser
 * names a view and a page; the hub builds the upstream request itself, so only
 * these vetted queries can reach USAspending or write records.
 */

const CONTRACT_TYPES = ["A", "B", "C", "D"];

export const FEDERAL_VIEWS = {
  surveillance: {
    label: "Surveillance technology",
    note: "Federal contracts whose award text mentions license plate readers, Flock Safety, ShotSpotter or SoundThinking, FY2021 to date.",
    filters: {
      keywords: ["license plate reader", "Flock Safety", "ShotSpotter", "SoundThinking"],
      award_type_codes: CONTRACT_TYPES,
      time_period: [{ start_date: "2020-10-01", end_date: "2026-09-30" }],
    },
  },
  largest: {
    label: "Largest awards with FY2026 activity",
    note: "Contracts with transactions in fiscal year 2026, ranked by total award value over the award's lifetime.",
    filters: {
      award_type_codes: CONTRACT_TYPES,
      time_period: [{ start_date: "2025-10-01", end_date: "2026-09-30" }],
    },
  },
} as const;

export type FederalViewId = keyof typeof FEDERAL_VIEWS;

export const FEDERAL_FIELDS = [
  "Award ID",
  "Recipient Name",
  "Award Amount",
  "Contract Award Type",
  "Awarding Agency",
  "Start Date",
  "End Date",
  "Description",
] as const;

export const FEDERAL_MAX_PAGE = 50;
export const FEDERAL_PAGE_SIZE = 10;

export type FederalRequestResult =
  | { ok: true; view: FederalViewId; page: number }
  | { ok: false; error: string };

/** Validate the browser's `{ view, page? }` body. Anything else is rejected. */
export function parseFederalRequest(body: unknown): FederalRequestResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const record = body as Record<string, unknown>;
  const extra = Object.keys(record).filter((key) => key !== "view" && key !== "page");
  if (extra.length) return { ok: false, error: `Unsupported field(s): ${extra.join(", ")}.` };
  const view = record.view;
  if (typeof view !== "string" || !Object.hasOwn(FEDERAL_VIEWS, view)) {
    return { ok: false, error: `view must be one of: ${Object.keys(FEDERAL_VIEWS).join(", ")}.` };
  }
  const page = record.page ?? 1;
  if (typeof page !== "number" || !Number.isInteger(page) || page < 1 || page > FEDERAL_MAX_PAGE) {
    return { ok: false, error: `page must be an integer from 1 to ${FEDERAL_MAX_PAGE}.` };
  }
  return { ok: true, view: view as FederalViewId, page };
}

/** The exact upstream body for a validated view and page. */
export function buildUpstreamBody(view: FederalViewId, page: number) {
  return {
    filters: FEDERAL_VIEWS[view].filters,
    fields: [...FEDERAL_FIELDS],
    page,
    limit: FEDERAL_PAGE_SIZE,
    sort: "Award Amount",
    order: "desc",
  };
}
