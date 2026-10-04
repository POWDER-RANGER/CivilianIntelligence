import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { getPillarStatus, getWatchtowerFeatures, type PillarStatus, type WatchtowerFeature } from "@/lib/pillars";

export const Route = createFileRoute("/watchtower")({ component: WatchtowerPage });

function statusVariant(status: PillarStatus["status"]) {
  if (status === "online") return "live" as const;
  if (status === "degraded") return "warn" as const;
  return "outline" as const;
}

function WatchtowerPage() {
  const [health, setHealth] = useState<PillarStatus | null>(null);
  const [features, setFeatures] = useState<WatchtowerFeature[]>([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getPillarStatus(), getWatchtowerFeatures()]).then(([statuses, data]) => {
      if (cancelled) return;
      setHealth(statuses.find((item) => item.id === "watchtower") ?? null);
      setFeatures(data.features);
      setCount(data.count);
      setError(data.ok ? null : "Watchtower is unavailable or not configured.");
    }).catch((e) => {
      if (!cancelled) setError(String(e));
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Pillar 01</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">Watchtower</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Map-first civic oversight, reports, and geospatial signals connected to the unified CIVINTELLIGENCE hub.
            </p>
          </div>
          <Badge variant={statusVariant(health?.status ?? "unconfigured")}>
            {health?.status ?? "unconfigured"}
          </Badge>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">API</p>
            <p className="mt-2 font-display text-3xl">{health?.service ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Version</p>
            <p className="mt-2 font-display text-3xl">{health?.version ? "v" + health.version : "—"}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Features</p>
            <p className="mt-2 font-display text-3xl tabular-nums">{count}</p>
          </div>
        </div>

        <section className="mt-8 rounded-xl border border-border bg-card">
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-display text-2xl">Map feature rail</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Server-side fetch from Watchtower; demo records remain visibly labeled.
            </p>
          </header>
          <div className="divide-y divide-border">
            {features.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">No features available.</p>
            ) : (
              features.slice(0, 25).map((feature) => (
                <div key={feature.id} className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{String(feature.properties.label ?? feature.id)}</p>
                      <Badge variant="outline">{feature.category}</Badge>
                      {feature.properties.note && (
                        <Badge variant="warn">{String(feature.properties.note)}</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {feature.latitude.toFixed(5)}, {feature.longitude.toFixed(5)} · {feature.sourceId ?? "unknown source"}
                    </p>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    confidence {feature.confidence == null ? "—" : feature.confidence.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <p className="mt-6 text-xs text-muted-foreground">
          <a
            href="https://github.com/POWDER-RANGER/civwatch-watchtower"
            target="_blank"
            rel="noreferrer"
            className="text-steel hover:underline"
          >
            Watchtower repository
          </a>
          {" · "}
          The hub never exposes the Watchtower service URL to the browser.
        </p>
      </div>
    </AppShell>
  );
}
