import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/oversight")({ component: OversightPage });

const KINDS = ["all", "ig", "gao", "foia", "ethics", "spending", "lobbying", "hearing"] as const;

function OversightPage() {
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">Desk 02</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Oversight</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The civilian audit trail: Inspectors General, GAO, FOIA releases, STOCK Act trades, lobbying
          registrations, and the watchdogs who read them so you do not have to live in PDFs.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)} className="capitalize">
              {k}
            </Button>
          ))}
        </div>

        <div role="status" className="mt-8 rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">No verified oversight filings available</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            CIVWATCH does not display illustrative filings as current records. The {kind === "all" ? "oversight" : kind.toUpperCase()} feed requires verified source ingestion before records can appear here.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Follow the money",
              body: "USAspending, SAM.gov, Treasury Fiscal Data.",
              node: "oversight-spending",
            },
            {
              title: "Ask for the file",
              body: "FOIA.gov, MuckRock, agency reading rooms.",
              node: "oversight-foia",
            },
            {
              title: "Watch the watchers of money",
              body: "OpenSecrets, FEC, LDA, Capitol Trades.",
              node: "oversight-finance",
            },
          ].map((card) => (
            <div key={card.node} className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-2xl">{card.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/" search={{ node: card.node }}>
                  Open in tree
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
