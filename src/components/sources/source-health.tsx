import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Database, FileText, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SOURCES, type SourceDefinition } from "@/lib/sources";

const ICONS = {
  "surveillance infrastructure": Radio,
  "federal spending": Database,
  "corporate filings": FileText,
  legislation: FileText,
  oversight: FileText,
  regulatory: FileText,
} satisfies Record<SourceDefinition["category"], typeof Activity>;

type Status = { source: SourceDefinition; state: "reachable" | "unavailable"; checked_at: string };

export function SourceHealth() {
  const [items, setItems] = useState<Status[] | null>(null);
  useEffect(() => {
    fetch("/api/civint/sources", { headers: { Accept: "application/json" } })
      .then((r) => r.json() as Promise<{ sources: Status[] }>)
      .then((data) => setItems(data.sources))
      .catch(() => setItems(SOURCES.map((source) => ({ source, state: "unavailable", checked_at: new Date().toISOString() }))));
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Evidence layer</p>
          <h2 className="mt-1 font-display text-3xl">Sources at a glance</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            CIVINT keeps the original source visible, but brings the useful record into the product.
            Availability below is checked server-side.
          </p>
        </div>
        <Badge variant="outline">{items?.filter((x) => x.state === "reachable").length ?? 0}/{SOURCES.length} reachable</Badge>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {SOURCES.map((source) => {
          const status = items?.find((x) => x.source.id === source.id);
          const Icon = ICONS[source.category];
          return (
            <article key={source.id} className="rounded-xl border border-border bg-background p-4 transition-transform duration-200 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="size-4" />
                </span>
                <Badge variant={status?.state === "reachable" ? "live" : "outline"}>
                  {status?.state ?? "checking"}
                </Badge>
              </div>
              <h3 className="mt-4 text-sm font-semibold">{source.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{source.category}</p>
              <dl className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Native surface</dt><dd className="text-right">{source.nativeSurface}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Cadence</dt><dd className="text-right">{source.cadence}</dd></div>
              </dl>
              <a href={source.endpoint} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Open source <ArrowUpRight className="size-3" />
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
