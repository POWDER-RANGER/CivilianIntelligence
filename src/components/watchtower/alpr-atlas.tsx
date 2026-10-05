import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { PRIMARY_ALPR_PROVIDER } from "@/lib/alpr-providers";

type Location = { latitude: number; longitude: number };

type CameraObservation = {
  id: string;
  latitude: number;
  longitude: number;
  brand: string | null;
  operator: string | null;
  direction: string | null;
  mount: string | null;
  zone: string | null;
  source: string;
};

const NATIONAL: [number, number] = [-96, 38];
const MAX_ZOOM = 16;
const MIN_ZOOM = 3;
const SOURCE_LAYER = "cameras";

type MapLibreRuntime = any;
let mapLibreLoader: Promise<MapLibreRuntime> | null = null;

function loadMapLibre(): Promise<MapLibreRuntime> {
  if (typeof window === "undefined") return Promise.reject(new Error("browser only"));
  if ((window as any).maplibregl) return Promise.resolve((window as any).maplibregl);
  if (mapLibreLoader) return mapLibreLoader;

  mapLibreLoader = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-civint-maplibre]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@5.7.3/dist/maplibre-gl.css";
      link.dataset.civintMaplibre = "true";
      document.head.appendChild(link);
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-civint-maplibre]');
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).maplibregl));
      existing.addEventListener("error", () => reject(new Error("Map runtime failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/maplibre-gl@5.7.3/dist/maplibre-gl.js";
    script.async = true;
    script.dataset.civintMaplibre = "true";
    script.onload = () => resolve((window as any).maplibregl);
    script.onerror = () => reject(new Error("Map runtime failed to load"));
    document.head.appendChild(script);
  });

  return mapLibreLoader;
}

function readObservation(feature: any): CameraObservation | null {
  if (!feature?.geometry || feature.geometry.type !== "Point") return null;
  const coordinates = feature.geometry.coordinates;
  const p = feature.properties ?? {};
  const latitude = Number(coordinates?.[1]);
  const longitude = Number(coordinates?.[0]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    id: String(p.id ?? p.osm_id ?? `${latitude.toFixed(6)},${longitude.toFixed(6)}`),
    latitude,
    longitude,
    brand: p.brand ? String(p.brand) : null,
    operator: p.operator ? String(p.operator) : null,
    direction: p.direction ? String(p.direction) : null,
    mount: p.mount ?? p.mount_type ? String(p.mount ?? p.mount_type) : null,
    zone: p.zone ?? p.surveillance_zone ? String(p.zone ?? p.surveillance_zone) : null,
    source: "OpenStreetMap / DeFlock community",
  };
}

function currentVisibleObservations(map: any): CameraObservation[] {
  const features = map.querySourceFeatures("cameras", { sourceLayer: SOURCE_LAYER });
  const seen = new Set<string>();
  const observations: CameraObservation[] = [];

  for (const feature of features) {
    const observation = readObservation(feature);
    if (!observation) continue;
    const key = observation.id + ":" + observation.latitude + ":" + observation.longitude;
    if (seen.has(key)) continue;
    seen.add(key);
    observations.push(observation);
  }

  return observations;
}

function applyPointFilter(map: any, brandOnly: boolean, query: string) {
  const clauses: any[] = [];

  if (brandOnly) {
    clauses.push(["==", ["downcase", ["coalesce", ["get", "brand"], ""]], "flock safety"]);
  }

  const q = query.trim().toLowerCase();
  if (q) {
    clauses.push([
      "any",
      ["in", q, ["downcase", ["coalesce", ["get", "brand"], ""]]],
      ["in", q, ["downcase", ["coalesce", ["get", "operator"], ""]]],
      ["in", q, ["downcase", ["coalesce", ["get", "id"], ""]]],
      ["in", q, ["downcase", ["coalesce", ["get", "mount"], ""]]],
    ]);
  }

  const filter = clauses.length === 0 ? null : clauses.length === 1 ? clauses[0] : ["all", ...clauses];
  map.setFilter("camera-points", filter);
}

export function AlprAtlas({ location }: { location?: Location | null }) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [selected, setSelected] = useState<CameraObservation | null>(null);
  const [query, setQuery] = useState("");
  const [flockOnly, setFlockOnly] = useState(false);
  const [locationUsed, setLocationUsed] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [sourceReady, setSourceReady] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refreshVisibleCount = (map: any) => {
    try {
      setVisibleCount(currentVisibleObservations(map).length);
    } catch {
      setVisibleCount(0);
    }
  };

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    let cancelled = false;

    loadMapLibre().then((maplibregl) => {
      if (cancelled || !mapNode.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: mapNode.current,
        center: NATIONAL,
        zoom: 3.1,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        maxBounds: [[-130, 18], [-60, 56]],
        attributionControl: true,
        cooperativeGestures: false,
        style: "https://tiles.openfreemap.org/styles/liberty",
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "imperial" }), "bottom-right");

      map.on("load", () => {
        map.addSource("cameras", {
          type: "vector",
          url: PRIMARY_ALPR_PROVIDER.endpoint,
          promoteId: "id",
        });

        map.addLayer({
          id: "camera-heat",
          type: "heatmap",
          source: "cameras",
          "source-layer": SOURCE_LAYER,
          maxzoom: 10.5,
          paint: {
            "heatmap-weight": 1,
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 0.65, 8, 1.4, 10, 2.1],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 10, 6, 18, 10, 28],
            "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.75, 9, 0.9, 10.5, 0],
          },
        });

        map.addLayer({
          id: "camera-points",
          type: "circle",
          source: "cameras",
          "source-layer": SOURCE_LAYER,
          minzoom: 9.5,
          paint: {
            "circle-color": [
              "match",
              ["downcase", ["coalesce", ["get", "brand"], ""]],
              "flock safety",
              "#22c55e",
              "#fbbf24",
            ],
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 9.5, 2.5, 12, 4, 16, 6],
            "circle-opacity": ["interpolate", ["linear"], ["zoom"], 9.5, 0.35, 10.5, 0.82, 12, 0.94],
            "circle-stroke-color": "#071018",
            "circle-stroke-width": 1.2,
          },
        });

        map.addLayer({
          id: "camera-direction",
          type: "symbol",
          source: "cameras",
          "source-layer": SOURCE_LAYER,
          minzoom: 12,
          layout: {
            "text-field": "›",
            "text-size": 18,
            "text-rotate": ["coalesce", ["to-number", ["get", "direction"]], 0],
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "#67e8f9",
            "text-opacity": 0.8,
            "text-halo-color": "#071018",
            "text-halo-width": 1,
          },
        });

        setMapReady(true);
        setSourceReady(true);
        refreshVisibleCount(map);

        let moveTimer: ReturnType<typeof setTimeout> | null = null;
        map.on("moveend", () => {
          if (moveTimer) clearTimeout(moveTimer);
          moveTimer = setTimeout(() => refreshVisibleCount(map), 120);
        });

        map.on("idle", () => {
          setSourceReady(true);
          refreshVisibleCount(map);
        });

        map.on("sourcedata", (event: any) => {
          if (event.sourceId === "cameras" && event.isSourceLoaded) {
            setSourceReady(true);
            refreshVisibleCount(map);
          }
        });

        map.on("error", (event: any) => {
          const message = String(event?.error?.message ?? "");
          if (message.toLowerCase().includes("cameras") || message.toLowerCase().includes("tile")) {
            setError("The mapped tile provider is unavailable. No camera observations are fabricated.");
          }
        });

        map.on("click", "camera-points", (event: any) => {
          const feature = map.queryRenderedFeatures(event.point, { layers: ["camera-points"] })[0];
          const observation = readObservation(feature);
          if (observation) setSelected(observation);
        });

        map.on("mouseenter", "camera-points", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "camera-points", () => {
          map.getCanvas().style.cursor = "";
        });
      });

      mapRef.current = map;
    }).catch(() => {
      if (!cancelled) setError("The map runtime could not be loaded.");
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    applyPointFilter(mapRef.current, flockOnly, query);
    const refresh = () => refreshVisibleCount(mapRef.current);
    if (mapRef.current.isStyleLoaded()) refresh();
  }, [mapReady, flockOnly, query]);

  useEffect(() => {
    if (!location || !mapRef.current || !mapReady || locationUsed) return;
    mapRef.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 10.5,
      duration: 650,
      essential: true,
    });
    setLocationUsed(true);
  }, [location, mapReady, locationUsed]);

  const centerOnLocation = () => {
    if (!location || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 11,
      duration: 700,
      essential: true,
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border bg-gradient-to-b from-muted/40 to-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Watchtower · spatial intelligence</p>
              <Badge variant={error ? "outline" : sourceReady ? "live" : "outline"}>{error ? "degraded" : sourceReady ? "live" : "loading"}</Badge>
              <span className="rounded-full border border-border bg-background/60 px-2 py-1 font-mono text-[9px] text-muted-foreground">
                {visibleCount.toLocaleString()} mapped observations in loaded view
              </span>
            </div>

            <h2 className="mt-1 font-display text-3xl md:text-4xl">Flock camera map</h2>

            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              Publicly reported ALPR infrastructure is shown as <strong className="text-foreground">sourced observations</strong>.
              A point does not establish current operation, ownership, or vehicle activity.
            </p>

            <div className="mt-3 rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground">
                {error ?? "Viewport-native vector tiles load only the area you are viewing."}
              </span>
              {" "}Coverage is uneven; absence does not mean no cameras.
            </div>
          </div>

          <div className="grid min-w-[190px] grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-border bg-background/70 px-4 py-2">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Loaded</p>
              <p className="font-display text-2xl tabular-nums">{visibleCount.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-4 py-2">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Source</p>
              <p className="font-display text-lg">OSM</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              aria-label="Search mapped ALPR observations"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter brand, operator, ID, or mount"
              className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <button
            type="button"
            onClick={() => setFlockOnly((value) => !value)}
            className="min-h-11 rounded-xl border border-border bg-background px-4 text-xs font-medium hover:bg-muted"
          >
            {flockOnly ? "✓ Flock Safety" : "All ALPR"}
          </button>

          {location && (
            <button
              type="button"
              onClick={centerOnLocation}
              className="min-h-11 rounded-xl border border-border bg-background px-4 text-xs font-medium hover:bg-muted"
            >
              <LocateFixed className="mr-1 inline size-3.5" /> Near me
            </button>
          )}
        </div>
      </header>

      <div className="relative h-[min(72vh,720px)] min-h-[460px] bg-[#0b1016]">
        <div ref={mapNode} className="absolute inset-0" aria-label="Interactive Flock ALPR infrastructure map" />

        <div className="pointer-events-none absolute left-4 top-4 max-w-[calc(100%-5rem)] rounded-xl border border-white/10 bg-black/65 px-3 py-2 text-white shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-emerald-300" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/75">ALPR observation atlas</span>
          </div>
          <p className="mt-1 text-[10px] text-white/50">
            Heat density at national scale. Individual mapped observations appear as you zoom in.
          </p>
        </div>

        {location && (
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-sky-200/20 bg-sky-950/70 px-3 py-2 text-[10px] text-sky-100 shadow-lg backdrop-blur">
            Location enabled · map can center on your area
          </div>
        )}

        {selected && (
          <aside className="absolute bottom-4 right-4 z-10 w-[min(390px,calc(100%-2rem))] rounded-2xl border border-white/10 bg-black/85 p-4 text-white shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">Observation dossier</p>
                <h3 className="mt-1 font-display text-xl">{selected.brand ?? "ALPR camera"}</h3>
              </div>
              <button
                type="button"
                aria-label="Close observation dossier"
                onClick={() => setSelected(null)}
                className="min-h-11 min-w-11 rounded-lg border border-white/10 text-lg text-white/70 hover:bg-white/10"
              >
                ×
              </button>
            </div>

            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-4"><dt className="text-white/50">Coordinates</dt><dd className="font-mono">{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/50">Operator</dt><dd>{selected.operator ?? "Not reported"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/50">Mount</dt><dd>{selected.mount ?? "Not reported"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/50">Direction</dt><dd>{selected.direction ?? "Not reported"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/50">Zone</dt><dd>{selected.zone ?? "Not reported"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/50">Observation ID</dt><dd className="max-w-[190px] truncate font-mono">{selected.id}</dd></div>
            </dl>

            <p className="mt-3 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-white/50">
              Source: {selected.source}. CIVINT presents public provenance. It is not a plate-search or vehicle-history product.
            </p>
          </aside>
        )}

        {!sourceReady && !error && (
          <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/65 px-3 py-2 text-white shadow-lg backdrop-blur-xl">
            <span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-emerald-300 align-middle" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/75">Loading map tiles</span>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-[10px] text-muted-foreground">
        <span>Pinch, double-tap, wheel, or use the controls to zoom · drag to pan · heat density is not a camera count</span>
        <span>Primary provider: {PRIMARY_ALPR_PROVIDER.name} · hourly vector tiles · OSM contributors</span>
      </footer>

      <div className="flex flex-wrap gap-2 border-t border-border bg-muted/10 px-5 py-3 text-[10px] text-muted-foreground">
        <span>Fast path: viewport tiles</span>
        <span>·</span>
        <span>Fallback/validation: Flock Locations + OpenStreetMap</span>
        <span>·</span>
        <Link to="/records" className="underline underline-offset-2 hover:text-foreground">Record Index</Link>
        <span>·</span>
        <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy desk</Link>
      </div>
    </section>
  );
}
