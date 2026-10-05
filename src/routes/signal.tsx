import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, BookOpen, FileSearch, Newspaper, Scale, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ABSENCE_DISCLAIMER, absenceLabel, type StoryCluster } from "@/lib/signal-record";

export const Route = createFileRoute("/signal")({ component: SignalRecordPage });

type WindowOption = "6h" | "12h" | "24h" | "48h" | "7d";
const OUTLETS = ["All", "Fox", "CNN", "MSNBC", "NYT", "WaPo", "AP", "Reuters", "NPR", "Politico", "The Hill", "Others"];
const STARTER_CLUSTERS: StoryCluster[] = [];

function SignalRecordPage() {
  const [window, setWindow] = useState<WindowOption>("24h");
  const [outlet, setOutlet] = useState("All");
  const [query, setQuery] = useState("");
  const [weaker, setWeaker] = useState(false);
  const clusters = useMemo(() => STARTER_CLUSTERS.filter((cluster) => {
    const q = query.trim().toLowerCase();
    return (!q || cluster.canonicalTopic.toLowerCase().includes(q)) &&
      (outlet === "All" || cluster.mediaItems.some((item) => item.outlet === outlet));
  }), [outlet, query]);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">VEIL / evidence layer</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">Signal vs. Record</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Media emphasis side-by-side with primary public records. CIVINT does not adjudicate truth — it surfaces both.</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground"><Scale className="size-4" />Evidence stays attached</div>
        </div>

        <section className="mt-6 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Window</span>
            {(["6h", "12h", "24h", "48h", "7d"] as WindowOption[]).map((item) => <Button key={item} type="button" size="sm" variant={window === item ? "default" : "outline"} onClick={() => setWindow(item)}>{item}</Button>)}
            <span className="mx-2 hidden h-5 w-px bg-border sm:block" />
            <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Outlet</span>
            <select aria-label="Outlet filter" value={outlet} onChange={(e) => setOutlet(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">{OUTLETS.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter stories or records…" aria-label="Filter stories or records" className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-base outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <label className="flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-xs text-muted-foreground"><input type="checkbox" checked={weaker} onChange={(e) => setWeaker(e.target.checked)} />Include weaker matches</label>
            <Button type="button" variant="outline" title="Desk Assistant context is scaffolded; no assistant call is made from this page yet."><BookOpen className="mr-2 size-4" />Ask Desk</Button>
          </div>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-5"><div className="flex items-start gap-3"><Newspaper className="mt-0.5 size-5" /><div><h2 className="font-display text-2xl">Media Signal</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">What is receiving attention, measured from permitted headlines/feed metadata. No outlet is treated as a truth score.</p></div></div></section>
          <section className="rounded-xl border border-border bg-card p-5"><div className="flex items-start gap-3"><FileSearch className="mt-0.5 size-5" /><div><h2 className="font-display text-2xl">Public Record Baseline</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">What CIVINT can match to indexed government records, with agency, identifier, date, provenance, and original source retained.</p></div></div></section>
        </div>

        <section className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Story clusters</p><h2 className="mt-1 font-display text-2xl">Attention beside evidence</h2></div><Badge variant="outline">{clusters.length} indexed clusters</Badge></div>
          {clusters.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <BookOpen className="mx-auto size-6 text-muted-foreground" />
              <h3 className="mt-3 font-display text-xl">The evidence lane is ready — media ingest is not enabled yet.</h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">CIVINT deliberately shows no synthetic headlines or fabricated matches. When a permitted feed adapter is configured, this surface will cluster headline metadata and compare it against indexed public records.</p>
              <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">{absenceLabel(false)} {ABSENCE_DISCLAIMER}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2"><Button asChild size="sm"><Link to="/reading-room">Browse Reading Room</Link></Button><Button asChild size="sm" variant="outline"><Link to="/sources">Inspect sources</Link></Button></div>
            </div>
          ) : clusters.map((cluster) => (
            <article key={cluster.id} className="mt-4 rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-xl">{cluster.canonicalTopic}</h3><p className="mt-1 text-xs text-muted-foreground">Covered by {cluster.coverage.outletCount} outlets · first seen {cluster.firstSeen}</p></div><Button size="sm" variant="outline"><Bell className="mr-2 size-3.5" />Watch</Button></div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg bg-muted/50 p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Media Signal</p>{cluster.mediaItems.map((item) => <div key={item.id} className="mt-3"><p className="text-sm font-medium">{item.headline}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.outlet} · {item.publishedAt}</p></div>)}</div>
                <div className="rounded-lg bg-muted/50 p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Public Record Baseline</p>{cluster.publicRecords.length ? cluster.publicRecords.map((record) => <div key={record.id} className="mt-3"><p className="text-sm font-medium">{record.title}</p><p className="mt-1 text-[11px] text-muted-foreground">{record.agency ?? "Agency not specified"} · {record.identifiers.join(", ") || "no identifier"}</p></div>) : <p className="mt-3 text-sm text-muted-foreground">{absenceLabel(false)}</p>}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">{cluster.matchingEvidence.filter((e) => weaker || e.score >= 0.4).map((e) => <Badge key={e.explanation} variant="outline">{e.type} · {e.score.toFixed(2)}</Badge>)}</div>
            </article>
          ))}
        </section>

        <p className="mt-6 max-w-4xl text-xs leading-relaxed text-muted-foreground">Matching is deterministic and explainable. Outlet reputation/bias metadata, if added later, remains contextual and never changes evidence-match scores. Full article text is not mirrored unless licensing permits it.</p>
      </div>
    </AppShell>
  );
}
