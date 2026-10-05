import "maplibre-gl/dist/maplibre-gl.css";

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

type MapStatus = "initializing" | "loading" | "ready" | "degraded" | "failed";

const NATIONAL_BOUNDS: [[number, number], [number, number]] = [
  [-125, 24],
  [-66, 50],
];
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [-165, 15],
  [-60, 65],
];
const MAX_ZOOM = 16;
const MIN_ZOOM = 2;
const SOURCE_LAYER = "cameras";
const CAMERA_SOURCE = "cameras";
const CAMERA_HEAT = "alpr-heat";
const CAMERA_GLOW = "alpr-camera-glow";
const CAMERA_POINT = "alpr-camera-point";

type MapLibreRuntime = typeof import("maplibre-gl");

function readObservation(feature: any): CameraObservation | null {
  if (!feature?.geometry || feature.geometry.type !== "Point") return null;

  const coordinates = feature.geometry.coordinates;
  const p = feature.properties ?? {};
  const latitude = Number(coordinates?.[1]);
  const longitude = Number(coordinates?.[0]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const osmId = p.osmId ?? p.osm_id;
  const osmType = p.osmType ?? p.osm_type ?? "node";

  return {
    id:
      osmId != null
        ? `${String(osmType)}/${String(osmId)}`
        : `${latitude.toFixed(6)},${longitude.toFixed(6)}`,
    latitude,
    longitude,
    brand: p.brand != null ? String(p.brand) : null,
    operator: p.operator != null ? String(p.operator) : null,
    mount: p.mountType != null ? String(p.mountType) : null,
    zone: p.surveillanceZone != null ? String(p.surveillanceZone) : null,
    direction:
      p.directionCardinal != null
        ? String(p.directionCardinal)
        : p.direction != null
          ? `${String(p.direction)}°`
          : null,
    source: "OpenStreetMap / DeFlock community",
  };
}

function currentVisibleObservations(map: any): CameraObservation[] {
  const features = map.queryRenderedFeatures(undefined, {
    layers: [CAMERA_POINT, CAMERA_GLOW],
  });
  const seen = new Set<string>();
  const observations: CameraObservation[] = [];

  for (const feature of features) {
    const observation = readObservation(feature);
    if (!observation) continue;

    const key = `${observation.id}:${observation.latitude}:${observation.longitude}`;
    if (seen.has(key)) continue;

    seen.add(key);
    observations.push(observation);
  }

  return observations;
}

function applyPointFilter(map: any, flockOnly: boolean, query: string) {
  const brand = ["downcase", ["coalesce", ["get", "brand"], ""]];
  const isFlock = ["in", "flock", brand];

  const q = query.trim().toLowerCase();
  const searchExpr = [
    "any",
    ...["brand", "operator", "mountType", "surveillanceZone", "osmId"].map(
      (key) => [
        "in",
        q,
        ["downcase", ["coalesce", ["to-string", ["get", key]], ""]],
      ],
    ),
  ];

  const parts: any[] = [];
  if (flockOnly) parts.push(isFlock);
  if (q) parts.push(searchExpr);

  const filter = parts.length ? ["all", ...parts] : null;

  for (const id of [CAMERA_GLOW, CAMERA_POINT]) {
    if (map.getLayer(id)) map.setFilter(id, filter);
  }
}

function createBasemapStyle() {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
        paint: {
          "raster-opacity": 0.98,
          "raster-saturation": -0.5,
          "raster-contrast": 0.08,
          "raster-brightness-min": 0.05,
          "raster-brightness-max": 0.86,
        },
      },
    ],
  };
}

export function AlprAtlas({ location }: { location?: Location | null }) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selected, setSelected] = useState<CameraObservation | null>(null);
  const [query, setQuery] = useState("");
  const [flockOnly, setFlockOnly] = useState(false);
  const [locationUsed, setLocationUsed] = useState(false);
  const [status, setStatus] = useState<MapStatus>("initializing");
  const [statusMessage, setStatusMessage] = useState("Starting map renderer…");
  const [visibleCount, setVisibleCount] = useState(0);

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

    const start = async () => {
      setStatus("loading");
      setStatusMessage("Loading bundled MapLibre renderer…");

      try {
        const maplibregl: MapLibreRuntime = await import("maplibre-gl");

        if (cancelled || !mapNode.current || mapRef.current) return;

        let map: any;

        try {
          map = new maplibregl.Map({
            container: mapNode.current,
            center: [-96, 38],
            zoom: MIN_ZOOM,
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            maxBounds: MAX_BOUNDS,
            attributionControl: true,
            cooperativeGestures: false,
            style: createBasemapStyle(),
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          setStatus("failed");
          setStatusMessage(`Renderer failed to start: ${message}`);
          return;
        }

        mapRef.current = map;

        watchdogRef.current = setTimeout(() => {
          if (!map.loaded()) {
            setStatus("failed");
            setStatusMessage(
              "Map did not initialize within 8 seconds. Check WebGL, CSP, or network access.",
            );
          }
        }, 8000);

        map.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          "top-right",
        );
        map.addControl(
          new maplibregl.ScaleControl({
            maxWidth: 120,
            unit: "imperial",
          }),
          "bottom-right",
        );

        map.once("load", () => {
          if (watchdogRef.current) {
            clearTimeout(watchdogRef.current);
            watchdogRef.current = null;
          }

          try {
            map.fitBounds(NATIONAL_BOUNDS, {
              padding: 16,
              duration: 0,
            });

            map.addSource(CAMERA_SOURCE, {
              type: "vector",
              url: PRIMARY_ALPR_PROVIDER.endpoint,
              promoteId: "id",
            });

            // DeFlock z0-z8 heat tiles are geometry-only. Never apply
            // attribute filters to this layer.
            map.addLayer({
              id: CAMERA_HEAT,
              type: "heatmap",
              source: CAMERA_SOURCE,
              "source-layer": SOURCE_LAYER,
              maxzoom: 10.5,
              paint: {
                "heatmap-weight": 1,
                "heatmap-intensity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  2,
                  0.5,
                  8,
                  1.35,
                  10,
                  2.1,
                ],
                "heatmap-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  2,
                  8,
                  6,
                  17,
                  10,
                  28,
                ],
                "heatmap-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  2,
                  0.72,
                  9,
                  0.9,
                  10.5,
                  0,
                ],
              },
            });

            const flockColor = [
              "case",
              [
                "in",
                "flock",
                ["downcase", ["coalesce", ["get", "brand"], ""]],
              ],
              "#22c55e",
              "#fbbf24",
            ];

            map.addLayer({
              id: CAMERA_GLOW,
              type: "circle",
              source: CAMERA_SOURCE,
              "source-layer": SOURCE_LAYER,
              minzoom: 9,
              paint: {
                "circle-color": flockColor,
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  9,
                  5,
                  12,
                  8,
                  16,
                  12,
                ],
                "circle-opacity": 0.16,
                "circle-blur": 0.8,
              },
            });

            map.addLayer({
              id: CAMERA_POINT,
              type: "circle",
              source: CAMERA_SOURCE,
              "source-layer": SOURCE_LAYER,
              minzoom: 9,
              paint: {
                "circle-color": flockColor,
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  9,
                  2.5,
                  12,
                  4,
                  16,
                  6,
                ],
                "circle-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  9,
                  0.45,
                  10.5,
                  0.82,
                  12,
                  0.94,
                ],
                "circle-stroke-color": "#071018",
                "circle-stroke-width": 1.2,
              },
            });

            setStatus("ready");
            setStatusMessage(
              "Renderer ready. Individual observations appear at zoom 9+.",
            );
            refreshVisibleCount(map);

            let moveTimer: ReturnType<typeof setTimeout> | null = null;
            map.on("moveend", () => {
              if (moveTimer) clearTimeout(moveTimer);
              moveTimer = setTimeout(() => refreshVisibleCount(map), 120);
            });

            map.on("idle", () => {
              refreshVisibleCount(map);
            });

            map.on("error", (event: any) => {
              const sourceId = event?.sourceId ?? event?.source?.id ?? "";
              const message = String(event?.error?.message ?? "");

              if (sourceId === CAMERA_SOURCE) {
                setStatus("degraded");
                setStatusMessage(
                  "ALPR tile data is temporarily unavailable. The basemap remains available.",
                );
              } else if (sourceId === "osm") {
                setStatus("degraded");
                setStatusMessage(
                  "OpenStreetMap tiles are temporarily unavailable. Camera data is not being fabricated.",
                );
              } else if (/webgl|worker|style/i.test(message)) {
                setStatus("failed");
                setStatusMessage(`Map renderer error: ${message}`);
              }
            });

            map.on("click", CAMERA_POINT, (event: any) => {
              const feature = map.queryRenderedFeatures(event.point, {
                layers: [CAMERA_POINT],
              })[0];
              const observation = readObservation(feature);
              if (observation) setSelected(observation);
            });

            map.on("mouseenter", CAMERA_POINT, () => {
              map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", CAMERA_POINT, () => {
              map.getCanvas().style.cursor = "";
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            setStatus("failed");
            setStatusMessage(`Map layers failed to initialize: ${message}`);
          }
        });
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : String(error);
          setStatus("failed");
          setStatusMessage(`Bundled MapLibre could not load: ${message}`);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || status !== "ready") return;
    applyPointFilter(mapRef.current, flockOnly, query);
    refreshVisibleCount(mapRef.current);
  }, [flockOnly, query, status]);

  useEffect(() => {
    if (!location || !mapRef.current || status !== "ready" || locationUsed) {
      return;
    }

    mapRef.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 10.5,
      duration: 650,
      essential: true,
    });
    setLocationUsed(true);
  }, [location, status, locationUsed]);

  const centerOnLocation = () => {
    if (!location || !mapRef.current || status !== "ready") return;

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
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Watchtower · spatial intelligence
              </p>
              <Badge variant={status === "ready" ? "live" : "outline"}>
                {status === "ready"
                  ? "LIVE"
                  : status === "failed"
                    ? "FAILED"
                    : status === "degraded"
                      ? "DEGRADED"
                      : "LOADING"}
              </Badge>
              <span className="rounded-full border border-border bg-background/60 px-2 py-1 font-mono text-[9px] text-muted-foreground">
                {visibleCount.toLocaleString()} mapped observations in loaded
                view
              </span>
            </div>

            <h2 className="mt-1 font-display text-3xl md:text-4xl">
              ALPR observation map
            </h2>

            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              Publicly reported ALPR infrastructure is shown as{" "}
              <strong className="text-foreground">
                sourced observations
              </strong>
              . A point does not establish current operation, ownership, or
              vehicle activity.
            </p>

            <div
              className={[
                "mt-3 rounded-xl border px-3 py-2 text-[10px]",
                status === "failed"
                  ? "border-amber-300/60 bg-amber-50 text-amber-950"
                  : "border-border/80 bg-background/50 text-muted-foreground",
              ].join(" ")}
            >
              <span className="font-medium text-foreground">
                {statusMessage}
              </span>{" "}
              Coverage is uneven; absence does not mean no cameras. Filters
              apply to individual observations at zoom 9+.
            </div>
          </div>

          <div className="grid min-w-[190px] grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-border bg-background/70 px-4 py-2">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Loaded
              </p>
              <p className="font-display text-2xl tabular-nums">
                {visibleCount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-4 py-2">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Provider
              </p>
              <p className="font-display text-lg">DeFlock / OSM</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              aria-label="Search mapped ALPR observations"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter brand, operator, mount, zone, or OSM ID"
              className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <button
            type="button"
            onClick={() => setFlockOnly((value) => !value)}
            className="min-h-11 rounded-xl border border-border bg-background px-4 text-xs font-medium hover:bg-muted"
          >
            {flockOnly ? "✓ Flock Safety" : "All mapped cameras"}
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

      <div className="relative h-[min(72vh,720px)] min-h-[460px] bg-slate-100">
        <div
          ref={mapNode}
          className="absolute inset-0"
          aria-label="Interactive ALPR infrastructure map"
        />

        {status === "failed" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100/95 p-6">
            <div className="max-w-md rounded-2xl border border-amber-300 bg-white p-5 shadow-xl">
              <p className="font-mono text-[10px] uppercase tracking-wider text-amber-700">
                Map renderer failed to start
              </p>
              <h3 className="mt-1 font-display text-2xl text-slate-950">
                The map is unavailable
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {statusMessage}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                This state is intentionally separate from ALPR data status.
                CIVINT will not label the map LIVE until MapLibre has emitted
                its load event.
              </p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[calc(100%-5rem)] rounded-xl border border-white/10 bg-black/65 px-3 py-2 text-white shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-emerald-300" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/75">
              ALPR observation atlas
            </span>
          </div>
          <p className="mt-1 text-[10px] text-white/50">
            Heat density at national scale. Individual mapped observations
            appear as you zoom in.
          </p>
        </div>

        {location && status === "ready" && (
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-sky-200/20 bg-sky-950/70 px-3 py-2 text-[10px] text-sky-100 shadow-lg backdrop-blur">
            Location enabled · map can center on your area
          </div>
        )}

        {selected && (
          <aside className="absolute bottom-4 right-4 z-30 w-[min(390px,calc(100%-2rem))] rounded-2xl border border-white/10 bg-black/85 p-4 text-white shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                  Observation dossier
                </p>
                <h3 className="mt-1 font-display text-xl">
                  {selected.brand ?? "Mapped ALPR camera"}
                </h3>
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
              <div className="flex justify-between gap-4">
                <dt className="text-white/50">Coordinates</dt>
                <dd className="font-mono">
                  {selected.latitude.toFixed(5)},{" "}
                  {selected.longitude.toFixed(5)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/50">Operator</dt>
                <dd>{selected.operator ?? "Not reported"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/50">Mount</dt>
                <dd>{selected.mount ?? "Not reported"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/50">Direction</dt>
                <dd>{selected.direction ?? "Not reported"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/50">Zone</dt>
                <dd>{selected.zone ?? "Not reported"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/50">Observation ID</dt>
                <dd className="max-w-[190px] truncate font-mono">
                  {selected.id}
                </dd>
              </div>
            </dl>

            <p className="mt-3 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-white/50">
              Source: {selected.source}. CIVINT presents public provenance. It
              is not a plate-search or vehicle-history product.
            </p>
          </aside>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-[10px] text-muted-foreground">
        <span>
          Pinch, double-tap, wheel, or use the controls to zoom · drag to pan ·
          heat density is not a camera count
        </span>
        <span>
          Primary provider: {PRIMARY_ALPR_PROVIDER.name} · hourly vector tiles
          · © OpenStreetMap contributors
        </span>
      </footer>

      <div className="flex flex-wrap gap-2 border-t border-border bg-muted/10 px-5 py-3 text-[10px] text-muted-foreground">
        <span>Fast path: viewport-native vector tiles</span>
        <span>·</span>
        <span>Validation: Flock Locations + OpenStreetMap</span>
        <span>·</span>
        <Link
          to="/records"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Record Index
        </Link>
        <span>·</span>
        <Link
          to="/privacy"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Privacy desk
        </Link>
      </div>
    </section>
  );
}
