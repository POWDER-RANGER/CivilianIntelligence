import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window { Cesium?: any; }
}

const CESIUM_VERSION = "1.132";
const CESIUM_BASE = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;

function loadCesium(): Promise<any> {
  if (window.Cesium) return Promise.resolve(window.Cesium);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-civint-cesium="true"]');
    const finish = () => window.Cesium ? resolve(window.Cesium) : reject(new Error("CesiumJS loaded without its runtime."));
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("CesiumJS could not be downloaded.")), { once: true });
      return;
    }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = `${CESIUM_BASE}/Widgets/widgets.css`;
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = `${CESIUM_BASE}/Cesium.js`;
    script.async = true;
    script.dataset.civintCesium = "true";
    script.onload = finish;
    script.onerror = () => reject(new Error("CesiumJS could not be downloaded. Check the network or content-security policy."));
    document.head.appendChild(script);
  });
}

function GlobePage() {
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<any>(null);
  const [status, setStatus] = useState("Loading globe engine…");
  const [error, setError] = useState<string | null>(null);
  const [imagery, setImagery] = useState("OpenStreetMap");

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;
    loadCesium().then((Cesium) => {
      if (cancelled || !host.current) return;
      // Public OSM tiles provide a no-key fallback. No fabricated live feeds or markers.
      const osm = new Cesium.UrlTemplateImageryProvider({
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        credit: "© OpenStreetMap contributors",
        maximumLevel: 19,
      });
      const instance = new Cesium.Viewer(host.current, {
        imageryProvider: osm,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: true,
        sceneModePicker: true,
        baseLayerPicker: false,
        navigationHelpButton: false,
        fullscreenButton: true,
        infoBox: false,
        selectionIndicator: false,
        shouldAnimate: false,
      });
      viewer.current = instance;
      instance.scene.globe.enableLighting = true;
      instance.scene.globe.showGroundAtmosphere = true;
      instance.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(-98.5, 39.5, 18000000) });
      setStatus("Globe ready · no API key required");
      resizeObserver = new ResizeObserver(() => instance.resize());
      resizeObserver.observe(host.current);
      instance.scene.renderError.addEventListener((_scene: unknown, renderError: Error) => {
        if (!cancelled) setError(renderError.message || "Globe rendering failed.");
      });
    }).catch((reason: unknown) => {
      if (!cancelled) {
        setError(reason instanceof Error ? reason.message : "Unable to initialize CesiumJS.");
        setStatus("Globe unavailable");
      }
    });
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      viewer.current?.destroy();
      viewer.current = null;
    };
  }, []);

  const goHome = () => {
    const Cesium = window.Cesium;
    if (Cesium && viewer.current) viewer.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(-98.5, 39.5, 18000000),
      duration: 1.2,
    });
  };
  const switchImagery = (kind: string) => {
    const Cesium = window.Cesium;
    const instance = viewer.current;
    if (!Cesium || !instance) return;
    const provider = kind === "Esri"
      ? new Cesium.ArcGisMapServerImageryProvider({ url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer" })
      : new Cesium.UrlTemplateImageryProvider({
          url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          credit: "© OpenStreetMap contributors",
          maximumLevel: 19,
        });
    instance.imageryLayers.removeAll();
    instance.imageryLayers.addImageryProvider(provider);
    setImagery(kind);
  };

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-[#080d12] text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-4 md:px-7">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-300">CIVINTELLIGENCE · SPATIAL</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">Global view</h1>
          <p className="mt-1 text-xs text-slate-400">3D globe foundation · geographic context first · source status stays explicit</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
            <span className="text-slate-400">Imagery</span>
            <select value={imagery} onChange={(event) => switchImagery(event.target.value)} className="bg-transparent text-slate-100 outline-none">
              <option className="bg-slate-900" value="OpenStreetMap">OpenStreetMap</option>
              <option className="bg-slate-900" value="Esri">Esri satellite</option>
            </select>
          </label>
          <button onClick={goHome} className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-400/20">Reset view</button>
        </div>
      </header>
      <section className="relative h-[calc(100dvh-12rem)] min-h-[420px] overflow-hidden">
        <div ref={host} className="absolute inset-0" aria-label="Interactive 3D Earth globe" />
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/10 bg-[#080d12]/85 px-3 py-2 backdrop-blur">
          <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-300">Renderer status</p>
          <p className="mt-1 text-xs text-slate-200">{status}</p>
        </div>
        {error && <div role="alert" className="absolute bottom-4 left-4 right-4 rounded-lg border border-rose-400/30 bg-rose-950/95 p-3 text-sm text-rose-100">{error}</div>}
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[11px] text-slate-400 md:px-7">
        <span>Basemap: {imagery} · attribution supplied by provider</span>
        <span>Live feeds are not connected yet; no synthetic observations are shown.</span>
      </footer>
    </main>
  );
}

export const Route = createFileRoute("/globe")({ component: GlobePage });
