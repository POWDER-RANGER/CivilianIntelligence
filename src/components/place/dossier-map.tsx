import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useRef, useState } from "react";
import { Map, Marker, NavigationControl, ScaleControl, setWorkerUrl, type Map as MapInstance, type StyleSpecification } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

export type DossierCamera = {
  id: string;
  latitude: number;
  longitude: number;
  operator: string | null;
  brand: string | null;
  distanceMiles: number;
};

function circlePolygon(lat: number, lon: number, radiusMiles: number, steps = 96) {
  const coords: [number, number][] = [];
  const dLat = radiusMiles / 69.0;
  const dLon = radiusMiles / (69.172 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    coords.push([lon + dLon * Math.cos(t), lat + dLat * Math.sin(t)]);
  }
  return { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [coords] } };
}

function style(): StyleSpecification {
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
        paint: { "raster-saturation": -0.85, "raster-contrast": 0.05, "raster-brightness-max": 0.92 },
      },
    ],
  };
}

export function DossierMap({
  latitude,
  longitude,
  radiusMiles,
  cameras,
  label,
}: {
  latitude: number;
  longitude: number;
  radiusMiles: number;
  cameras: DossierCamera[];
  label: string;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!host.current) return;
    let map: MapInstance | null = null;
    let observer: ResizeObserver | null = null;
    try {
      setWorkerUrl(maplibreWorkerUrl);
      map = new Map({
        container: host.current,
        style: style(),
        center: [longitude, latitude],
        zoom: 11,
        attributionControl: { compact: true },
        cooperativeGestures: true,
      });
      mapRef.current = map;
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new ScaleControl({ unit: "imperial" }), "bottom-left");

      const pin = document.createElement("div");
      pin.className = "size-4 rounded-full border-[3px] border-card bg-foreground ring-4 ring-foreground/20";
      pin.setAttribute("aria-label", label);
      new Marker({ element: pin }).setLngLat([longitude, latitude]).addTo(map);

      map.on("load", () => {
        if (!map) return;
        map.addSource("radius", { type: "geojson", data: circlePolygon(latitude, longitude, radiusMiles) });
        map.addLayer({ id: "radius-fill", type: "fill", source: "radius", paint: { "fill-color": "#0e6e85", "fill-opacity": 0.06 } });
        map.addLayer({ id: "radius-line", type: "line", source: "radius", paint: { "line-color": "#0e6e85", "line-width": 1.5, "line-dasharray": [2, 2] } });
        map.addSource("cams", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: cameras.map((c) => ({
              type: "Feature",
              properties: { id: c.id, known: c.operator ? 1 : 0, operator: c.operator ?? "Operator not recorded", d: c.distanceMiles },
              geometry: { type: "Point", coordinates: [c.longitude, c.latitude] },
            })),
          },
        });
        map.addLayer({
          id: "cams-halo",
          type: "circle",
          source: "cams",
          paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 5, 15, 12], "circle-color": "#e69f00", "circle-opacity": 0.18 },
        });
        map.addLayer({
          id: "cams",
          type: "circle",
          source: "cams",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 2.5, 15, 6],
            "circle-color": ["case", ["==", ["get", "known"], 1], "#e69f00", "#ffffff"],
            "circle-stroke-color": ["case", ["==", ["get", "known"], 1], "#111418", "#0072b2"],
            "circle-stroke-width": 1,
          },
        });
        const dLat = radiusMiles / 69.0;
        const dLon = radiusMiles / (69.172 * Math.cos((latitude * Math.PI) / 180));
        map.fitBounds([[longitude - dLon, latitude - dLat], [longitude + dLon, latitude + dLat]], { padding: 24, duration: 0 });
      });

      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => map?.resize());
        observer.observe(host.current);
      }
    } catch (error) {
      setFailed(error instanceof Error ? error.message : String(error));
    }
    return () => {
      observer?.disconnect();
      map?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, radiusMiles, cameras, label]);

  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-2xl border border-border bg-muted">
      <div className="absolute inset-0">
        <div ref={host} className="h-full w-full" aria-label={`Map of cameras within ${radiusMiles} miles of ${label}`} />
      </div>
      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-muted/95 p-6 text-center text-sm text-muted-foreground">
          The map could not start in this browser ({failed}). Camera counts and the list below are unaffected.
        </div>
      )}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1 rounded-lg border border-border bg-card/95 px-3 py-2 text-xs text-muted-foreground shadow-sm">
        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-danger" />Operator on record</span>
        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-steel" />Operator not recorded</span>
      </div>
    </div>
  );
}
