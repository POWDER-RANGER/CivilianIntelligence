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
type Cluster = { x: number; y: number; cameras: Camera[] };

const BOUNDS = { minLon: -125, maxLon: -66, minLat: 24, maxLat: 50 };
const W = 1000;
const H = 500;

function project(camera: Camera, width = W, height = H, bounds = BOUNDS) {
  const x = ((camera.longitude - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * width;
  const y = height - ((camera.latitude - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
  return { x, y };
}

function clusterCameras(cameras: Camera[], zoom: number): Cluster[] {
  const cell = zoom < 2 ? 34 : zoom < 3 ? 26 : zoom < 4 ? 18 : zoom < 5 ? 12 : 7;
  const buckets = new Map<string, Cluster>();

  for (const camera of cameras) {
    const p = project(camera);
    const key = `${Math.floor(p.x / cell)}:${Math.floor(p.y / cell)}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.cameras.push(camera);
    } else {
      buckets.set(key, { x: p.x, y: p.y, cameras: [camera] });
    }
  }

  for (const cluster of buckets.values()) {
    if (cluster.cameras.length > 1) {
      const total = cluster.cameras.length;
      cluster.x = cluster.cameras.reduce((sum, camera) => sum + project(camera).x, 0) / total;
      cluster.y = cluster.cameras.reduce((sum, camera) => sum + project(camera).y, 0) / total;
    }
  }

  return [...buckets.values()];
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
    const controller = new AbortController();
    fetch("/api/civint/alpr/data", {
      headers: { Accept: "application/json" },
      cache: "force-cache",
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error("Feed unavailable");
        return r.json() as Promise<Feed>;
      })
      .then(setFeed)
      .catch((error) => {
        if (error?.name !== "AbortError") {
          setFeed({
            state: "unavailable",
            generated_at: null,
            source: { name: "CIVINT upstream", method: "unavailable" },
            count: 0,
            features: [],
          });
        }
      });
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (feed?.features ?? []).filter((camera) => {
      if (verifiedOnly && !camera.verified) return false;
      if (!q) return true;
      return [camera.type, camera.mounted_on, camera.id, `${camera.latitude},${camera.longitude}`]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [feed, query, verifiedOnly]);

  const clusters = useMemo(() => clusterCameras(filtered, zoom), [filtered, zoom]);
  const verifiedCount = useMemo(() => filtered.filter((camera) => camera.verified).length, [filtered]);

  const centerOn = (target: Location, targetZoom = 4) => {
    const p = project({
      id: "location",
      latitude: target.latitude,
      longitude: target.longitude,
      type: null,
      mounted_on: null,
      reported_at: null,
      verified: false,
    });
    setZoom(targetZoom);
    setOffset({
      x: W / 2 - targetZoom * p.x,
      y: H / 2 - targetZoom * p.y,
    });
  };

  useEffect(() => {
    if (location) centerOn(location, 4);
  }, [location]);

  const locateCamera = location ? project({
    id: "location",
    latitude: location.latitude,
    longitude: location.longitude,
    type: null,
    mounted_on: null,
    reported_at: null,
    verified: false,
  }) : null;

  const mapTransform = `translate(${offset.x} ${offset.y}) scale(${zoom})`;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border bg-gradient-to-b from-muted/40 to-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Watchtower · public infrastructure</p>
              <Badge variant={feed?.state === "live" ? "live" : "outline"}>{feed?.state ?? "loading"}</Badge>
            </div>
            <h2 className="mt-1 font-display text-3xl md:text-4xl">Flock camera map</h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              Publicly reported ALPR infrastructure. This atlas shows sourced observations—not private Flock data, live vehicle activity, or a claim that a camera is currently operating.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-background/70 px-4 py-2">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Reports</p>
              <p className="font-display text-2xl tabular-nums">{filtered.length.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-4 py-2">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Verified</p>
              <p className="font-display text-2xl tabular-nums">{verifiedCount.toLocaleString()}</p>
            </div>
            <div className="col-span-2 rounded-xl border border-border bg-background/70 px-4 py-2 sm:col-span-1">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Visible groups</p>
              <p className="font-display text-2xl tabular-nums">{clusters.length.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label="Search Flock camera reports"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search camera type, mount, ID, or coordinates"
              className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </label>
          <button type="button" onClick={() => setVerifiedOnly((value) => !value)} className="min-h-11 rounded-xl border border-border bg-background px-4 text-xs font-medium hover:bg-muted">
            {verifiedOnly ? "Verified only" : "All reports"}
          </button>
          {location && (
            <button type="button" onClick={() => centerOn(location, 4)} className="min-h-11 rounded-xl border border-border bg-background px-4 text-xs font-medium hover:bg-muted">
              <LocateFixed className="mr-1 inline size-3.5" /> Center on me
            </button>
          )}
          <div className="flex min-h-11 items-center justify-center rounded-xl border border-border bg-background px-3 font-mono text-[10px] text-muted-foreground">
            {zoom.toFixed(1)}× zoom
          </div>
        </div>
      </header>

      <div
        className="relative select-none overflow-hidden bg-[#0b1016] touch-none"
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          setOffset({
            x: drag.current.ox + event.clientX - drag.current.x,
            y: drag.current.oy + event.clientY - drag.current.y,
          });
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        onDoubleClick={() => setZoom((value) => Math.min(8, value + 1))}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-[min(68vh,650px)] min-h-[430px] w-full" role="img" aria-label="Flock ALPR camera infrastructure map">
          <defs>
            <radialGradient id="atlas-glow" cx="50%" cy="48%" r="70%">
              <stop offset="0%" stopColor="#263849" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0b1016" stopOpacity="1" />
            </radialGradient>
            <filter id="soft-shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.35" /></filter>
          </defs>
          <rect width={W} height={H} fill="url(#atlas-glow)" />

          <g opacity="0.18">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <line key={`lon-${i}`} x1={(W / 6) * i} y1="0" x2={(W / 6) * i} y2={H} stroke="white" strokeDasharray="2 8" />
            ))}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={`lat-${i}`} x1="0" y1={(H / 5) * i} x2={W} y2={(H / 5) * i} stroke="white" strokeDasharray="2 8" />
            ))}
          </g>

          <g transform={mapTransform}>
            <path
              d="M90 110 C190 65 270 92 350 82 S510 70 610 92 S750 72 900 110 L930 180 L900 235 L820 260 L760 330 L650 365 L545 420 L430 390 L320 420 L220 360 L150 290 L100 220 Z"
              fill="#d7e3ea"
              fillOpacity="0.055"
              stroke="#d7e3ea"
              strokeOpacity="0.32"
              strokeWidth="2"
              filter="url(#soft-shadow)"
            />
            <path d="M118 175 C260 120 410 135 520 118 S750 120 890 155" fill="none" stroke="#d7e3ea" strokeOpacity="0.08" strokeWidth="1" />

            {clusters.map((cluster) => {
              const first = cluster.cameras[0];
              const size = cluster.cameras.length;
              if (size === 1) {
                return (
                  <g key={first.id} transform={`translate(${cluster.x} ${cluster.y})`} onClick={(event) => { event.stopPropagation(); setSelected(first); }} className="cursor-pointer">
                    <circle r={first.verified ? 5.5 : 4} fill={first.verified ? "#9ee7bd" : "#d5dde4"} fillOpacity={first.verified ? 0.95 : 0.58} stroke="#081018" strokeWidth="2" />
                    {first.verified && <circle r="10" fill="none" stroke="#9ee7bd" strokeOpacity="0.28" />}
                    <title>{first.type ?? "ALPR camera"} · {first.latitude.toFixed(4)}, {first.longitude.toFixed(4)}</title>
                  </g>
                );
              }

              const radius = Math.min(24, 9 + Math.log2(size) * 4);
              return (
                <g
                  key={`cluster-${cluster.x}-${cluster.y}`}
                  transform={`translate(${cluster.x} ${cluster.y})`}
                  className="cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation();
                    setZoom((value) => Math.min(8, value + 1));
                    setOffset((current) => ({
                      x: W / 2 - (cluster.x * Math.min(8, zoom + 1)) + (current.x * 0),
                      y: H / 2 - (cluster.y * Math.min(8, zoom + 1)) + (current.y * 0),
                    }));
                  }}
                >
                  <circle r={radius + 5} fill="#9ee7bd" fillOpacity="0.07" />
                  <circle r={radius} fill="#14231e" stroke="#9ee7bd" strokeOpacity="0.75" strokeWidth="1.5" />
                  <text y="1" textAnchor="middle" fill="#dff8e8" fontSize="10" fontWeight="700">{size > 999 ? "999+" : size}</text>
                </g>
              );
            })}

            {locateCamera && (
              <g transform={`translate(${locateCamera.x} ${locateCamera.y})`} aria-label="Your approximate device location">
                <circle r="16" fill="#7dd3fc" fillOpacity="0.08" />
                <circle r="5" fill="#7dd3fc" stroke="#071018" strokeWidth="2" />
                <circle r="14" fill="none" stroke="#7dd3fc" strokeOpacity="0.55">
                  <animate attributeName="r" from="8" to="19" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.7" to="0" dur="1.8s" repeatCount="indefinite" />
                </circle>
              </g>
            )}
          </g>
        </svg>

        <div className="absolute left-4 top-4 rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-white shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-emerald-300" />
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/70">Public camera observations</p>
          </div>
          <p className="mt-1 text-[10px] text-white/50">{location ? "Centered on permitted device location" : "National overview · drag to explore"}</p>
        </div>

        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          <div className="rounded-lg border border-white/10 bg-black/55 px-3 py-2 font-mono text-[10px] text-white/70 backdrop-blur">
            ● Verified report
          </div>
          <div className="rounded-lg border border-white/10 bg-black/55 px-3 py-2 font-mono text-[10px] text-white/70 backdrop-blur">
            ○ Reported observation
          </div>
          <div className="rounded-lg border border-white/10 bg-black/55 px-3 py-2 font-mono text-[10px] text-white/70 backdrop-blur">
            ◉ Cluster · tap to zoom
          </div>
        </div>

        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <button type="button" onClick={() => setZoom((value) => Math.min(8, value + 0.5))} className="inline-flex size-11 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-white shadow-lg backdrop-blur hover:bg-black/75" aria-label="Zoom in">
            <ZoomIn className="size-4" />
          </button>
          <button type="button" onClick={() => setZoom((value) => Math.max(1, value - 0.5))} className="inline-flex size-11 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-white shadow-lg backdrop-blur hover:bg-black/75" aria-label="Zoom out">
            <ZoomOut className="size-4" />
          </button>
          <button type="button" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); setSelected(null); }} className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-black/60 px-3 text-[10px] font-medium text-white shadow-lg backdrop-blur hover:bg-black/75">
            Reset
          </button>
        </div>

        {selected && (
          <aside className="absolute bottom-4 right-4 w-[min(390px,calc(100%-2rem))] rounded-2xl border border-white/10 bg-black/80 p-4 text-white shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">Camera record</p>
                <h3 className="mt-1 font-display text-xl">{selected.type ?? "ALPR camera"}</h3>
              </div>
              <button type="button" aria-label="Close camera dossier" onClick={() => setSelected(null)} className="min-h-11 min-w-11 rounded-lg border border-white/10 text-lg text-white/70 hover:bg-white/10">×</button>
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-4"><dt className="text-white/50">Coordinates</dt><dd className="font-mono">{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/50">Mount</dt><dd>{selected.mounted_on ?? "Not reported"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/50">Verification</dt><dd>{selected.verified ? "Community verified" : "Unverified report"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/50">Reported</dt><dd>{selected.reported_at ?? "Not reported"}</dd></div>
            </dl>
            <p className="mt-3 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-white/50">
              CIVINT presents the public record and provenance. It does not expose private plate-search data or imply current operation.
            </p>
          </aside>
        )}

        {!feed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <div className="rounded-2xl border border-white/10 bg-black/65 px-6 py-5 text-center text-white shadow-xl backdrop-blur">
              <div className="mx-auto mb-3 size-7 animate-spin rounded-full border-2 border-white/20 border-t-emerald-300" />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">Loading public atlas</p>
              <p className="mt-1 text-xs text-white/45">Fetching the current published camera feed…</p>
            </div>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-[10px] text-muted-foreground">
        <span>{feed?.count?.toLocaleString() ?? "—"} total source reports · clustered for responsive rendering</span>
        <span>{feed?.generated_at ? `updated ${new Date(feed.generated_at).toLocaleString()}` : "awaiting feed"}</span>
      </footer>
    </section>
  );
}
