import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";

type Camera = {
  id: string;
  latitude: number;
  longitude: number;
  type: string | null;
  mounted_on: string | null;
  reported_at: string | null;
  verified: boolean;
  source?: string;
};

type Feed = {
  state: "live" | "unavailable" | "degraded" | "awaiting_feed" | "caching";
  generated_at: string | null;
  source: { name: string; method: string };
  count: number;
  total_count?: number;
  cache_age_seconds?: number;
  error_class?: "timeout" | "upstream" | "schema" | "empty";
  features: Camera[];
};

type Location = { latitude: number; longitude: number };

const NATIONAL: [number, number] = [-96, 38];
const MAX_ZOOM = 16;
const MIN_ZOOM = 3;

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

function statusText(feed: Feed | null, loading: boolean) {
  if (loading) return ["caching", "Checking the public source."] as const;
  if (!feed) return ["unavailable", "No feed response was received."] as const;
  if (feed.state === "unavailable") return ["unavailable", "The public source could not be reached. No pins are fabricated."] as const;
  if (feed.state === "degraded") return ["degraded", "Showing the last successful cache while the upstream source is degraded."] as const;
  if (!feed.count) return ["awaiting feed", "The adapter is reachable, but no public observations are available yet."] as const;
  return ["live", "Sourced observations; not proof of current operation."] as const;
}

function featureCollection(cameras: Camera[]) {
  return {
    type: "FeatureCollection" as const,
    features: cameras.map((camera) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [camera.longitude, camera.latitude] },
      properties: {
        id: camera.id,
        type: camera.type ?? "ALPR camera",
        mounted_on: camera.mounted_on ?? "Not reported",
        reported_at: camera.reported_at ?? "Not reported",
        verified: camera.verified ? 1 : 0,
      },
    })),
  };
}

export function AlprAtlas({ location }: { location?: Location | null }) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Camera | null>(null);
  const [query, setQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hasCoordinatesOnly, setHasCoordinatesOnly] = useState(true);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [locationUsed, setLocationUsed] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const filteredRef = useRef<Camera[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (feed?.features ?? []).filter((camera) => {
      if (hasCoordinatesOnly && (!Number.isFinite(camera.latitude) || !Number.isFinite(camera.longitude))) return false;
      if (verifiedOnly && !camera.verified) return false;
      if (nearbyOnly && location) {
        const latDelta = Math.abs(camera.latitude - location.latitude);
        const lonDelta = Math.abs(camera.longitude - location.longitude);
        if (latDelta > 0.7 || lonDelta > 0.9) return false;
      }
      if (!q) return true;
      return [camera.type, camera.mounted_on, camera.id, `${camera.latitude},${camera.longitude}`]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [feed, query, verifiedOnly, hasCoordinatesOnly, nearbyOnly, location]);

  const verifiedCount = useMemo(() => filtered.filter((camera) => camera.verified).length, [filtered]);
  filteredRef.current = filtered;
  const [status, explanation] = statusText(feed, loading);

  const fetchViewport = (map: any) => {
    const bounds = map.getBounds();
    const params = new URLSearchParams({
      west: String(bounds.getWest()),
      south: String(bounds.getSouth()),
      east: String(bounds.getEast()),
      north: String(bounds.getNorth()),
      // Keep payloads small enough for phones/foldables; clustering handles the visual density.\n      limit: map.getZoom() < 5 ? "1500" : map.getZoom() < 8 ? "2500" : "4000",
    });
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    setLoading(true);
    fetch("/api/civint/alpr/data?" + params.toString(), {
      headers: { Accept: "application/json" },
      cache: "force-cache",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Server feed unavailable");
        return response.json() as Promise<Feed>;
      })
      .then(setFeed)
      .catch((error) => {
        if (error?.name !== "AbortError") setFeed((current) => current ?? {
          state: "unavailable",
          generated_at: null,
          source: { name: "CIVINT upstream", method: "unavailable" },
          count: 0,
          features: [],
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
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
      cooperativeGestures: true,
      style: "https://tiles.openfreemap.org/styles/liberty",
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "imperial" }), "bottom-right");

      map.on("load", () => {
        setMapReady(true);
        // Do not block first paint on the data request. The basemap becomes interactive immediately.\n        // If location is already available, start with the local viewport instead of downloading the national feed twice.\n        fetchViewport(map);
        let moveTimer: ReturnType<typeof setTimeout> | null = null;
        map.on("moveend", () => {
          if (moveTimer) clearTimeout(moveTimer);
          moveTimer = setTimeout(() => fetchViewport(map), 180);
        });
      map.addSource("cameras", {
        type: "geojson",
        data: featureCollection(filteredRef.current),
        cluster: true,
        clusterMaxZoom: 9,
        clusterRadius: 48,
        clusterMinPoints: 2,
      });

      map.addLayer({
        id: "camera-clusters-halo",
        type: "circle",
        source: "cameras",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#6ee7b7",
          "circle-opacity": 0.11,
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 50, 25, 200, 31],
          "circle-pitch-alignment": "map",
        },
      });

      map.addLayer({
        id: "camera-clusters",
        type: "circle",
        source: "cameras",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["step", ["get", "point_count"], "#2dd4bf", 10, "#38bdf8", 50, "#a78bfa", 200, "#fb7185"],
          "circle-opacity": 0.92,
          "circle-stroke-color": "#071018",
          "circle-stroke-width": 2,
          "circle-radius": ["step", ["get", "point_count"], 8, 10, 11, 50, 14, 200, 18],
        },
      });

      map.addLayer({
        id: "camera-cluster-count",
        type: "symbol",
        source: "cameras",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["step", ["get", "point_count"], ["get", "point_count"], 1000, "999+"],
          "text-size": 10,
          "text-font": ["Open Sans Regular"],
          "text-allow-overlap": true,
        },
        paint: { "text-color": "#071018", "text-halo-color": "#d1fae5", "text-halo-width": 0.6 },
      });

      map.addLayer({
        id: "camera-points",
        type: "circle",
        source: "cameras",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["case", ["==", ["get", "verified"], 1], "#22c55e", "#fbbf24"],
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 2.5, 6, 3.5, 10, 5, 14, 6],
          "circle-opacity": 0.9,
          "circle-stroke-color": "#071018",
          "circle-stroke-width": 1.5,
        },
      });

      map.on("click", "camera-clusters", (event) => {
        const features = map.queryRenderedFeatures(event.point, { layers: ["camera-clusters"] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource("cameras") as any;
        if (clusterId != null) source.getClusterExpansionZoom(Number(clusterId)).then((zoom) => {
          const geometry = features[0].geometry;
          if (geometry.type === "Point") map.easeTo({ center: geometry.coordinates as [number, number], zoom: Math.min(zoom, MAX_ZOOM), duration: 450 });
        });
      });

      map.on("click", "camera-points", (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ["camera-points"] })[0];
        const p = feature?.properties;
        if (!p) return;
        setSelected({
          id: String(p.id),
          latitude: Number((feature.geometry as GeoJSON.Point).coordinates[1]),
          longitude: Number((feature.geometry as GeoJSON.Point).coordinates[0]),
          type: String(p.type),
          mounted_on: String(p.mounted_on),
          reported_at: String(p.reported_at),
          verified: Number(p.verified) === 1,
          source: "Flock Locations public camera reports",
        });
      });

      map.on("mouseenter", "camera-clusters", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "camera-clusters", () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "camera-points", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "camera-points", () => { map.getCanvas().style.cursor = ""; });
      });

    mapRef.current = map;
    }).catch(() => undefined);
    return () => { cancelled = true; fetchAbortRef.current?.abort(); mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const source = map.getSource("cameras") as any;
      if (source) source?.setData(featureCollection(filtered) as any);
    };
    if (map.isStyleLoaded()) update();
    else map.once("load", update);
  }, [filtered]);

  useEffect(() => {
    if (!location || !mapRef.current || !mapReady || locationUsed) return;\n    // Location can arrive after the map has initialized; only then move/fetch the local viewport.
    mapRef.current.flyTo({ center: [location.longitude, location.latitude], zoom: 10.5, duration: 700, essential: true });
    setLocationUsed(true);
  }, [location, mapReady, locationUsed]);

  const centerOnLocation = () => {
    if (!location || !mapRef.current) return;
    mapRef.current.flyTo({ center: [location.longitude, location.latitude], zoom: 10.5, duration: 800, essential: true });
    setNearbyOnly(true);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border bg-gradient-to-b from-muted/40 to-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Watchtower · spatial intelligence</p>
              <Badge variant={status === "live" ? "live" : "outline"}>{status}</Badge>
              <span className="rounded-full border border-border bg-background/60 px-2 py-1 font-mono text-[9px] text-muted-foreground">{(feed?.total_count ?? feed?.count)?.toLocaleString() ?? "—"} observations · {feed?.cache_age_seconds != null ? `cache ${feed.cache_age_seconds}s` : "source check"}</span>
            </div>
            <h2 className="mt-1 font-display text-3xl md:text-4xl">Flock camera map</h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              Publicly reported ALPR infrastructure is shown as <strong className="text-foreground">sourced observations</strong>. A point does not establish current operation, ownership, or vehicle activity.
            </p>
            <div className="mt-3 rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground">{explanation}</span> · Coverage is uneven; absence does not mean no cameras.
            </div>
          </div>
          <div className="grid min-w-[190px] grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-border bg-background/70 px-4 py-2">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Visible</p>
              <p className="font-display text-2xl tabular-nums">{filtered.length.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-4 py-2">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Verified</p>
              <p className="font-display text-2xl tabular-nums">{verifiedCount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input aria-label="Search Flock camera reports" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search type, mount, ID, or coordinates" className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <button type="button" onClick={() => setVerifiedOnly((value) => !value)} className="min-h-11 rounded-xl border border-border bg-background px-4 text-xs font-medium hover:bg-muted">{verifiedOnly ? "✓ Verified" : "All reports"}</button>
          <button type="button" onClick={() => setHasCoordinatesOnly((value) => !value)} className="min-h-11 rounded-xl border border-border bg-background px-4 text-xs font-medium hover:bg-muted">{hasCoordinatesOnly ? "✓ Mappable" : "All records"}</button>
          {location && <button type="button" onClick={centerOnLocation} className="min-h-11 rounded-xl border border-border bg-background px-4 text-xs font-medium hover:bg-muted"><LocateFixed className="mr-1 inline size-3.5" /> Near me</button>}
        </div>
      </header>

      {feed?.count === 0 && !loading && (
        <div className="border-b border-border bg-muted/15 p-4">
          <p className="text-sm font-medium">No public ALPR observations in this view yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">The source is not represented with fake pins. Try national view, the Record Index, Privacy desk, or FOIA tools when available.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setNearbyOnly(false); mapRef.current?.flyTo({ center: NATIONAL, zoom: 3.1, duration: 700 }); }} className="rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted">Browse national reports</button>
            <Link to="/privacy" className="rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted">Open Privacy desk</Link>
            <Link to="/toolkit" className="rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted">Draft FOIA</Link>
            <Link to="/records" className="rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted">Search Record Index</Link>
          </div>
        </div>
      )}

      <div className="relative h-[min(72vh,720px)] min-h-[460px] bg-[#0b1016]">
        <div ref={mapNode} className="absolute inset-0" aria-label="Interactive Flock ALPR infrastructure map" />

        <div className="pointer-events-none absolute left-4 top-4 max-w-[calc(100%-5rem)] rounded-xl border border-white/10 bg-black/65 px-3 py-2 text-white shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-emerald-300" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/75">Public observations · Flock Locations</span>
          </div>
          <p className="mt-1 text-[10px] text-white/50">Clusters collapse as you zoom out. Individual observations emerge as you zoom in.</p>
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
                <h3 className="mt-1 font-display text-xl">{selected.type ?? "ALPR camera"}</h3>
              </div>
              <button type="button" aria-label="Close observation dossier" onClick={() => setSelected(null)} className="min-h-11 min-w-11 rounded-lg border border-white/10 text-lg text-white/70 hover:bg-white/10">×</button>
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-4"><dt className="text-white/50">Coordinates</dt><dd className="font-mono">{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/50">Mount</dt><dd>{selected.mounted_on ?? "Not reported"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/50">Verification</dt><dd>{selected.verified ? "Community verified" : "Reported observation"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/50">Reported</dt><dd>{selected.reported_at ?? "Not reported"}</dd></div>
            </dl>
            <p className="mt-3 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-white/50">CIVINT presents public provenance. It is not a plate-search or vehicle-history product.</p>
          </aside>
        )}

        {loading && (
          <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/65 px-3 py-2 text-white shadow-lg backdrop-blur-xl">
            <span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-emerald-300 align-middle" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/75">Loading observations</span>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-[10px] text-muted-foreground">
        <span>Pinch, double-tap, wheel, or use the controls to zoom · drag to pan · clusters represent multiple observations</span>
        <span>{feed?.generated_at ? `source refreshed ${new Date(feed.generated_at).toLocaleTimeString()}` : "awaiting source"}</span>
      </footer>
    </section>
  );
}
