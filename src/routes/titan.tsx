import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  describeTitanProblem,
  getPillarStatus,
  getTitanTelemetry,
  type PillarStatus,
  type TitanEvidenceRecord,
  type TitanSample,
} from "@/lib/pillars";

export const Route = createFileRoute("/titan")({ component: TitanPage });

/** Render Free cold starts take up to ~60s; retry on a fixed cadence for ~90s. */
const WAKE_RETRY_DELAY_MS = 10_000;
const WAKE_MAX_ATTEMPTS = 8;

function statusVariant(status: PillarStatus["status"]) {
  if (status === "online") return "live" as const;
  if (status === "degraded" || status === "unreachable") return "warn" as const;
  return "outline" as const;
}

function TitanPage() {
  const [health, setHealth] = useState<PillarStatus | null>(null);
  const [samples, setSamples] = useState<TitanSample[]>([]);
  const [evidence, setEvidence] = useState<TitanEvidenceRecord[]>([]);
  const [evidenceOk, setEvidenceOk] = useState<boolean | null>(null);
  const [observationState, setObservationState] = useState<string | null>(null);
  const [limitations, setLimitations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [wakeAttempt, setWakeAttempt] = useState(0);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([getPillarStatus(), getTitanTelemetry()])
      .then(([statuses, data]) => {
        if (cancelled) return;
        const titanStatus = statuses.find((item) => item.id === "cell-titan") ?? null;
        setHealth(titanStatus);
        setSamples(data.samples);
        setEvidence(data.evidence);
        setEvidenceOk(data.evidenceOk);
        setObservationState(data.state);
        setLimitations(data.limitations);
        const problem = describeTitanProblem(titanStatus, data);
        const keepWaking = Boolean(problem?.retryable) && wakeAttempt + 1 < WAKE_MAX_ATTEMPTS;
        setWaking(keepWaking);
        setError(
          problem
            ? keepWaking
              ? problem.message + " (attempt " + (wakeAttempt + 1) + " of " + WAKE_MAX_ATTEMPTS + ")"
              : problem.retryable
                ? "Cell Titan did not respond after " + WAKE_MAX_ATTEMPTS + " attempts. Use Refresh to try again."
                : problem.message
            : null,
        );
        setLastChecked(new Date().toISOString());
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshKey, wakeAttempt]);

  useEffect(() => {
    if (!waking || loading) return;
    const timer = setTimeout(() => setWakeAttempt((value) => value + 1), WAKE_RETRY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [waking, loading]);

  const domainCounts = samples.reduce<Record<string, number>>((counts, sample) => {
    counts[sample.domain] = (counts[sample.domain] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Pillar 02</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">Cell Titan</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Defensive RF observability for understanding your device footprint, the radio environment it can observe,
              and the evidence those observations produce.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={waking ? "warn" : statusVariant(health?.status ?? "unconfigured")}>
              {waking ? "waking" : (health?.status ?? "unconfigured")}
            </Badge>
            <button
              type="button"
              onClick={() => {
                setWaking(false);
                setWakeAttempt(0);
                setRefreshKey((value) => value + 1);
              }}
              disabled={loading}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:cursor-wait disabled:opacity-50"
            >
              {loading ? "Checking…" : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground" role="status">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant={observationState === "live" ? "live" : observationState === "snapshot" ? "warn" : "outline"}>
            observations: {observationState ?? "unknown"}
          </Badge>
          <Badge variant="outline">owner: user device</Badge>
          {evidenceOk === true && <Badge variant="live">evidence verified</Badge>}
          {evidenceOk === false && <Badge variant="danger">evidence verification failed</Badge>}
          {lastChecked && <Badge variant="outline">checked {new Date(lastChecked).toLocaleTimeString()}</Badge>}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">API service</p>
            <p className="mt-2 font-display text-2xl">{health?.service ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Version</p>
            <p className="mt-2 font-display text-2xl">{health?.version ? "v" + health.version : "—"}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Observations</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{samples.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Evidence records</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{evidence.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {evidenceOk == null ? "Verification unavailable" : evidenceOk ? "Chain verification passed" : "Chain verification failed"}
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Learn your footprint</p>
              <h2 className="mt-1 font-display text-2xl">What your device can tell you</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Cell Titan turns supported device observations into an understandable record. Actual coverage depends on
                your phone model, Android version, permissions, nearby networks, and whether external sensor hardware is attached.
              </p>
            </div>
            <Badge variant="outline">Capability-aware</Badge>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <article className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold">Connectivity around you</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Review Wi-Fi, Bluetooth, and cellular metadata that the device and operating system actually expose.
                Discovery results are not a complete record of every nearby transmission.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Domains observed in this response: {Object.keys(domainCounts).length ? Object.keys(domainCounts).join(", ") : "none returned"}
              </p>
            </article>
            <article className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold">Your device's own footprint</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Learn what can be inferred from supported connection state and system metadata. This page does not claim
                to capture every outbound transmission or expose raw cellular baseband traffic.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                A connected network is evidence of connectivity, not proof of every packet or radio emission.
              </p>
            </article>
            <article className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold">Evidence and provenance</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Each available record should retain its timestamp, sensor identity, domain, collection state, and evidence
                linkage. A passing chain check validates integrity, not the truth of every interpretation.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Current verification: {evidenceOk == null ? "not available" : evidenceOk ? "passed" : "failed"}
              </p>
            </article>
            <article className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold">Blind spots are part of the result</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Missing permissions, unsupported APIs, unavailable sensors, or demo mode must be visible—not silently
                treated as a clean environment or a confirmed detection.
              </p>
              {limitations.length > 0 ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  {limitations.slice(0, 8).map((item, index) => <li key={item + index}>{item}</li>)}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">No limitations were returned by the service.</p>
              )}
            </article>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Privacy default: observe only devices and data you own or are authorized to assess. Avoid collecting payloads,
            stable identifiers, or precise location unless necessary, explicitly enabled, and clearly disclosed to the owner.
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Local collector</p>
              <h2 className="mt-1 font-display text-2xl">Connect your own Android</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                This public service cannot access a phone plugged into your computer. Run the local collector, approve
                Android USB debugging, and Titan will discover and capture only the device your computer exposes through ADB.
              </p>
            </div>
            <Badge variant="outline">USB + ADB</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="https://raw.githubusercontent.com/POWDER-RANGER/civwatch-cell-titan/main/START-TITAN.bat"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              Windows one-click launcher
            </a>
            <a
              href="https://github.com/POWDER-RANGER/civwatch-cell-titan"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              macOS / Linux / source
            </a>
            <a
              href="http://127.0.0.1:8000"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Open local Titan
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Android requires Developer options and USB debugging; the first connection requires accepting the device
            authorization prompt. The local launcher creates a session and keeps the long-lived bearer token out of browser JavaScript.
          </p>
        </section>

        <section className="mt-8 rounded-xl border border-border bg-card">
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-display text-2xl">Recent telemetry</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              These are user-device observations. They describe available radio/sensor measurements and evidence; they do not,
              by themselves, identify a specific interceptor or prove unlawful collection.
            </p>
          </header>
          <div className="divide-y divide-border">
            {samples.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">
                {loading ? "Loading observations…" : "No telemetry available for this response state."}
              </p>
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
                    {JSON.stringify(sample.metrics, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card">
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-display text-2xl">Evidence tail</h2>
            <p className="mt-1 text-xs text-muted-foreground">Chain records are displayed with their hashes for integrity inspection.</p>
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
