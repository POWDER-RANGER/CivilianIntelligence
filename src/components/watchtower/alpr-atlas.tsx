import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useRef, useState } from "react";
import {
  Map,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
  type Map as MapInstance,
  type ExpressionSpecification,
  type StyleSpecification,
} from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
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

function createBasemapStyle(): StyleSpecification {
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
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);

  const refreshVisibleCount = (map: any) => {
    try {
      setZoomLevel(map.getZoom());
      setVisibleCount(currentVisibleObservations(map).length);
    } catch {
      setVisibleCount(0);
    }
  };

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;

    let cancelled = false;
    let map: MapInstance | null = null;
    let moveTimer: ReturnType<typeof setTimeout> | null = null;
    let resizeObserver: ResizeObserver | null = null;

    // This MUST execute before Map() creates its worker pool.
    // This is the exact Vite/TanStack Start worker pattern used by a
    // production TanStack Start + MapLibre application that had the same
    // blank-map/worker failure.
    if (typeof window !== "undefined") {
      setWorkerUrl(maplibreWorkerUrl);
    }

    const start = () => {
      setStatus("loading");
      setStatusMessage("Starting bundled MapLibre renderer…");

      try {
        const canvas = document.createElement("canvas");
        const webgl2 = canvas.getContext("webgl2");
        if (!webgl2) {
          setStatus("failed");
          setStatusMessage(
            "WebGL2 is unavailable in this browser or WebView. The map renderer cannot start.",
          );
          return;
        }
        webgl2.getExtension("WEBGL_lose_context")?.loseContext();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        setStatus("failed");
        setStatusMessage(`WebGL2 probe failed: ${message}`);
        return;
      }

      try {
        map = new Map({
          container: mapNode.current!,
          center: [-96, 38],
          zoom: MIN_ZOOM,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
          maxBounds: MAX_BOUNDS,
          attributionControl: {},
          cooperativeGestures: false,
          style: createBasemapStyle(),
        });

        mapRef.current = map;

        if (typeof ResizeObserver !== "undefined" && mapNode.current) {
          resizeObserver = new ResizeObserver(() => {
            if (!cancelled && map) map.resize();
          });
          resizeObserver.observe(mapNode.current);
        }

        watchdogRef.current = setTimeout(() => {
          if (map && !map.loaded()) {
            setStatus("failed");
            setStatusMessage(
              "Map did not initialize within 8 seconds. The renderer worker or WebGL initialization is failing.",
            );
          }
        }, 8000);

        map.addControl(
          new NavigationControl({ showCompass: false }),
          "top-right",
        );
        map.addControl(
          new ScaleControl({
            maxWidth: 120,
            unit: "imperial",
          }),
          "bottom-right",
        );

        const initializeLayers = () => {
          if (cancelled || !map) return;

          if (watchdogRef.current) {
            clearTimeout(watchdogRef.current);
            watchdogRef.current = null;
          }

          try {
            // Re-measure before fitting: fitting against a stale/zero-size
            // canvas lands on minZoom and hides the national view.
            map.resize();
            map.fitBounds(NATIONAL_BOUNDS, {
              padding: 16,
              duration: 0,
            });

            if (!map.getSource(CAMERA_SOURCE)) {
              map.addSource(CAMERA_SOURCE, {
                type: "vector",
                url: PRIMARY_ALPR_PROVIDER.endpoint,
                promoteId: "id",
              });
            }

            map.addLayer({
              id: CAMERA_HEAT,
              type: "heatmap",
              source: CAMERA_SOURCE,
              "source-layer": SOURCE_LAYER,
              maxzoom: 10.5,
              paint: {
                "heatmap-weight": 1,
                // Tuned so national scale shows regional density gradients
                // instead of a saturated CONUS-wide red field.
                "heatmap-intensity": [
                  "interpolate", ["linear"], ["zoom"],
                  2, 0.12, 5, 0.35, 8, 0.9, 10, 1.4,
                ],
                "heatmap-radius": [
                  "interpolate", ["linear"], ["zoom"],
                  2, 3, 5, 7, 8, 14, 10, 22,
                ],
                // cividis (CVD-safe), reversed for the light basemap so
                // higher density reads darker. Design Standard v2.
                "heatmap-color": [
                  "interpolate", ["linear"], ["heatmap-density"],
                  0, "rgba(222,201,88,0)",
                  0.15, "rgba(222,201,88,0.5)",
                  0.4, "rgba(155,148,118,0.65)",
                  0.65, "rgba(97,101,111,0.78)",
                  0.85, "rgba(26,56,111,0.86)",
                  1, "rgba(0,34,78,0.92)",
                ],
                "heatmap-opacity": [
                  "interpolate", ["linear"], ["zoom"],
                  2, 0.72, 9, 0.9, 10.5, 0,
                ],
              },
            });

            // Flock-branded: filled Okabe-Ito orange. Other or unknown vendor:
            // hollow ring in Okabe-Ito blue. Shape and color both differ, so
            // the split never depends on hue alone.
            const isFlockBrand: ExpressionSpecification = [
              "in", "flock", ["downcase", ["coalesce", ["get", "brand"], ""]],
            ];
            const flockColor: ExpressionSpecification = [
              "case", isFlockBrand, "#e69f00", "#ffffff",
            ];
            const flockStroke: ExpressionSpecification = [
              "case", isFlockBrand, "#111418", "#0072b2",
            ];

            map.addLayer({
              id: CAMERA_GLOW,
              type: "circle",
              source: CAMERA_SOURCE,
              "source-layer": SOURCE_LAYER,
              minzoom: 9,
              paint: {
                // Invisible hit area only: v2 uses no glow.
                "circle-color": flockColor,
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 5, 12, 8, 16, 12],
                "circle-opacity": 0,
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
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 2.5, 12, 4, 16, 6],
                "circle-opacity": ["interpolate", ["linear"], ["zoom"], 9, 0.55, 10.5, 0.9, 12, 1],
                "circle-stroke-color": flockStroke,
                "circle-stroke-width": ["case", isFlockBrand, 1, 2],
              },
            });

            setStatus("ready");
            setStatusMessage(
              "Renderer ready. Individual observations appear at zoom 9+.",
            );
            refreshVisibleCount(map);

            map.on("moveend", () => {
              if (moveTimer) clearTimeout(moveTimer);
              moveTimer = setTimeout(() => {
                if (map) refreshVisibleCount(map);
              }, 120);
            });

            map.on("idle", () => {
              if (map) refreshVisibleCount(map);
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
              } else if (/worker|webgl|gpu|style/i.test(message)) {
                setStatus("failed");
                setStatusMessage(`Map renderer error: ${message}`);
              }
            });

            map.on("click", CAMERA_POINT, (event: any) => {
              if (!map) return;
              const feature = map.queryRenderedFeatures(event.point, {
                layers: [CAMERA_POINT],
              })[0];
              const observation = readObservation(feature);
              if (observation) setSelected(observation);
            });

            map.on("mouseenter", CAMERA_POINT, () => {
              if (map) map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", CAMERA_POINT, () => {
              if (map) map.getCanvas().style.cursor = "";
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            setStatus("failed");
            setStatusMessage(`Map layers failed to initialize: ${message}`);
          }
        };

        // style.load is the reliable initialization point for this app.
        // Waiting for full load can hang forever when a nonessential remote
        // resource is blocked.
        map.once("style.load", initializeLayers);

        map.on("error", (event: any) => {
          const message = String(event?.error?.message ?? "");
          if (/worker|webgl|gpu/i.test(message)) {
            setStatus("failed");
            setStatusMessage(`Map renderer error: ${message}`);
          }
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        setStatus("failed");
        setStatusMessage(`Map constructor failed: ${message}`);
      }
    };

    start();

    return () => {
      cancelled = true;
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
      if (moveTimer) clearTimeout(moveTimer);
      resizeObserver?.disconnect();
      map?.remove();
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
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="border-b border-border bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                CIVWATCH Map · documented infrastructure
              </p>
              <Badge variant="outline">
                {status === "ready"
                  ? "HOURLY TILES"
                  : status === "failed"
                    ? "FAILED"
                    : status === "degraded"
                      ? "DEGRADED"
                      : "LOADING"}
              </Badge>
              <span className="rounded-full border border-border bg-background/60 px-2 py-1 font-mono text-xs text-muted-foreground">
                {zoomLevel < 9
                  ? "Zoom to 9+ to list individual observations"
                  : `${visibleCount.toLocaleString()} mapped observations in loaded view`}
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
                "mt-3 rounded-xl border px-3 py-2 text-xs",
                status === "failed"
                  ? "border-warn bg-warn-subtle text-foreground"
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
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Loaded
              </p>
              <p className="font-display text-2xl tabular-nums">
                {zoomLevel < 9 ? "—" : visibleCount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-4 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
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

      <div className="relative h-[min(72vh,720px)] min-h-[460px] bg-muted">
        {/* maplibre-gl.css sets `.maplibregl-map { position: relative }` on the
            host element, which overrides `absolute inset-0` and collapses the
            host to 0px. Keep positioning on a wrapper; give MapLibre a plain
            full-size host inside it. */}
        <div className="absolute inset-0">
          <div
            ref={mapNode}
            className="h-full w-full"
            aria-label="Interactive ALPR infrastructure map"
          />
        </div>

        {status === "failed" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-muted p-6">
            <div className="max-w-md rounded-2xl border border-warn bg-card p-5 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-warn">
                Map renderer failed to start
              </p>
              <h3 className="mt-1 font-display text-2xl text-foreground">
                The map is unavailable
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-steel">
                {statusMessage}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                This state is intentionally separate from ALPR data status.
                CIVWATCH will not label the map LIVE until MapLibre has emitted
                its load event.
              </p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[calc(100%-5rem)] rounded-xl border border-border bg-card px-3 py-2 text-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              ALPR observation atlas
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Heat density at national scale. Individual mapped observations
            appear as you zoom in.
          </p>
          <ul className="mt-2 grid gap-1 text-xs" aria-label="Map legend">
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="inline-block size-3 rounded-full border border-marker-stroke bg-dv-alpr-fixed" />
              Flock Safety (vendor named in source)
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="inline-block size-3 rounded-full border-2 border-dv-other-device bg-card" />
              Other or unknown vendor
            </li>
          </ul>
        </div>

        {location && status === "ready" && (
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
            Location enabled · map can center on your area
          </div>
        )}

        {selected && (
          <aside className="absolute bottom-4 right-4 z-30 w-[min(390px,calc(100%-2rem))] rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
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
                className="min-h-11 min-w-11 rounded-lg border border-input text-lg text-steel hover:bg-muted"
              >
                ×
              </button>
            </div>

            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Coordinates</dt>
                <dd className="font-mono">
                  {selected.latitude.toFixed(5)},{" "}
                  {selected.longitude.toFixed(5)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Operator</dt>
                <dd>{selected.operator ?? "Not reported"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Mount</dt>
                <dd>{selected.mount ?? "Not reported"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Direction</dt>
                <dd>{selected.direction ?? "Not reported"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Zone</dt>
                <dd>{selected.zone ?? "Not reported"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Observation ID</dt>
                <dd className="max-w-[190px] truncate font-mono">
                  {selected.id}
                </dd>
              </div>
            </dl>

            <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
              Source: {selected.source}. CIVWATCH presents public provenance. It
              is not a plate-search or vehicle-history product.
            </p>
          </aside>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground">
        <span>
          Pinch, double-tap, wheel, or use the controls to zoom · drag to pan ·
          heat density is not a camera count
        </span>
        <span>
          Primary provider: {PRIMARY_ALPR_PROVIDER.name} · hourly vector tiles
          · © OpenStreetMap contributors
        </span>
      </footer>

      <div className="flex flex-wrap gap-2 border-t border-border bg-muted/10 px-5 py-3 text-xs text-muted-foreground">
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

      <p className="border-t border-border px-5 py-3 text-xs leading-relaxed text-muted-foreground">
        CIVWATCH maps publicly reported infrastructure from public records, open data
        (OpenStreetMap) and volunteer reports. We do not access camera feeds, intercept
        communications, or track individuals.{" "}
        <a
          href="https://github.com/POWDER-RANGER/CivilianIntelligence/issues/new?title=Map%20correction%3A%20"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline underline-offset-2"
        >
          Report a map error
        </a>
        .
      </p>
    </section>
  );
}
