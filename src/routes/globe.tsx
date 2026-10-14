import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, ExternalLink, Globe2, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AlprAtlas } from "@/components/watchtower/alpr-atlas";

const PUBLIC_FEEDS_EMBED_URL =
  "https://civintelligence-gods-eye-prod.onrender.com/?embed=1#v=2&lat=30.2672&lon=-97.7431&alt=600&heading=15&pitch=-30&roll=360&style=normal&bloom=0&sharpen=1&bi=0&bv=2&si=49&hud=tactical&hv=1&dm=DENSE&dd=75&da=elastic&kf=7&ko=1&cr=0&sc=1&scf=11&map=esri-imagery&l=&lo=f.e.1_k.o.n&ui=c.c.1_c.p.0_l.c.1_l.p.0_d.c.1_v.c.1_i.c.0_t.c.1_r.c.1_s.c.1_g.c.1_p.c.1_m.c.0";
const PUBLIC_FEEDS_URL = "https://civintelligence-gods-eye-prod.onrender.com";

export const Route = createFileRoute("/globe")({ component: CameraFeedPortal });

function CameraFeedPortal() {
  const [loaded, setLoaded] = useState(false);

  return (
    <AppShell flush>
      <section className="flex min-h-0 flex-1 flex-col bg-background">
        <header className="border-b border-border px-4 py-4 md:px-6">
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <Camera className="mt-1 size-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  CIVINTELLIGENCE · ALPR
                </p>
                <h1 className="mt-0.5 text-2xl font-semibold tracking-tight md:text-3xl">
                  Camera & Public Feeds Portal
                </h1>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                  Explore U.S.-focused ALPR infrastructure alongside a separate God's Eye viewer. The embedded viewer is currently global; a U.S. starting position does not filter its feeds.
                </p>
              </div>
            </div>
            <a
              href={PUBLIC_FEEDS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              Open feed viewer separately <ExternalLink className="size-3.5" />
            </a>
          </div>
        </header>

        <div className="border-b border-border bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950 dark:bg-amber-950/30 dark:text-amber-100 md:px-6">
          <div className="mx-auto flex max-w-[1800px] items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              <strong>Source and access boundary:</strong> mapped ALPR points are records of reported infrastructure, not video URLs. A live view is shown only when a public publisher actually provides one. This portal does not bypass authentication or expose private camera systems. Feed availability, freshness, and licensing remain controlled by each provider.
            </p>
          </div>
        </div>

        <main className="mx-auto grid w-full max-w-[1800px] flex-1 gap-5 p-3 md:p-5 xl:grid-cols-2">
          <section className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <Camera className="size-4 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">ALPR infrastructure map</h2>
                <p className="text-xs text-muted-foreground">
                  Publicly sourced observations · DeFlock / OpenStreetMap
                </p>
              </div>
            </div>
            <AlprAtlas />
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Selecting an observation identifies its available public metadata. It does not establish that a device is operating or that a video stream exists.
            </p>
          </section>

          <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-[#080d12] text-slate-100">
            <header className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
              <Globe2 className="size-5 shrink-0 text-emerald-300" />
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">Separate God's Eye viewer</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Global feed viewer · not yet restricted to U.S. data
                </p>
              </div>
              <span className="ml-auto shrink-0 rounded-full border border-white/15 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-slate-300">
                {loaded ? "Viewer loaded" : "Connecting"}
              </span>
            </header>

            <div className="relative min-h-[640px] bg-[#080d12]">
              {!loaded && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
                  <div className="max-w-sm rounded-xl border border-white/10 bg-black/70 p-4 shadow-xl backdrop-blur">
                    <p className="text-sm font-medium text-slate-100">Connecting to the public-feed viewer…</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      The separate service may need a moment to wake up. If it does not load, use the separate-viewer link above.
                    </p>
                  </div>
                </div>
              )}
              <iframe
                title="Separate God's Eye global viewer"
                src={PUBLIC_FEEDS_EMBED_URL}
                className="absolute inset-0 size-full border-0"
                loading="eager"
                allow="fullscreen; geolocation"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={() => setLoaded(true)}
              />
            </div>
            <footer className="border-t border-white/10 px-4 py-3 text-[11px] leading-relaxed text-slate-400">
              Public data can be delayed, incomplete, estimated, or unavailable. The viewer loading is not proof that every feed is live. Original providers remain the source of record; code reference:{" "}
              <a
                className="underline decoration-slate-500 underline-offset-2 hover:text-slate-200"
                href="https://github.com/bilawalsidhu/gods-eye-view"
                target="_blank"
                rel="noopener noreferrer"
              >
                open-source globe and camera layers
              </a>
              .
            </footer>
          </section>
        </main>
      </section>
    </AppShell>
  );
}
