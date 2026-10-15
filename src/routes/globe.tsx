import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Camera,
  ExternalLink,
  Globe2,
  LoaderCircle,
  LocateFixed,
  Map,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AlprAtlas } from "@/components/watchtower/alpr-atlas";
import {
  DEFAULT_GLOBE_CAMERA,
  GLOBE_BASE_URL,
  MY_LOCATION_ALT,
  buildGlobeEmbedUrl,
  type GlobeCamera,
} from "@/lib/globe-url";

type PortalView = "map" | "globe";
type LocateState = "idle" | "requesting" | "granted" | "denied" | "unavailable";

export const Route = createFileRoute("/globe")({ component: CameraFeedPortal });

function CameraFeedPortal() {
  const [activeView, setActiveView] = useState<PortalView>("map");
  const [viewerRequested, setViewerRequested] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [camera, setCamera] = useState<GlobeCamera>(DEFAULT_GLOBE_CAMERA);
  const [locateState, setLocateState] = useState<LocateState>("idle");

  // Same prompt pattern as the home page: ask only on a user click, never on load.
  function launchAtMyLocation() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocateState("unavailable");
      setViewerRequested(true);
      return;
    }
    setLocateState("requesting");
    let settled = false;
    // The geolocation timeout does not run while the permission prompt is open,
    // so an ignored prompt would never resolve. Fall back to the default view.
    const fallback = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      setLocateState("denied");
      setViewerRequested(true);
    }, 15000);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(fallback);
        setCamera({ lat: coords.latitude, lon: coords.longitude, alt: MY_LOCATION_ALT });
        setLocateState("granted");
        setViewerRequested(true);
      },
      () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(fallback);
        setLocateState("denied");
        setViewerRequested(true);
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  }

  const showMap = activeView === "map";
  const viewerStatus = loaded
    ? "Viewer loaded"
    : viewerRequested
      ? "Connecting"
      : "On demand";

  return (
    <AppShell flush>
      <section className="flex min-h-0 flex-1 flex-col bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6 md:py-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-primary">
                <Globe2 className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  CIVWATCH · Geospatial desk
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
                  Cameras and public feeds
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  Inspect documented U.S. ALPR infrastructure and open the separate global viewer when you need it.
                  The global viewer is not filtered to the United States.
                </p>
              </div>
            </div>
            <a
              href={GLOBE_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Open viewer separately <ExternalLink className="size-4" />
            </a>
          </div>
        </header>

        <div className="border-b border-warn bg-warn-subtle px-4 py-3 text-xs leading-relaxed text-foreground md:px-6">
          <div className="mx-auto flex max-w-[1800px] items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              <strong>Source and access boundary:</strong> mapped ALPR points are records of reported infrastructure,
              not video URLs. A live view is shown only when a public publisher provides one. This portal does not
              bypass authentication or expose private camera systems. Feed availability, freshness, and licensing
              remain controlled by each provider.
            </p>
          </div>
        </div>

        <div className="border-b border-border bg-background px-3 py-2 lg:hidden">
          <div className="mx-auto grid max-w-[1800px] grid-cols-2 gap-2" role="group" aria-label="Choose map view">
            <button
              type="button"
              aria-pressed={showMap}
              onClick={() => setActiveView("map")}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${
                showMap
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <Map className="size-4" /> U.S. ALPR map
            </button>
            <button
              type="button"
              aria-pressed={!showMap}
              onClick={() => setActiveView("globe")}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${
                !showMap
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <Globe2 className="size-4" /> Global viewer
            </button>
          </div>
        </div>

        <main className="mx-auto grid w-full max-w-[1800px] min-h-0 flex-1 grid-cols-1 items-stretch gap-3 p-3 md:gap-4 md:p-5 xl:grid-cols-2">
          <section className={`min-w-0 ${showMap ? "block" : "hidden"} xl:block`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Camera className="size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <h2 className="text-base font-semibold md:text-lg">U.S. ALPR infrastructure</h2>
                  <p className="text-xs text-muted-foreground">Publicly sourced observations · DeFlock / OpenStreetMap</p>
                </div>
              </div>
              <span className="shrink-0 rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                U.S. scope
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <AlprAtlas />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Selecting an observation identifies its available public metadata. It does not establish that a device is
              operating or that a video stream exists.
            </p>
          </section>

          <section
            data-theme="ops"
            className={`min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground ${!showMap ? "block" : "hidden"} xl:block`}
          >
            <header className="flex min-h-[76px] items-center gap-3 border-b border-border px-3 py-3 md:px-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-primary">
                <Globe2 className="size-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold md:text-lg">Global public-feed viewer</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Separate open-source geospatial application</p>
              </div>
              <span className="ml-auto shrink-0 rounded-md border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {viewerStatus}
              </span>
            </header>

            <div className="relative h-[min(70dvh,820px)] min-h-[420px] bg-background md:min-h-[540px] xl:h-[calc(100dvh-290px)] xl:min-h-[540px]">
              {!viewerRequested ? (
                <div className="absolute inset-0 flex items-center justify-center p-5 md:p-8">
                  <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-center md:p-7">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-border bg-muted text-primary">
                      <Globe2 className="size-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">Launch the 3D viewer</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                      The globe is loaded only when requested. This keeps the initial portal lighter, especially on
                      phones and foldables.
                    </p>
                    <div className="mt-5 flex flex-col items-stretch justify-center gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={launchAtMyLocation}
                        disabled={locateState === "requesting"}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                      >
                        {locateState === "requesting" ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <LocateFixed className="size-4" />
                        )}
                        Launch at my location
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewerRequested(true)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        <Globe2 className="size-4" /> Launch viewer
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Your location is requested only if you choose it, is rounded to about 100 m, and stays in your
                      browser. The separate service may need a moment to wake up.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {(locateState === "denied" || locateState === "unavailable") && (
                    <p className="absolute inset-x-0 top-0 z-20 border-b border-warn bg-warn-subtle px-3 py-2 text-xs text-foreground">
                      Location {locateState === "denied" ? "was not shared" : "is not available in this browser"}; showing
                      the default view.
                    </p>
                  )}
                  {!loaded && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
                      <div className="max-w-sm rounded-xl border border-border bg-popover p-4">
                        <LoaderCircle className="mx-auto size-5 animate-spin text-primary" />
                        <p className="mt-2 text-sm font-medium text-foreground">Connecting to the viewer…</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          If it does not load, open the viewer separately to check the service.
                        </p>
                      </div>
                    </div>
                  )}
                  <iframe
                    title="Global public-feed viewer"
                    src={buildGlobeEmbedUrl(camera)}
                    className="absolute inset-0 size-full border-0"
                    loading="lazy"
                    allow="fullscreen"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    onLoad={() => setLoaded(true)}
                  />
                </>
              )}
            </div>
            <footer className="border-t border-border px-3 py-3 text-xs leading-relaxed text-muted-foreground md:px-4">
              Public data can be delayed, incomplete, estimated, or unavailable. A loaded viewer is not proof that
              every feed is live. Original providers remain the source of record.{" "}
              <a
                className="text-foreground underline underline-offset-2"
                href="https://github.com/bilawalsidhu/gods-eye-view"
                target="_blank"
                rel="noopener noreferrer"
              >
                Inspect the open-source project
              </a>
              .
            </footer>
          </section>
        </main>
      </section>
    </AppShell>
  );
}
