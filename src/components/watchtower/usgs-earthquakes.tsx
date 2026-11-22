import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Crosshair } from "lucide-react";
import type { UsgsSnapshot } from "@/lib/usgs-live";

type PanelState = "loading" | "ready" | "error";
type PanelProps = { onLocate: (latitude: number, longitude: number) => void };

function dateLabel(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) ? date.toLocaleString() : "Time unavailable";
}

export function UsgsEarthquakes({ onLocate }: PanelProps) {
  const [data, setData] = useState<UsgsSnapshot | null>(null);
  const [state, setState] = useState<PanelState>("loading");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    setState("loading");
    fetch("/api/civint/live/earthquakes", {
      headers: { Accept: "application/json" },
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value: unknown = await response.json();
        if (
          !value ||
          typeof value !== "object" ||
          !("state" in value) ||
          !("events" in value) ||
          !Array.isArray(value.events)
        )
          throw new Error("Unexpected source response");
        const typed = value as UsgsSnapshot;
        if (!["available", "stale", "unavailable"].includes(typed.state))
          throw new Error("Invalid source state");
        return typed;
      })
      .then((snapshot) => {
        if (controller.signal.aborted) return;
        setData(snapshot);
        setState("ready");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setData(null);
        setState("error");
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [retry]);

  const valid = data?.state === "available" || data?.state === "stale";
  const events = valid ? data.events.slice(0, 8) : [];
  return (
    <section
      aria-label="USGS earthquake observations"
      className="border-b border-border bg-card px-4 py-3 md:px-6"
    >
      <div className="mx-auto max-w-[1800px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">USGS · Significant earthquakes</h2>
            <p className="text-xs text-muted-foreground">
              Official past-day observations · Earthquake magnitude is not an emergency declaration
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            aria-label="Refresh earthquake observations"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted"
          >
            <RefreshCw className="size-4" /> Refresh
          </button>
        </div>
        <div role="status" aria-live="polite" className="mt-2 text-xs text-muted-foreground">
          {state === "loading"
            ? "Checking the official USGS source…"
            : state === "error" || data?.state === "unavailable"
              ? "Official earthquake feed currently unavailable. No records inferred."
              : data?.state === "stale"
                ? `Last known observations only (source unavailable). Last successful check: ${data.last_success_at ? dateLabel(data.last_success_at) : "unknown"}.`
                : `Source available · Last checked ${data ? dateLabel(data.checked_at) : "unknown"}`}
        </div>
        {valid && events.length === 0 && (
          <p className="mt-2 text-sm">
            {data?.state === "stale"
              ? "Last successful USGS snapshot contained no significant earthquakes."
              : "USGS reports no significant earthquakes in this past-day feed at the last check."}
          </p>
        )}
        {valid && events.length > 0 && (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((event) => (
              <li
                key={event.id}
                className="min-w-0 rounded-lg border border-border bg-background p-3"
              >
                <p className="text-sm font-semibold">
                  M {event.magnitude === null ? "unknown" : event.magnitude.toFixed(1)} ·{" "}
                  {event.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Observed {dateLabel(event.observed_at)} · {event.review_status} ·{" "}
                  {event.freshness}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  {event.geography.coordinates && (
                    <button
                      type="button"
                      className="inline-flex min-h-9 items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
                      onClick={() =>
                        onLocate(
                          event.geography.coordinates!.latitude,
                          event.geography.coordinates!.longitude,
                        )
                      }
                    >
                      <Crosshair className="size-3.5" /> Center globe
                    </button>
                  )}
                  {event.source_url && (
                    <a
                      href={event.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center gap-1 underline-offset-2 hover:underline"
                    >
                      USGS evidence <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">
          Center globe navigates to the observation coordinates; it does not claim to display a live
          sensor or earthquake marker. Publishing agency: USGS (federal). Event jurisdiction is not
          inferred from the publishing agency.
        </p>
      </div>
    </section>
  );
}
