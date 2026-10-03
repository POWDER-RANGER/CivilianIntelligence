import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VEIL_METRICS, VEIL_SIGNALS, MOVEMENT_EVENTS, OVERSIGHT_ITEMS, PRIVACY_SYSTEMS } from "@/data/desks";
import { getRegisterFeed, type RegisterDoc } from "@/lib/feeds";
import {
  getCivintAlerts,
  getCivintAwards,
  formatUsd,
  type CivintAlert,
  type CivintAward,
} from "@/lib/civint-feeds";
import { FRAMEWORK } from "@/data/catalog";
import { countLeaves } from "@/lib/intel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/veil")({ component: VeilPage });

function pillarVariant(p: (typeof VEIL_SIGNALS)[number]["pillar"]) {
  if (p === "privacy") return "danger" as const;
  if (p === "oversight") return "warn" as const;
  return "live" as const;
}

function severityVariant(s: string) {
  const lower = s.toLowerCase();
  if (lower === "extreme" || lower === "severe") return "danger" as const;
  if (lower === "moderate") return "warn" as const;
  return "outline" as const;
}

function VeilPage() {
  const [register, setRegister] = useState<RegisterDoc[]>([]);
  const [live, setLive] = useState(false);
  const [nwsAlerts, setNwsAlerts] = useState<CivintAlert[]>([]);
  const [awards, setAwards] = useState<CivintAward[]>([]);
  const [civintLive, setCivintLive] = useState(false);

  const sources = countLeaves(FRAMEWORK);
  const liveMovement = MOVEMENT_EVENTS.filter((e) => e.status === "live").length;
  const alerts = OVERSIGHT_ITEMS.filter((i) => i.severity === "alert").length;
  const expanding = PRIVACY_SYSTEMS.filter((s) => s.risk === "expanding").length;

  useEffect(() => {
    let cancelled = false;
    void getRegisterFeed().then((res) => {
      if (cancelled) return;
      setRegister(res.results.slice(0, 5));
      setLive(res.ok);
    });
    void Promise.all([getCivintAlerts(), getCivintAwards()]).then(([a, w]) => {
      if (cancelled) return;
      setNwsAlerts(a.slice(0, 6));
      setAwards(w.slice(0, 5));
      setCivintLive(a.length > 0 || w.length > 0);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              VEIL protocol
            </p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">Executive brief</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Visibility across movement, oversight, and privacy invasion. A civilian situation room built only
              from public record.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={live ? "live" : "outline"}>{live ? "Register live" : "Register standby"}</Badge>
            <Badge variant={civintLive ? "live" : "outline"}>
              {civintLive ? "CIVINT live" : "CIVINT standby"}
            </Badge>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Indexed sources", value: String(sources) },
            { label: "Live movement", value: String(liveMovement) },
            { label: "Oversight alerts", value: String(alerts) },
            { label: "Expanding systems", value: String(expanding) },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-border bg-card px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="mt-2 font-display text-4xl tabular-nums">{m.value}</p>
            </div>
          ))}
        </div>

        {(nwsAlerts.length > 0 || awards.length > 0) && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {nwsAlerts.length > 0 && (
              <section className="rounded-xl border border-border bg-card">
                <header className="border-b border-border px-5 py-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl">NWS active alerts</h2>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">IA · IL · MO — from civint_ingest</p>
                  </div>
                  <Badge variant="live">{nwsAlerts.length}</Badge>
                </header>
                <ul className="max-h-64 overflow-y-auto">
                  {nwsAlerts.map((a) => (
                    <li key={a.id} className="border-b border-border last:border-b-0 px-5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{a.event}</p>
                        <Badge variant={severityVariant(a.severity)}>{a.severity}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.headline}</p>
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">{a.area?.split(";")[0]}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {awards.length > 0 && (
              <section className="rounded-xl border border-border bg-card">
                <header className="border-b border-border px-5 py-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl">Surveillance awards</h2>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Flock Safety / ALPR — USAspending</p>
                  </div>
                  <Badge variant="warn">{awards.length}</Badge>
                </header>
                <ul className="max-h-64 overflow-y-auto">
                  {awards.map((w) => (
                    <li key={w.internal_id} className="border-b border-border last:border-b-0 px-5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{w.recipient}</p>
                        <Badge variant="steel">{formatUsd(w.amount)}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{w.agency}</p>
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                        {w.start_date} · {w.award_group} · {w.terms.join(", ")}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-xl border border-border bg-card">
            <header className="border-b border-border px-5 py-4">
              <h2 className="font-display text-2xl">Signal tape</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Composite public-record brief for 28–30 Sep 2026.
              </p>
            </header>
            <ul>
              {VEIL_SIGNALS.map((s) => (
                <li key={s.id} className="border-b border-border last:border-b-0">
                  <Link
                    to={s.href}
                    className="flex flex-col gap-2 px-5 py-4 hover:bg-muted md:flex-row md:items-start md:gap-4"
                  >
                    <div className="md:w-28">
                      <Badge variant={pillarVariant(s.pillar)}>{s.pillar}</Badge>
                      <p className="mt-2 font-mono text-[10px] text-muted-foreground">{s.tag}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{s.headline}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-2xl">Register — last published</h2>
              <ul className="mt-4 space-y-3">
                {register.map((doc) => (
                  <li key={doc.html_url}>
                    <a href={doc.html_url} target="_blank" rel="noreferrer" className="block text-sm hover:underline">
                      {doc.title}
                    </a>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {doc.publication_date} · {doc.agencies[0]?.name}
                    </p>
                  </li>
                ))}
                {register.length === 0 && (
                  <li className="text-sm text-muted-foreground">Waiting on the Federal Register feed.</li>
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-2xl">Three rails</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {VEIL_METRICS.map((m) => (
                  <li key={m.label} className="flex items-baseline justify-between gap-3">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-mono tabular-nums text-foreground">{m.value}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link to="/">Open framework</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/privacy">Privacy atlas</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/finance">Finance desk</Link>
                </Button>
              </div>
            </div>
          </section>
        </div>

        <p className={cn("mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground")}>
          CIVWATCH indexes publicly available government records, official portals, and investigative reporting. It
          does not access classified systems, non-public databases, or private accounts. Briefing cards are
          reconstructions from public calendars and reporting patterns, labeled as such. Live NWS and USAspending
          panels are produced by the keyless civint_ingest pipeline.
        </p>
      </div>
    </AppShell>
  );
}
