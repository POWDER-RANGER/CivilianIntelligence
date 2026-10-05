import { AppShell } from "@/components/layout/app-shell";
import { FederalSpendingPanel } from "@/components/finance/federal-spending-panel";
import { SecRecordsPanel } from "@/components/finance/sec-records-panel";
import { PublicRecordsPanel } from "@/components/expansion/public-records-panel";
import { Badge } from "@/components/ui/badge";
import { createFileRoute } from "@tanstack/react-router";
import { FINANCE_SOURCES } from "@/data/finance";

export const Route = createFileRoute("/finance")({ component: FinancePage });

function FinancePage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Desk 04</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Finance & corporate records</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Follow public money, corporate filings, and the records that connect institutions to infrastructure.
          CIVINT brings the evidence forward while preserving provenance and making unavailable feeds explicit.
        </p>

        <FederalSpendingPanel />
        <SecRecordsPanel />
        <PublicRecordsPanel />

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Source directory</p>
              <h2 className="mt-1 font-display text-2xl">Primary public sources</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                These are the underlying public filing systems and watchdog datasets. CIVINT links back to the original record when attribution or full-document review matters.
              </p>
            </div>
            <Badge variant="outline">{FINANCE_SOURCES.length} sources</Badge>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {FINANCE_SOURCES.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium group-hover:underline">{source.name}</p>
                  <div className="flex gap-1">
                    {source.markers.map((marker) => (
                      <Badge key={marker} variant="outline">{marker}</Badge>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{source.what}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
