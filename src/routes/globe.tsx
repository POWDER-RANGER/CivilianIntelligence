import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Camera,
  ExternalLink,
  Globe2,
  LoaderCircle,
  Map,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AlprAtlas } from "@/components/watchtower/alpr-atlas";

const PUBLIC_FEEDS_EMBED_URL =
  "https://civintelligence-gods-eye-prod.onrender.com/?embed=1#v=2&lat=30.2672&lon=-97.7431&alt=600&heading=15&pitch=-30&roll=360&style=normal&bloom=0&sharpen=1&bi=0&bv=2&si=49&hud=tactical&hv=1&dm=OFF&dd=50&da=elastic&kf=7&ko=1&cr=0&sc=1&scf=11&map=esri-imagery&l=&ui=c.c.0_c.p.0_l.c.0_l.p.0_d.c.1_v.c.1_i.c.1_t.c.1_r.c.1_s.c.1_g.c.1_p.c.1_m.c.1";
const PUBLIC_FEEDS_URL = "https://civintelligence-gods-eye-prod.onrender.com";

type PortalView = "map" | "globe";

export const Route = createFileRoute("/globe")({ component: CameraFeedPortal });

function CameraFeedPortal() {
  const [activeView, setActiveView] = useState<PortalView>("map");
  const [viewerRequested, setViewerRequested] = useState(false);
  const [loaded, setLoaded] = useState(false);

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
              href={PUBLIC_FEEDS_URL}
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
                    <button
                      type="button"
                      onClick={() => setViewerRequested(true)}
                      className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
                    >
                      <Globe2 className="size-4" /> Launch viewer
                    </button>
                    <p className="mt-3 text-xs text-muted-foreground">
                      The separate service may need a moment to wake up.
                    </p>
                  </div>
                </div>
              ) : (
                <>
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
                    src={PUBLIC_FEEDS_EMBED_URL}
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
