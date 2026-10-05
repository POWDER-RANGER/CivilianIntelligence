import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Submission = {
  name?: string;
  tickers?: string[];
  exchanges?: string[];
  filings?: { recent?: { accessionNumber?: string[]; filingDate?: string[]; form?: string[]; primaryDocument?: string[]; primaryDocDescription?: string[] } };
};

export function SecRecordsPanel() {
  const [cik, setCik] = useState("");
  const [data, setData] = useState<Submission | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "live" | "not-found" | "error">("idle");

  async function lookup() {
    if (!cik.trim()) return;
    setState("loading");
    try {
      const response = await fetch(`/api/civint/finance/sec?cik=${encodeURIComponent(cik)}`);
      if (!response.ok) { setData(null); setState("not-found"); return; }
      setData(await response.json() as Submission);
      setState("live");
    } catch {
      setData(null);
      setState("error");
    }
  }

  const filings = data?.filings?.recent;
  const count = filings?.form?.length ?? 0;

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Native corporate records</p>
          <h2 className="mt-1 font-display text-3xl">SEC filing desk</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Search an entity by CIK and read its filing history inside CIVINT. No private market feed is implied.
          </p>
        </div>
        <Badge variant={state === "live" ? "live" : "outline"}>{state === "idle" ? "ready" : state}</Badge>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={cik} onChange={(e) => setCik(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void lookup(); }} placeholder="SEC CIK, e.g. 320193" inputMode="numeric" aria-label="SEC Central Index Key" className="min-h-11 w-full rounded-lg border border-border bg-background px-10 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <Button onClick={() => void lookup()} disabled={state === "loading"} className="min-h-11">Lookup filing history</Button>
      </div>

      {state === "idle" && <p className="mt-4 text-xs text-muted-foreground">Enter a CIK to load the public EDGAR submission record.</p>}
      {state === "loading" && <p className="mt-4 text-xs text-muted-foreground">Reading EDGAR…</p>}
      {state === "not-found" && <p className="mt-4 text-xs text-muted-foreground">No public filing record was returned for that CIK.</p>}
      {state === "error" && <p className="mt-4 text-xs text-muted-foreground">SEC source unavailable. No synthetic records are shown.</p>}

      {state === "live" && data && (
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <h3 className="font-display text-2xl">{data.name ?? "Unnamed filer"}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {(data.tickers ?? []).join(", ") || "No ticker reported"} · {(data.exchanges ?? []).join(", ") || "Exchange not reported"}
            </p>
          </div>
          <Badge variant="outline">{count.toLocaleString()} recent filings</Badge>
        </div>
      )}

      {state === "live" && filings && count > 0 && (
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {Array.from({ length: Math.min(count, 8) }, (_, index) => {
            const form = filings.form?.[index] ?? "Filing";
            const date = filings.filingDate?.[index] ?? "—";
            const accession = filings.accessionNumber?.[index] ?? "";
            const document = filings.primaryDocument?.[index] ?? "";
            return (
              <a key={accession || index} href={accession ? `https://www.sec.gov/Archives/edgar/data/${cik}/${accession.replace(/-/g, "")}/${document}` : "https://www.sec.gov/edgar/searchedgar/companysearch"} target="_blank" rel="noreferrer" className="group rounded-xl border border-border bg-background p-4 hover:border-primary/40 hover:bg-accent/40">
                <div className="flex items-center justify-between gap-2"><Badge variant="outline">{form}</Badge><ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-primary" /></div>
                <p className="mt-3 text-sm font-medium">{filings.primaryDocDescription?.[index] ?? document || "SEC filing"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{date} · {accession || "accession not reported"}</p>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
