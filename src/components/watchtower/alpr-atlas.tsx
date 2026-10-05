import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPin, Search, ZoomIn, ZoomOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Camera = {
  id: string;
  latitude: number;
  longitude: number;
  type: string | null;
  mounted_on: string | null;
  reported_at: string | null;
  verified: boolean;
};

type Feed = {
  state: "live" | "unavailable";
  generated_at: string | null;
  source: { name: string; method: string };
  count: number;
  features: Camera[];
};

type Location = { latitude: number; longitude: number };

function project(camera: Camera, width: number, height: number, bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number }) {
  const x = ((camera.longitude - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * width;
  const y = height - ((camera.latitude - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
  return { x, y };
}

export function AlprAtlas({ location }: { location?: Location | null }) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [selected, setSelected] = useState<Camera | null>(null);
  const [query, setQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/civint/alpr/data", { headers: { Accept: "application/json" } })
      .then((r) => r.json() as Promise<Feed>)
      .then((data) => { if (!cancelled) setFeed(data); })
      .catch(() => { if (!cancelled) setFeed({ state: "unavailable", generated_at: null, source: { name: "CIVINT upstream", method: "unavailable" }, count: 0, features: [] }); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (feed?.features ?? []).filter((c) => {
      if (verifiedOnly && !c.verified) return false;
      if (!q) return true;
      return [c.type, c.mounted_on, c.id, `${c.latitude},${c.longitude}`].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [feed, query, verifiedOnly]);

  const bounds = { minLon: -125, maxLon: -66, minLat: 24, maxLat: 50 };
  const W = 1000;
  const H = 500;

  useEffect(() => {
    if (!location) return;
    const p = project({ id: "location", latitude: location.latitude, longitude: location.longitude, type: null, mounted_on: null, reported_at: null, verified: false }, W, H, bounds);
    const targetZoom = 3;
    setZoom(targetZoom);
    setOffset({ x: 2 * (W / 2 - targetZoom * p.x), y: 2 * (H / 2 - targetZoom * p.y) });
  }, [location]);

  const locateCamera = location ? project({ id: "location", latitude: location.latitude, longitude: location.longitude, type: null, mounted_on: null, reported_at: null, verified: false }, W, H, bounds) : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Live public infrastructure layer</p>
              <Badge variant={feed?.state === "live" ? "live" : "outline"}>{feed?.state ?? "loading"}</Badge>
            </div>
            <h2 className="mt-1 font-display text-3xl md:text-4xl">Flock camera map</h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              Publicly reported ALPR infrastructure is shown as sourced observations. A point does not establish current operation, ownership, or vehicle activity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setZoom((z) => Math.min(8, z + 0.5))} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border hover:bg-muted" aria-label="Zoom in"><ZoomIn className="size-4" /></button>
            <button type="button" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border hover:bg-muted" aria-label="Zoom out"><ZoomOut className="size-4" /></button>
            <button type="button" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} className="inline-flex min-h-10 px-3 items-center justify-center rounded-lg border border-border text-xs font-medium hover:bg-muted">Reset</button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input aria-label="Search Flock camera reports" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search camera type, mount, ID, or coordinates" className="min-h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <button type="button" onClick={() => setVerifiedOnly((v) => !v)} className="min-h-11 rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted">{verifiedOnly ? "Verified only" : "All reports"}</button>
          {location && <button type="button" onClick={() => {
            const p = project({ id: "location", latitude: location.latitude, longitude: location.longitude, type: null, mounted_on: null, reported_at: null, verified: false }, W, H, bounds);
            const z = 3;
            setZoom(z);
            setOffset({ x: 2 * (W / 2 - z * p.x), y: 2 * (H / 2 - z * p.y) });
          }} className="min-h-11 rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted"><LocateFixed className="mr-1 inline size-3.5" />Center on me</button>}
        </div>
      </header>

      <div className="relative select-none overflow-hidden bg-[radial-gradient(circle_at_50%_45%,hsl(var(--muted))_0,transparent_52%)]" onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={(e) => { if (!drag.current) return; setOffset({ x: drag.current.ox + e.clientX - drag.current.x, y: drag.current.oy + e.clientY - drag.current.y }); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="block min-h-[430px] w-full md:min-h-[600px]" role="img" aria-label="Flock ALPR camera infrastructure map">
          <g transform={`translate(${offset.x / 2} ${offset.y / 2}) scale(${zoom})`}>
            <rect x="0" y="0" width={W} height={H} fill="transparent" />
            {[0, 1, 2, 3, 4, 5].map((i) => <line key={`lon-${i}`} x1={(W / 6) * i} y1="0" x2={(W / 6) * i} y2={H} stroke="currentColor" strokeOpacity="0.08" />)}
            {[0, 1, 2, 3, 4].map((i) => <line key={`lat-${i}`} x1="0" y1={(H / 5) * i} x2={W} y2={(H / 5) * i} stroke="currentColor" strokeOpacity="0.08" />)}
            <path d="M90 110 C190 65 270 92 350 82 S510 70 610 92 S750 72 900 110 L930 180 L900 235 L820 260 L760 330 L650 365 L545 420 L430 390 L320 420 L220 360 L150 290 L100 220 Z" fill="currentColor" fillOpacity="0.025" stroke="currentColor" strokeOpacity="0.16" strokeWidth="2" />
            {filtered.map((camera) => {
              const p = project(camera, W, H, bounds);
              return <g key={camera.id} transform={`translate(${p.x} ${p.y})`} onClick={(e) => { e.stopPropagation(); setSelected(camera); }} className="cursor-pointer"><circle r={camera.verified ? 5 : 3.5} fill="currentColor" fillOpacity={camera.verified ? 0.78 : 0.42} /><title>{camera.type ?? "ALPR camera"} · {camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}</title>{camera.verified && <circle r="10" fill="none" stroke="currentColor" strokeOpacity="0.18"><animate attributeName="r" from="7" to="13" dur="2.2s" repeatCount="indefinite" /></circle>}</g>;
            })}
            {locateCamera && <g transform={`translate(${locateCamera.x} ${locateCamera.y})`} aria-label="Your approximate device location"><circle r="8" fill="currentColor" fillOpacity="0.15" /><circle r="3.5" fill="currentColor" /><circle r="13" fill="none" stroke="currentColor" strokeOpacity="0.35"><animate attributeName="r" from="8" to="16" dur="1.8s" repeatCount="indefinite" /></circle></g>}
          </g>
        </svg>

        <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-border bg-background/90 px-3 py-2 backdrop-blur">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Mapped reports</p>
          <p className="mt-1 font-display text-3xl tabular-nums">{filtered.length.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{location ? "Centered on permitted device location" : "United States view"}</p>
        </div>

        {selected && <aside className="absolute bottom-4 right-4 w-[min(380px,calc(100%-2rem))] rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Camera record</p><h3 className="mt-1 font-display text-xl">{selected.type ?? "ALPR camera"}</h3></div>
            <button type="button" aria-label="Close camera dossier" onClick={() => setSelected(null)} className="min-h-11 min-w-11 rounded-lg border border-border text-lg hover:bg-muted">×</button>
          </div>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Coordinates</dt><dd className="font-mono">{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Mount</dt><dd>{selected.mounted_on ?? "Not reported"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Verification</dt><dd>{selected.verified ? "Community verified" : "Unverified report"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Reported</dt><dd>{selected.reported_at ?? "Not reported"}</dd></div>
          </dl>
          <p className="mt-3 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
            Provenance stays visible: CIVINT fetched this public record server-side. No private plate-search data is exposed here.
          </p>
        </aside>}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-[10px] text-muted-foreground">
        <span>{feed?.count?.toLocaleString() ?? "—"} total reports · server-proxied public source · cached at CIVINT edge</span>
        <span>{feed?.generated_at ? `updated ${new Date(feed.generated_at).toLocaleString()}` : "awaiting feed"}</span>
      </footer>
    </section>
  );
}
