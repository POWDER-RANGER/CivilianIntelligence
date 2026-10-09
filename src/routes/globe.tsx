import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, Globe2, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

const GODS_EYE_EMBED_URL =
  "https://civintelligence-gods-eye-view.onrender.com/?embed=1";
const GODS_EYE_URL = "https://civintelligence-gods-eye-view.onrender.com";

export const Route = createFileRoute("/globe")({ component: GlobalViewPage });

function GlobalViewPage() {
  const [loaded, setLoaded] = useState(false);

  return (
    <AppShell flush>
      <section className="flex min-h-0 flex-1 flex-col bg-[#080d12] text-slate-100">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <Globe2 className="mt-1 size-5 shrink-0 text-emerald-300" />
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
                CIVINTELLIGENCE · GOD'S EYE VIEW
              </p>
              <h1 className="mt-0.5 text-lg font-semibold tracking-tight md:text-xl">
                Global spatial intelligence
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Upstream CesiumJS experience, hosted separately to preserve its native data and layer architecture.
              </p>
            </div>
          </div>
          <a
            href={GODS_EYE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-300/20"
          >
            Open standalone <ExternalLink className="size-3.5" />
          </a>
        </header>

        <div className="flex items-start gap-2 border-b border-white/10 bg-amber-950/40 px-4 py-2 text-[11px] leading-relaxed text-amber-100 md:px-6">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
          <p>
            Public-data visualization only. Feeds can be delayed, incomplete, modeled, or inaccurate; verify important observations against their original sources. The upstream service is on Render's free tier and may need a cold start.
          </p>
        </div>

        <div className="relative min-h-[520px] flex-1 bg-[#080d12]">
          {!loaded && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
              <div className="max-w-sm rounded-xl border border-white/10 bg-black/60 p-4 shadow-xl backdrop-blur">
                <p className="text-sm font-medium text-slate-100">Connecting to God's Eye View…</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  The separate globe service may take a moment to wake up. You can also open it directly.
                </p>
              </div>
            </div>
          )}
          <iframe
            title="God's Eye View interactive 3D globe"
            src={GODS_EYE_EMBED_URL}
            className="absolute inset-0 size-full border-0"
            loading="eager"
            allow="fullscreen; geolocation; microphone; xr-spatial-tracking"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoaded(true)}
          />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-2 text-[10px] text-slate-400 md:px-6">
          <span>God's Eye View is a separate upstream application; CIVINTELLIGENCE records remain in their existing system of record.</span>
          <span>Source: <a className="underline decoration-slate-500 underline-offset-2 hover:text-slate-200" href="https://github.com/bilawalsidhu/gods-eye-view" target="_blank" rel="noopener noreferrer">bilawalsidhu/gods-eye-view</a> · MIT code license; data providers retain their own terms.</span>
        </footer>
      </section>
    </AppShell>
  );
}
