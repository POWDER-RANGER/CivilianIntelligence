import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OVERSIGHT_ITEMS, type OversightItem } from "@/data/desks";
import { ExampleBadge, IllustrativeNotice } from "@/components/illustrative-notice";

export const Route = createFileRoute("/oversight")({ component: OversightPage });

const KINDS: Array<OversightItem["kind"] | "all"> = [
  "all",
  "ig",
  "gao",
  "foia",
  "ethics",
  "spending",
  "lobbying",
  "hearing",
];

function OversightPage() {
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const items = useMemo(
    () => OVERSIGHT_ITEMS.filter((i) => kind === "all" || i.kind === kind),
    [kind],
  );

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

        <div className="mt-8">
          <IllustrativeNotice feed="oversight filings" />
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <div className="hidden grid-cols-[7rem_7rem_1fr_6rem] gap-3 border-b border-border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground md:grid">
            <span>Date</span>
            <span>Office</span>
            <span>Filing</span>
            <span>Type</span>
          </div>
          <ul>
            {items.map((item) => (
              <li key={item.id} className="border-b border-border last:border-b-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="grid gap-2 px-4 py-4 hover:bg-muted md:grid-cols-[7rem_7rem_1fr_6rem] md:items-start"
                >
                  <span className="font-mono text-xs text-muted-foreground">{item.date}</span>
                  <span className="text-xs uppercase tracking-wide text-steel">{item.office}</span>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                    {/* Fixture dollar amounts are not sourced; never display them as figures. */}
                  </div>
                  <div className="flex items-start gap-2">
                    <ExampleBadge />
                    <Badge variant="outline">{item.kind}</Badge>
                  </div>
                </a>
              </li>
            ))}
          </ul>
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
