import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as maplibregl from "maplibre-gl";
import { feature } from "topojson-client";
import us from "us-atlas/states-10m.json";
import "maplibre-gl/dist/maplibre-gl.css";

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
type CameraProps = Camera & { title: string };

const USA = feature(us, us.objects.states) as GeoJSON.FeatureCollection;
const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

function cameraData(cameras: Camera[]): GeoJSON.FeatureCollection<GeoJSON.Point, CameraProps> {
  return {
    type: "FeatureCollection",
    features: cameras.map((camera) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [camera.longitude, camera.latitude] },
      properties: { ...camera, title: camera.type ?? "ALPR camera" },
    })),
  };
}

const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    usa: { type: "geojson", data: USA },
    cameras: { type: "geojson", data: EMPTY, cluster: true, clusterMaxZoom: 11, clusterRadius: 46 },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#0b1016" } },
    { id: "usa-fill", type: "fill", source: "usa", paint: { "fill-color": "#d7e3ea", "fill-opacity": 0.055 } },
    { id: "usa-line", type: "line", source: "usa", paint: { "line-color": "#d7e3ea", "line-opacity": 0.34, "line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.7, 7, 1.6] } },
    { id: "cluster-halo", type: "circle", source: "cameras", filter: ["has", "point_count"], paint: { "circle-color": "#9ee7bd", "circle-opacity": 0.08, "circle-radius": ["step", ["get", "point_count"], 17, 20, 22, 100, 27, 500, 33] } },
    { id: "clusters", type: "circle", source: "cameras", filter: ["has", "point_count"], paint: { "circle-color": "#14231e", "circle-opacity": 0.96, "circle-stroke-color": "#9ee7bd", "circle-stroke-opacity": 0.75, "circle-stroke-width": 1.5, "circle-radius": ["step", ["get", "point_count"], 12, 20, 16, 100, 21, 500, 27] } },
    { id: "cluster-count", type: "symbol", source: "cameras", filter: ["has", "point_count"], layout: { "text-field": ["case", [">", ["get", "point_count"], 999], "999+", ["to-string", ["get", "point_count"]]], "text-size": 10, "text-allow-overlap": true }, paint: { "text-color": "#dff8e8" } },
    { id: "camera-halo", type: "circle", source: "cameras", filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "verified"], true]], paint: { "circle-color": "#9ee7bd", "circle-opacity": 0.12, "circle-radius": 10 } },
    { id: "cameras", type: "circle", source: "cameras", filter: ["!", ["has", "point_count"]], paint: { "circle-color": ["case", ["==", ["get", "verified"], true], "#9ee7bd", "#d5dde4"], "circle-opacity": ["case", ["==", ["get", "verified"], true], 0.96, 0.62], "circle-radius": ["case", ["==", ["get", "verified"], true], 5.5, 4], "circle-stroke-color": "#081018", "circle-stroke-width": 2 } },
  ],
};

export function AlprAtlas({ location }: { location?: Location | null }) {
  const node = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [selected, setSelected] = useState<Camera | null>(null);
  const [query, setQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [zoom, setZoom] = useState(3.2);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!node.current || map.current) return;
    const instance = new maplibregl.Map({
      container: node.current,
      style: STYLE,
      center: [-98.5, 38.5],
      zoom: 3.2,
      minZoom: 2,
      maxZoom: 18,
      maxBounds: [[-180, 15], [-45, 72]],
      attributionControl: true,
      dragRotate: false,
      pitchWithRotate: false,
      renderWorldCopies: false,
    });
    map.current = instance;
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    instance.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "imperial" }), "bottom-left");

    instance.on("load", () => { setReady(true); setError(null); });
    instance.on("error", (event) => {
      if (!instance.isStyleLoaded()) setError(event.error?.message ?? "Map renderer failed to initialize");
    });
    instance.on("zoom", () => setZoom(instance.getZoom()));
    instance.on("click", "cameras", (event) => {
      const properties = event.features?.[0]?.properties as Partial<Camera> | undefined;
      if (properties?.id) setSelected({
        id: String(properties.id),
        latitude: Number(properties.latitude),
        longitude: Number(properties.longitude),
        type: properties.type ? String(properties.type) : null,
        mounted_on: properties.mounted_on ? String(properties.mounted_on) : null,
        reported_at: properties.reported_at ? String(properties.reported_at) : null,
        verified: properties.verified === true || String(properties.verified) === "true",
      });
    });
    instance.on("click", "clusters", async (event) => {
      const cluster = event.features?.[0];
      if (!cluster) return;
      const source = instance.getSource("cameras") as maplibregl.GeoJSONSource;
      const id = Number(cluster.properties?.cluster_id);
      const targetZoom = await source.getClusterExpansionZoom(id);
      const center = (cluster.geometry as GeoJSON.Point).coordinates as [number, number];
      instance.easeTo({ center, zoom: Math.min(targetZoom, 18), duration: 550 });
    });
    for (const layer of ["clusters", "cameras"]) {
      instance.on("mouseenter", layer, () => { instance.getCanvas().style.cursor = "pointer"; });
      instance.on("mouseleave", layer, () => { instance.getCanvas().style.cursor = ""; });
    }
    return () => { instance.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/civint/alpr/data", { headers: { Accept: "application/json" }, cache: "force-cache", signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Feed unavailable"); return response.json() as Promise<Feed>; })
      .then(setFeed)
      .catch((err) => {
        if (err?.name !== "AbortError") setFeed({ state: "unavailable", generated_at: null, source: { name: "CIVINT upstream", method: "unavailable" }, count: 0, features: [] });
      });
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (feed?.features ?? []).filter((camera) => {
      if (verifiedOnly && !camera.verified) return false;
      if (!q) return true;
      return [camera.type, camera.mounted_on, camera.id, `${camera.latitude},${camera.longitude}`]
        .filter(Boolean).some((value) => String(value).toLowerCase().includes(q));
    });
  }, [feed, query, verifiedOnly]);

  useEffect(() => {
    const source = map.current?.getSource("cameras") as maplibregl.GeoJSONSource | undefined;
    if (source) void source.setData(cameraData(filtered));
  }, [filtered]);

  useEffect(() => {
    if (location && ready) map.current?.flyTo({ center: [location.longitude, location.latitude], zoom: 7, duration: 850 });
  }, [location, ready]);

  const centerOnLocation = () => {
    if (location) map.current?.flyTo({ center: [location.longitude, location.latitude], zoom: 7, duration: 850 });
  };
  const reset = () => {
    map.current?.flyTo({ center: [-98.5, 38.5], zoom: 3.2, duration: 650 });
    setSelected(null);
  };

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
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">Publicly reported ALPR infrastructure. This atlas shows sourced observations—not private Flock data, live vehicle activity, or a claim that a camera is currently operating.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
            <Stat label="Reports" value={filtered.length} />
            <Stat label="Verified" value={filtered.filter((camera) => camera.verified).length} />
            <Stat label="Map zoom" value={`${zoom.toFixed(1)}×`} />
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input aria-label="Search Flock camera reports" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search camera type, mount, ID, or coordinates" className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring" />
          </label>
          <button type="button" onClick={() => setVerifiedOnly((value) => !value)} className="min-h-11 rounded-xl border border-border bg-background px-4 text-xs font-medium hover:bg-muted">{verifiedOnly ? "Verified only" : "All reports"}</button>
          {location ? <button type="button" onClick={centerOnLocation} className="min-h-11 rounded-xl border border-border bg-background px-4 text-xs font-medium hover:bg-muted"><LocateFixed className="mr-1 inline size-3.5" /> Center on me</button> : <span />}
          <button type="button" onClick={reset} className="min-h-11 rounded-xl border border-border bg-background px-4 text-xs font-medium hover:bg-muted">Reset view</button>
        </div>
      </header>

      <div className="relative h-[min(68vh,650px)] min-h-[430px] overflow-hidden bg-[#0b1016]">
        <div ref={node} className="absolute inset-0" aria-label="Interactive U.S. Flock ALPR camera map" />
        <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-white shadow-lg backdrop-blur">
          <div className="flex items-center gap-2"><MapPin className="size-3.5 text-emerald-300" /><p className="font-mono text-[10px] uppercase tracking-wider text-white/70">Public camera observations</p></div>
          <p className="mt-1 text-[10px] text-white/50">Bundled U.S. geography · real published camera records</p>
        </div>
        <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2">
          <Legend label="Verified report" glyph="●" />
          <Legend label="Reported observation" glyph="○" />
          <Legend label="Cluster · click to zoom" glyph="◉" />
        </div>
        {selected && (
          <aside className="absolute bottom-4 right-4 w-[min(390px,calc(100%-2rem))] rounded-2xl border border-white/10 bg-black/80 p-4 text-white shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-mono text-[10px] uppercase tracking-wider text-white/50">Camera record</p><h3 className="mt-1 font-display text-xl">{selected.type ?? "ALPR camera"}</h3></div>
              <button type="button" aria-label="Close camera dossier" onClick={() => setSelected(null)} className="min-h-11 min-w-11 rounded-lg border border-white/10 text-lg text-white/70 hover:bg-white/10">×</button>
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <Row label="Coordinates" value={`${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`} />
              <Row label="Mount" value={selected.mounted_on ?? "Not reported"} />
              <Row label="Verification" value={selected.verified ? "Community verified" : "Unverified report"} />
              <Row label="Reported" value={selected.reported_at ?? "Not reported"} />
            </dl>
            <p className="mt-3 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-white/50">CIVINT presents the public record and provenance. It does not expose private plate-search data or imply current operation.</p>
          </aside>
        )}
        {!ready && <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[1px]"><div className="rounded-2xl border border-white/10 bg-black/70 px-6 py-5 text-center text-white shadow-xl backdrop-blur"><div className="mx-auto mb-3 size-7 animate-spin rounded-full border-2 border-white/20 border-t-emerald-300" /><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">Starting MapLibre renderer</p><p className="mt-1 max-w-xs text-xs text-white/45">{error ?? "Loading the bundled U.S. geography…"}</p></div></div>}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-[10px] text-muted-foreground">
        <span>{feed?.count?.toLocaleString() ?? "—"} total source reports · MapLibre clusters the visible records</span>
        <span>{feed?.generated_at ? `updated ${new Date(feed.generated_at).toLocaleString()}` : "awaiting feed"}</span>
      </footer>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-border bg-background/70 px-4 py-2"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p><p className="font-display text-2xl tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</p></div>;
}
function Legend({ label, glyph }: { label: string; glyph: string }) {
  return <div className="rounded-lg border border-white/10 bg-black/55 px-3 py-2 font-mono text-[10px] text-white/70 backdrop-blur">{glyph} {label}</div>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><dt className="text-white/50">{label}</dt><dd className="text-right">{value}</dd></div>;
}
