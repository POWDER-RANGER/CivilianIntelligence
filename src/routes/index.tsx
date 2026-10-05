import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LocateFixed, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AlprAtlas } from "@/components/watchtower/alpr-atlas";
import { Badge } from "@/components/ui/badge";
import { readRecentRecords, type RecentRecord } from "@/lib/recent-records";

type LocationContext = {
  state: "available" | "unavailable";
  coordinates?: { latitude: number; longitude: number };
  geography?: { city: string | null; county: string | null; state: string | null };
  coverage?: { city: boolean; county: boolean; state: boolean; federal: boolean };
  records?: Record<string, Array<{ id: string; title: string; kind: string; agency: string | null }>>;
};

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationState, setLocationState] = useState<"idle" | "requesting" | "granted" | "denied" | "unavailable">("idle");
  const [context, setContext] = useState<LocationContext | null>(null);
  const [recent, setRecent] = useState<RecentRecord[]>([]);

  useEffect(() => setRecent(readRecentRecords()), []);

  async function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocationState("unavailable");
      return;
    }
    setLocationState("requesting");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { latitude: coords.latitude, longitude: coords.longitude };
        setLocation(next);
        setLocationState("granted");
        void fetch("/api/civint/location/context", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(next),
          cache: "no-store",
        })
          .then((response) => response.json() as Promise<LocationContext>)
          .then(setContext)
          .catch(() => setContext({ state: "unavailable" }));
      },
      () => setLocationState("denied"),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  }

  const geography = context?.geography;
  const levels = [
    { label: "City", value: geography?.city, key: "city" },
    { label: "County", value: geography?.county, key: "county" },
    { label: "State", value: geography?.state, key: "state" },
    { label: "Federal", value: "United States", key: "federal" },
  ];

  return (
    <AppShell flush>
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-[1600px] px-4 pb-4 pt-5 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">The Open Desk</p>
              <h1 className="mt-1 font-display text-3xl md:text-4xl">What is happening around you?</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Start with public infrastructure, then move outward through city, county, state, and federal records.
                CIVINT surfaces evidence; the original publisher remains the source of record.
              </p>
            </div>
            <button type="button" onClick={useMyLocation} disabled={locationState === "requesting"} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium shadow-sm hover:bg-muted disabled:opacity-60">
              <LocateFixed className="size-4" />
              {locationState === "requesting" ? "Locating…" : locationState === "granted" ? "Location enabled" : "Use my location"}
            </button>
          </div>
          {locationState === "denied" && (
            <p className="mt-3 text-xs text-muted-foreground">Location permission was not granted. You can still search and explore the map normally.</p>
          )}
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6">
        <AlprAtlas location={location} />
      </div>

      <section className="mx-auto w-full max-w-[1600px] px-4 pb-4 md:px-6" aria-label="Quick actions">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/toolkit" className="flex min-h-16 items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-sm hover:border-primary/40 hover:bg-muted">
            <span>Draft a public-records request</span><span aria-hidden="true">↗</span>
          </Link>
          <Link to="/finance" className="flex min-h-16 items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-sm hover:border-primary/40 hover:bg-muted">
            <span>Explore federal spending</span><span aria-hidden="true">↗</span>
          </Link>
          <Link to="/reading-room" className="flex min-h-16 items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-sm hover:border-primary/40 hover:bg-muted">
            <span>Browse declassified collections</span><span aria-hidden="true">↗</span>
          </Link>
          <Link to="/records" className="flex min-h-16 items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-sm hover:border-primary/40 hover:bg-muted">
            <span>Search the Record Index</span><span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1600px] gap-4 px-4 pb-8 md:grid-cols-[minmax(0,1fr)_360px] md:px-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Local lens</p>
              <h2 className="mt-1 font-display text-2xl">Public records in your civic context</h2>
            </div>
            {geography && <Badge variant="live">{[geography.city, geography.county, geography.state].filter(Boolean).join(" · ")}</Badge>}
          </div>
          {!context && (
            <p className="mt-4 text-sm text-muted-foreground">
              Allow location above to resolve your civic geography. CIVINT will use the coordinates only to find the relevant public-record context.
            </p>
          )}
          {context?.state === "unavailable" && <p className="mt-4 text-sm text-muted-foreground">Local context is temporarily unavailable. No inferred location or synthetic records are shown.</p>}
          {context?.state === "available" && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {levels.map((level) => {
                const records = context.records?.[level.key] ?? [];
                return (
                  <div key={level.key} className="rounded-xl border border-border bg-background p-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{level.label}</p>
                    <p className="mt-1 text-sm font-medium">{level.value ?? "Not resolved"}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {records.length ? `${records.length} indexed record${records.length === 1 ? "" : "s"}` : "No matching indexed records found"}
                    </p>
                    {records.slice(0, 3).map((record) => (
                      <Link key={record.id} to="/records/$id" params={{ id: record.id }} className="mt-2 block text-xs text-primary hover:underline">{record.title}</Link>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
            Location is permission-based. CIVINT does not fingerprint the device, sell location data, or treat proximity as evidence about a person.
          </p>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <h2 className="font-display text-2xl">Recent CIVINT activity</h2>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Records you open can appear here on your next visit. This memory stays in this browser.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recent.map((record) => (
                <Link key={record.id} to="/records/$id" params={{ id: record.id }} className="block rounded-lg border border-border p-3 hover:bg-muted">
                  <p className="text-sm font-medium">{record.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{record.sourceName} · {new Date(record.viewedAt).toLocaleString()}</p>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </section>
    </AppShell>
  );
}
