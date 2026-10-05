import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type Award = { "Award ID"?: string; "Recipient Name"?: string; "Award Amount"?: number; "Award Type"?: string; "Awarding Agency"?: string; "Start Date"?: string; "End Date"?: string };
type Result = { results?: Award[]; page_metadata?: { total?: number }; spending_level?: string };

export function FederalSpendingPanel() {
  const [data, setData] = useState<Result | null>(null);
  const [state, setState] = useState("loading");
  useEffect(() => {
    fetch("/api/civint/finance/federal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filters: { time_period: [{ start_date: "2026-01-01", end_date: "2026-12-31" }], award_type_codes: ["A", "B", "C", "D"] },
        fields: ["Award ID", "Recipient Name", "Award Amount", "Award Type", "Awarding Agency", "Start Date", "End Date"],
        page: 1, limit: 10, sort: "Award Amount", order: "desc",
      }),
    }).then(async (r) => { const x = await r.json(); setData(x); setState(r.ok ? "live" : "unavailable"); })
      .catch(() => setState("unavailable"));
  }, []);
  return <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
      <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Native federal records</p><h2 className="mt-1 font-display text-3xl">Federal spending intelligence</h2><p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">CIVINT queries the USAspending public API server-side. The user stays inside CIVINT while the source record and provenance remain visible.</p></div>
      <Badge variant={state === "live" ? "live" : "outline"}>{state}</Badge>
    </header>
    <div className="divide-y divide-border">
      {(data?.results ?? []).map((a, i) => <div key={a["Award ID"] ?? i} className="grid gap-2 p-5 md:grid-cols-[1fr_auto]">
        <div><p className="text-sm font-medium">{a["Recipient Name"] ?? "Unknown recipient"}</p><p className="mt-1 text-xs text-muted-foreground">{a["Awarding Agency"] ?? "Unknown agency"} · {a["Award Type"] ?? "Award"} · {a["Start Date"] ?? "—"} → {a["End Date"] ?? "—"}</p><p className="mt-2 font-mono text-[10px] text-muted-foreground">Award {a["Award ID"] ?? "—"}</p></div>
        <p className="font-display text-2xl tabular-nums">{typeof a["Award Amount"] === "number" ? "$" + a["Award Amount"].toLocaleString() : "—"}</p>
      </div>)}
      {state === "loading" && <p className="p-8 text-sm text-muted-foreground">Querying the public record...</p>}
      {state === "unavailable" && <p className="p-8 text-sm text-muted-foreground">USAspending source unavailable. No synthetic records are shown.</p>}
      {state === "live" && !data?.results?.length && <p className="p-8 text-sm text-muted-foreground">No records returned for this query.</p>}
    </div>
    <footer className="border-t border-border px-5 py-3 text-[10px] text-muted-foreground">Source: USAspending.gov API · server-proxied by CIVINT · public federal spending record</footer>
  </section>;
}
