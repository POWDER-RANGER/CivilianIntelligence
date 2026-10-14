import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type Award = {
  "Award ID"?: string;
  "Recipient Name"?: string;
  "Award Amount"?: number;
  "Contract Award Type"?: string | null;
  "Awarding Agency"?: string;
  "Start Date"?: string;
  "End Date"?: string;
  Description?: string | null;
  generated_internal_id?: string;
};
type Result = { results?: Award[] };

// Live audit P1-14: the panel showed the largest awards of all time (Humana,
// Lockheed, national labs) — accurate but irrelevant to surveillance oversight.
// The default view is now a keyword search for surveillance technology, with
// the general view kept as an explicit second option.
const VIEWS = {
  surveillance: {
    label: "Surveillance technology",
    note: "Federal contracts whose award text mentions license plate readers, Flock Safety, ShotSpotter or SoundThinking, FY2021 to date.",
    filters: {
      keywords: ["license plate reader", "Flock Safety", "ShotSpotter", "SoundThinking"],
      award_type_codes: ["A", "B", "C", "D"],
      time_period: [{ start_date: "2020-10-01", end_date: "2026-09-30" }],
    },
  },
  largest: {
    label: "Largest awards with FY2026 activity",
    note: "Contracts with transactions in fiscal year 2026, ranked by total award value over the award's lifetime.",
    filters: {
      award_type_codes: ["A", "B", "C", "D"],
      time_period: [{ start_date: "2025-10-01", end_date: "2026-09-30" }],
    },
  },
} as const;

type ViewId = keyof typeof VIEWS;

export function FederalSpendingPanel() {
  const [view, setView] = useState<ViewId>("surveillance");
  const [data, setData] = useState<Result | null>(null);
  const [state, setState] = useState<"loading" | "live" | "unavailable">("loading");

  useEffect(() => {
    const controller = new AbortController();
    setState("loading");
    setData(null);
    fetch("/api/civint/finance/federal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        filters: VIEWS[view].filters,
        fields: ["Award ID", "Recipient Name", "Award Amount", "Contract Award Type", "Awarding Agency", "Start Date", "End Date", "Description"],
        page: 1,
        limit: 10,
        sort: "Award Amount",
        order: "desc",
      }),
    })
      .then(async (r) => {
        const x = (await r.json()) as Result;
        setData(x);
        setState(r.ok ? "live" : "unavailable");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState("unavailable");
      });
    return () => controller.abort();
  }, [view]);

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
      <header className="border-b border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">Native federal records</p>
            <h2 className="mt-1 font-display text-3xl">Federal spending</h2>
          </div>
          <Badge variant={state === "live" ? "live" : "outline"}>
            {state === "live" ? "USAspending API" : state}
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(VIEWS) as ViewId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-pressed={view === id}
              className={
                "min-h-9 rounded-full border px-3 text-xs " +
                (view === id ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-muted")
              }
            >
              {VIEWS[id].label}
            </button>
          ))}
        </div>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">{VIEWS[view].note}</p>
      </header>
      <div className="divide-y divide-border">
        {(data?.results ?? []).map((a, i) => {
          const href = a.generated_internal_id ? "https://www.usaspending.gov/award/" + encodeURIComponent(a.generated_internal_id) : null;
          return (
            <div key={(a["Award ID"] ?? "") + i} className="grid gap-2 p-5 md:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <p className="text-sm font-medium">{a["Recipient Name"] ?? "Recipient not reported"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[a["Awarding Agency"], a["Contract Award Type"], `${a["Start Date"] ?? "—"} → ${a["End Date"] ?? "—"}`].filter(Boolean).join(" · ")}
                </p>
                {a.Description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.Description}</p>}
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  Award {a["Award ID"] ?? "—"}
                  {href && (
                    <>
                      {" · "}
                      <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
                        Source record
                      </a>
                    </>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl tabular-nums">
                  {typeof a["Award Amount"] === "number" ? "$" + Math.round(a["Award Amount"]).toLocaleString() : "—"}
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">Total award value</p>
              </div>
            </div>
          );
        })}
        {state === "loading" && <p className="p-8 text-sm text-muted-foreground">Querying the public record…</p>}
        {state === "unavailable" && <p className="p-8 text-sm text-muted-foreground">USAspending source unavailable. No synthetic records are shown.</p>}
        {state === "live" && !data?.results?.length && <p className="p-8 text-sm text-muted-foreground">No records returned for this query.</p>}
      </div>
      <footer className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
        Source: USAspending.gov API · server-proxied by CIVWATCH · amounts are total award value as reported to USAspending
      </footer>
    </section>
  );
}
