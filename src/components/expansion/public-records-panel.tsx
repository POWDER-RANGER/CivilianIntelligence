import { useEffect, useState } from "react";
import { ArrowUpRight, FileSearch, Landmark, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SourceCard = { name: string; label: string; description: string; state: string; href: string; icon: typeof Landmark };
const SOURCES: SourceCard[] = [
  { name: "Congress.gov", label: "Legislation", description: "Bills, actions, members, committees, hearings and nominations.", state: "unconfigured", href: "https://api.congress.gov/", icon: Landmark },
  { name: "FOIA.gov", label: "Oversight", description: "Annual and quarterly FOIA administration data by agency and year.", state: "unconfigured", href: "https://www.foia.gov/", icon: FileSearch },
  { name: "Federal Register", label: "Rules & notices", description: "Public regulatory documents and presidential materials available through a machine-readable API.", state: "available", href: "https://www.federalregister.gov/developers/api", icon: ShieldCheck },
];

export function PublicRecordsPanel() {
  const [states, setStates] = useState<Record<string, string>>({});
  useEffect(() => {
    Promise.all([
      fetch("/api/civint/legislation/congress?path=bill&limit=1").then((r) => r.json()).catch(() => ({ state: "unavailable" })),
      fetch("/api/civint/oversight/foia?endpoint=annual_foia_report").then((r) => r.json()).catch(() => ({ state: "unavailable" })),
    ]).then(([congress, foia]) => setStates({ "Congress.gov": congress.state ?? "reachable", "FOIA.gov": foia.state ?? "reachable", "Federal Register": "available" }));
  }, []);
  return <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Expansion layer</p><h2 className="mt-1 font-display text-3xl">Public records, brought forward</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">CIVINT keeps the public source attributable while compiling the useful record into a calmer, searchable surface. Unconfigured feeds remain explicitly unconfigured.</p></div>
      <Badge variant="outline">{Object.values(states).filter((s) => ["reachable","available"].includes(s)).length}/3 available</Badge>
    </div>
    <div className="mt-5 grid gap-3 md:grid-cols-3">
      {SOURCES.map((source) => { const Icon=source.icon; const state=states[source.name] ?? source.state; return <article key={source.name} className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-start justify-between"><span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary"><Icon className="size-4"/></span><Badge variant={state === "available" || state === "reachable" ? "live" : "outline"}>{state}</Badge></div>
        <p className="mt-4 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{source.label}</p><h3 className="mt-1 text-sm font-semibold">{source.name}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{source.description}</p>
        <a className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline" href={source.href} target="_blank" rel="noreferrer">Source documentation <ArrowUpRight className="size-3"/></a>
      </article> })}
    </div>
  </section>;
}
