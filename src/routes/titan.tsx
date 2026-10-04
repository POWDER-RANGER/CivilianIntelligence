import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { getPillarStatus, getTitanTelemetry, type PillarStatus, type TitanEvidenceRecord, type TitanSample } from "@/lib/pillars";

export const Route = createFileRoute("/titan")({ component: TitanPage });

function statusVariant(status: PillarStatus["status"]) {
  if (status === "online") return "live" as const;
  if (status === "degraded") return "warn" as const;
  return "outline" as const;
}

function TitanPage() {
  const [health, setHealth] = useState<PillarStatus | null>(null);
  const [samples, setSamples] = useState<TitanSample[]>([]);
  const [evidence, setEvidence] = useState<TitanEvidenceRecord[]>([]);
  const [evidenceOk, setEvidenceOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getPillarStatus(), getTitanTelemetry()]).then(([statuses, data]) => {
      if (cancelled) return;
      setHealth(statuses.find((item) => item.id === "cell-titan") ?? null);
      setSamples(data.samples);
      setEvidence(data.evidence);
      setEvidenceOk(data.evidenceOk);
      setError(data.ok ? null : "Cell Titan is unavailable, unauthorized, or not configured.");
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
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Pillar 02</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">Cell Titan</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Defensive RF observability with local-first telemetry and a verifiable evidence chain.
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

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">API</p>
            <p className="mt-2 font-display text-2xl">{health?.service ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Version</p>
            <p className="mt-2 font-display text-2xl">{health?.version ? "v" + health.version : "—"}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Samples</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{samples.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Evidence</p>
            <p className="mt-2 font-display text-2xl">{evidenceOk == null ? "—" : evidenceOk ? "intact" : "broken"}</p>
          </div>
        </div>

        <section className="mt-8 rounded-xl border border-border bg-card">
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-display text-2xl">Recent telemetry</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Retrieved server-side with the configured Titan bearer token when remote access is enabled.
            </p>
          </header>
          <div className="divide-y divide-border">
            {samples.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">No telemetry available.</p>
            ) : (
              samples.slice(0, 25).map((sample, index) => (
                <div key={sample.ts + sample.domain + index} className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{sample.domain}</p>
                      {sample.metrics.demo === true && <Badge variant="warn">demo</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{sample.ts} · {sample.sensor_id}</p>
                  </div>
                  <pre className="max-w-full overflow-x-auto text-right font-mono text-[10px] text-muted-foreground">
                    {JSON.stringify(sample.metrics)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card">
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-display text-2xl">Evidence tail</h2>
            <p className="mt-1 text-xs text-muted-foreground">Chain records are displayed with their hashes for operator verification.</p>
          </header>
          <div className="divide-y divide-border">
            {evidence.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">No evidence records available.</p>
            ) : (
              evidence.slice(0, 20).map((record, index) => (
                <div key={String(record.seq) + String(record.hash) + index} className="grid gap-1 px-5 py-3 md:grid-cols-[120px_1fr]">
                  <p className="font-mono text-xs">#{record.seq} {record.kind}</p>
                  <p className="break-all font-mono text-[10px] text-muted-foreground">{record.hash}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <p className="mt-6 text-xs text-muted-foreground">
          <a
            href="https://github.com/POWDER-RANGER/civwatch-cell-titan"
            target="_blank"
            rel="noreferrer"
            className="text-steel hover:underline"
          >
            Cell Titan repository
          </a>
          {" · "}
          Production remote access requires a secure transport boundary and a bearer token.
        </p>
      </div>
    </AppShell>
  );
}
