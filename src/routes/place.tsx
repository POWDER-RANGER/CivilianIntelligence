import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Camera, FileText, Landmark, Loader2, MapPin, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { DossierMap } from "@/components/place/dossier-map";
import { cn } from "@/lib/utils";

type PlaceSearch = { q?: string; radius?: number };

export const Route = createFileRoute("/place")({
  component: PlacePage,
  validateSearch: (search: Record<string, unknown>): PlaceSearch => {
    const q = typeof search.q === "string" && search.q.trim() ? search.q.trim().slice(0, 200) : undefined;
    const r = Number(search.radius);
    const radius = [1, 2, 5, 10].includes(r) ? r : undefined;
    return { q, radius };
  },
  head: () => ({
    meta: [
      { title: "Local Surveillance Dossier — CIVWATCH" },
      { name: "description", content: "Enter an address: see the license plate readers around it, who operates them, the federal money tied to surveillance tech there, and a ready-to-file records request." },
    ],
  }),
});

type Bucket = { name: string; count: number };
type Cam = {
  id: string; latitude: number; longitude: number; distanceMiles: number;
  operator: string | null; brand: string | null; direction: string | null; mountType: string | null;
  zone: string | null; osmUrl: string | null; lastEdited: string | null;
};
type Award = { id: string; kind: "contract" | "grant"; recipient: string; amount: number | null; agency: string | null; description: string | null; startDate: string | null; url: string };
type Section<T> = { state: "available"; data: T } | { state: "unavailable"; error: string };
type Dossier = {
  state: "available";
  generatedAt: string;
  place: {
    query: string; label: string; latitude: number; longitude: number; method: string;
    geography: {
      city: string | null; cityGeoid: string | null; county: string | null; countyGeoid: string | null;
      state: string | null; stateAbbr: string | null; stateGeoid: string | null;
      congressionalDistrict: string | null; stateSenateDistrict: string | null; stateHouseDistrict: string | null;
    };
    sources: Array<{ name: string; url: string }>;
  };
  cameras: Section<{
    radiusMiles: number; total: number; withinOneMile: number; operators: Bucket[]; brands: Bucket[];
    nearest: Cam[]; cameras: Cam[]; tilesRequested: number; tilesFailed: number;
    source: { name: string; url: string; attribution: string };
  }>;
  spending: Section<{
    state: "available" | "partial" | "unavailable"; contracts: Award[]; grants: Award[];
    totals: { contracts: number; grants: number }; note: string; source: { name: string; url: string };
    scope: { stateAbbr: string | null; countyFips: string | null };
  }>;
  request: { template: "state"; state: string | null; suggestedAgencies: string[] };
};
type Failure = { state: "invalid" | "not-found" | "unavailable"; message: string };

const EXAMPLES = ["10400 S Roberts Rd, Palos Hills, IL", "Austin, TX", "Carthage, IL", "Atlanta, GA"];
const RADII = [1, 2, 5, 10] as const;

const usd = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M` : n >= 1_000 ? `$${Math.round(n / 1_000)}K` : `$${Math.round(n)}`;

function PlacePage() {
  const { q, radius = 5 } = Route.useSearch();
  const navigate = useNavigate({ from: "/place" });
  const [draft, setDraft] = useState(q ?? "");
  const [result, setResult] = useState<Dossier | Failure | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => setDraft(q ?? ""), [q]);

  useEffect(() => {
    if (!q) {
      setResult(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/civint/place/dossier?q=${encodeURIComponent(q)}&radius=${radius}`, { signal: ctrl.signal })
      .then(async (res) => (await res.json()) as Dossier | Failure)
      .then(setResult)
      .catch((err) => {
        if (!ctrl.signal.aborted) setResult({ state: "unavailable", message: err instanceof Error ? err.message : "Request failed" });
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [q, radius]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const next = draft.trim();
    if (next.length >= 2) void navigate({ search: { q: next, radius } });
  }

  return (
    <AppShell>
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--color-border) 1px, transparent 0)",
            backgroundSize: "22px 22px",
            maskImage: "linear-gradient(to bottom, black, transparent 85%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-8 pt-10 md:pt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">Local surveillance dossier</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] md:text-6xl">
            Who is watching here, <span className="italic text-primary">and who paid for it.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            One address in. Out come the license plate readers around it, the agencies on record operating them, the federal
            money tied to surveillance tech in that county, and a records request ready to file. Every line links to its source.
          </p>

          <form onSubmit={submit} className="mt-7 flex max-w-3xl flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Address, city and state, ZIP, or coordinates</span>
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Street address, “City, ST”, ZIP, or lat,lon"
                autoComplete="street-address"
                className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-[15px] shadow-[var(--shadow-card)] outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
              />
            </label>
            <div className="flex gap-2">
              <select
                aria-label="Search radius"
                value={radius}
                onChange={(e) => q && void navigate({ search: { q, radius: Number(e.target.value) } })}
                className="h-12 rounded-xl border border-input bg-card px-3 text-sm shadow-[var(--shadow-card)]"
              >
                {RADII.map((r) => <option key={r} value={r}>{r} mi</option>)}
              </select>
              <button
                type="submit"
                disabled={draft.trim().length < 2 || loading}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-card)] transition hover:brightness-110 disabled:opacity-50 sm:flex-none"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Build dossier
              </button>
            </div>
          </form>
          {!q && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Try</span>
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => void navigate({ search: { q: ex, radius } })} className="rounded-full border border-border bg-card px-3 py-1 hover:border-primary/40 hover:text-foreground">
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {loading && <DossierSkeleton />}
        {!loading && result && result.state !== "available" && (
          <div className="rounded-2xl border border-warn/40 bg-warn/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-warn">{result.state === "not-found" ? "No match" : "Unavailable"}</p>
            <p className="mt-2 text-sm">{result.message}</p>
          </div>
        )}
        {!loading && result?.state === "available" && <DossierView d={result} />}
        {!q && !loading && <HowItWorks />}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "danger" | "primary" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-display text-4xl leading-none tabular-nums", tone === "danger" && "text-danger", tone === "primary" && "text-primary")}>{value}</p>
      {hint && <p className="mt-2 text-xs leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Bars({ items, total }: { items: Bucket[]; total: number }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">None in range.</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((b) => {
        const pct = total ? Math.max(2, Math.round((b.count / total) * 100)) : 0;
        const unknown = b.name.endsWith("not recorded");
        return (
          <li key={b.name}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className={cn("truncate", unknown && "italic text-muted-foreground")}>{b.name}</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{b.count}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", unknown ? "bg-steel/50" : "bg-danger/80")} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SectionHead({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">{kicker}</p>
        <h2 className="mt-1 font-display text-2xl md:text-3xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function DossierView({ d }: { d: Dossier }) {
  const g = d.place.geography;
  const cams = d.cameras.state === "available" ? d.cameras.data : null;
  const money = d.spending.state === "available" ? d.spending.data : null;
  const awards = useMemo(() => (money ? [...money.grants, ...money.contracts] : []), [money]);
  const fedTotal = money ? money.totals.grants + money.totals.contracts : 0;
  const knownOps = cams ? cams.operators.filter((o) => !o.name.endsWith("not recorded")) : [];
  const title = g.city ?? d.place.label.split(",")[0];
  const jurisdiction = [
    g.county,
    g.state,
    g.congressionalDistrict?.replace("Congressional District", "CD"),
    g.stateSenateDistrict?.replace(/State Senate District/i, "State Senate"),
    g.stateHouseDistrict?.replace(/State House District/i, "State House"),
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-10">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="live">Dossier</Badge>
          <span className="font-mono text-xs text-muted-foreground">{d.place.latitude.toFixed(4)}, {d.place.longitude.toFixed(4)}</span>
        </div>
        <h2 className="mt-3 font-display text-4xl md:text-5xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{d.place.label}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {jurisdiction.map((j) => (
            <span key={j} className="rounded-full border border-border bg-card px-2.5 py-1 text-xs">{j}</span>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={`Readers within ${cams?.radiusMiles ?? "—"} mi`} value={cams ? String(cams.total) : "—"} tone="danger" hint={cams ? "Mapped ALPR cameras (OpenStreetMap / DeFlock)" : "Camera data unavailable"} />
        <Stat label="Within 1 mile" value={cams ? String(cams.withinOneMile) : "—"} hint="Walking distance" />
        <Stat label="Operators on record" value={cams ? String(knownOps.length) : "—"} hint={cams && cams.total ? `${cams.operators.find((o) => o.name.endsWith("not recorded"))?.count ?? 0} cameras have no operator tag` : undefined} />
        <Stat label="Federal $ matched" value={money ? usd(fedTotal) : "—"} tone="primary" hint={money ? `${awards.length} award${awards.length === 1 ? "" : "s"} · keyword matches to verify` : "USAspending unavailable"} />
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[440px]">
          {cams ? (
            <DossierMap latitude={d.place.latitude} longitude={d.place.longitude} radiusMiles={cams.radiusMiles} cameras={cams.cameras} label={d.place.label} />
          ) : (
            <div className="grid h-full place-items-center rounded-2xl border border-border bg-muted p-6 text-center text-sm text-muted-foreground">
              Camera tiles are unavailable right now ({d.cameras.state === "unavailable" ? d.cameras.error : ""}). Nothing is estimated.
            </div>
          )}
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">Who operates them</p>
            <div className="mt-4">{cams ? <Bars items={cams.operators} total={cams.total} /> : <p className="text-sm text-muted-foreground">—</p>}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">Hardware brand</p>
            <div className="mt-4">{cams ? <Bars items={cams.brands} total={cams.total} /> : <p className="text-sm text-muted-foreground">—</p>}</div>
          </div>
        </aside>
      </section>

      {cams && cams.nearest.length > 0 && (
        <section>
          <SectionHead kicker="Nearest" title="Closest mapped readers" />
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                <tr><th className="px-4 py-2.5">Distance</th><th className="px-4 py-2.5">Operator</th><th className="px-4 py-2.5">Brand</th><th className="hidden px-4 py-2.5 sm:table-cell">Facing</th><th className="hidden px-4 py-2.5 md:table-cell">Mount</th><th className="px-4 py-2.5">Record</th></tr>
              </thead>
              <tbody>
                {cams.nearest.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono tabular-nums">{c.distanceMiles.toFixed(2)} mi</td>
                    <td className={cn("px-4 py-2.5", !c.operator && "italic text-muted-foreground")}>{c.operator ?? "Not recorded"}</td>
                    <td className="px-4 py-2.5">{c.brand ?? "—"}</td>
                    <td className="hidden px-4 py-2.5 sm:table-cell">{c.direction ? (/^\d+(\.\d+)?$/.test(c.direction) ? `${Math.round(Number(c.direction))}°` : c.direction) : "—"}</td>
                    <td className="hidden px-4 py-2.5 text-muted-foreground md:table-cell">{c.mountType?.replace(/_/g, " ") ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      {c.osmUrl ? (
                        <a href={c.osmUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">OSM <ArrowUpRight className="size-3" /></a>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <SectionHead kicker="Money" title="Federal awards tied to surveillance tech">
          {money && <Badge variant={money.state === "available" ? "outline" : "warn"}>{money.state}</Badge>}
        </SectionHead>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {money?.note ?? "USAspending did not respond."} Grants are matched to {g.county ?? "the county"}; contracts to {g.state ?? "the state"}.
        </p>
        {money && awards.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {awards.map((a) => (
              <a key={`${a.kind}-${a.id}`} href={a.url} target="_blank" rel="noopener noreferrer" className="group flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge variant={a.kind === "grant" ? "steel" : "default"}>{a.kind}</Badge>
                    <p className="mt-2 truncate text-sm font-medium group-hover:underline">{a.recipient}</p>
                    <p className="text-xs text-muted-foreground">{a.agency ?? "Agency not listed"}{a.startDate ? ` · ${a.startDate.slice(0, 4)}` : ""}</p>
                  </div>
                  <p className="shrink-0 font-display text-2xl tabular-nums">{a.amount != null ? usd(a.amount) : "—"}</p>
                </div>
                {a.description && <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{a.description.charAt(0) + a.description.slice(1).toLowerCase()}</p>}
                <p className="mt-auto break-all pt-3 font-mono text-xs text-muted-foreground">{a.id}</p>
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            No federal awards matched. That is common: local license-plate-reader contracts are usually paid from city or county budgets, which is what the records request below is for.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-primary/25 bg-accent/40 p-6 md:p-8">
        <SectionHead kicker="Act" title="Get the contract, the policy, and the audit logs" />
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Opens the Toolkit with your state's public-records law, the agency, and an ALPR request already written. Add your name and send it.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {d.request.suggestedAgencies.map((agency) => (
            <Link
              key={agency}
              to="/toolkit"
              search={{ template: "state", state: d.request.state ?? undefined, agency, preset: 0 }}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-medium shadow-[var(--shadow-card)] transition hover:border-primary/40"
            >
              <span className="flex items-center gap-2.5"><FileText className="size-4 text-primary" />{agency}</span>
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
          <a href="https://www.usa.gov/elected-officials" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-medium shadow-[var(--shadow-card)] transition hover:border-primary/40">
            <span className="flex items-center gap-2.5"><Landmark className="size-4 text-primary" />Contact your officials</span>
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </a>
        </div>
      </section>

      <footer className="border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
        <p className="uppercase tracking-[0.06em]">Method & sources</p>
        <p className="mt-2 max-w-4xl">
          Location: {d.place.sources.map((s) => s.name).join(" → ")} ({d.place.method}). Cameras: {cams?.source.name ?? "DeFlock tiles"}, read at zoom 12 around the point
          {cams ? ` (${cams.tilesRequested} tiles${cams.tilesFailed ? `, ${cams.tilesFailed} failed` : ""})` : ""}; attribution {cams?.source.attribution ?? "OpenStreetMap contributors"}. A mapped camera is a community report,
          not proof the device is operating or who it records. Money: USAspending keyword search. Generated {new Date(d.generatedAt).toLocaleString()}.
        </p>
      </footer>
    </div>
  );
}

function DossierSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Building dossier">
      <div className="h-10 w-1/2 rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-muted" />)}</div>
      <div className="h-[440px] rounded-2xl bg-muted" />
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: MapPin, title: "Resolve the place", text: "Census Bureau geocoder: city, county, state, congressional and legislative districts." },
    { icon: Camera, title: "Count the readers", text: "Every mapped license plate reader in range, with the operator and brand recorded in OpenStreetMap." },
    { icon: Landmark, title: "Follow federal money", text: "USAspending grants and contracts that mention surveillance vendors or technology." },
    { icon: FileText, title: "File the request", text: "A state public-records request for the contract, use policy, sharing list, and audit logs." },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <div key={s.title} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <s.icon className="size-5 text-primary" />
            <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
          </div>
          <p className="mt-4 font-medium">{s.title}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.text}</p>
        </div>
      ))}
    </div>
  );
}
