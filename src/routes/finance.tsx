import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AwardsPanel } from "@/components/civint/awards-panel";
import { FINANCE_ITEMS, FINANCE_KINDS, FINANCE_METRICS, FINANCE_SOURCES, type FinanceItem, type FinanceKind } from "@/data/finance";

export const Route = createFileRoute("/finance")({ component: FinancePage });

const KINDS: Array<FinanceKind | "all"> = ["all", "pac", "dark", "lobbying", "trades", "contract", "state"];

function severityVariant(s: FinanceItem["severity"]) {
  if (s === "alert") return "danger" as const;
  if (s === "watch") return "warn" as const;
  return "outline" as const;
}

function FinancePage() {
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const items = useMemo(
    () => FINANCE_ITEMS.filter((i) => kind === "all" || i.kind === kind).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [kind],
  );

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Desk 04</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Finance</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Money in politics, read from the filings themselves: contributions, dark money, lobbying, official
          trades, and the contracts that turn influence into infrastructure.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden border border-border bg-border md:grid-cols-4">
          {FINANCE_METRICS.map((m) => (
            <div key={m.label} className="bg-card p-4">
              <p className="font-display text-2xl leading-none text-steel">{m.value}</p>
              <p className="mt-1 text-xs font-medium">{m.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{m.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <Button
              key={k}
              variant={kind === k ? "default" : "outline"}
              size="sm"
              onClick={() => setKind(k)}
              className="font-mono text-[11px] uppercase tracking-wider"
            >
              {k === "all" ? "All rails" : FINANCE_KINDS[k]}
            </Button>
          ))}
        </div>

        <div className="mt-6 grid gap-px border border-border bg-border">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group grid gap-1 bg-card p-4 transition-colors hover:bg-muted/60"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {item.date}
                </span>
                <Badge variant={severityVariant(item.severity)}>{item.severity}</Badge>
                <Badge variant="outline">{FINANCE_KINDS[item.kind]}</Badge>
                {item.amount && <Badge variant="steel">{item.amount}</Badge>}
              </div>
              <p className="text-sm font-medium group-hover:underline">{item.title}</p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{item.summary}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Source: {item.actor}
              </p>
            </a>
          ))}
        </div>

        <AwardsPanel />

        <h2 className="mt-10 font-display text-2xl">Primary sources</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every rail above is a view over a public filing system. Go to the filings themselves.
        </p>
        <div className="mt-4 grid gap-px border border-border bg-border md:grid-cols-2">
          {FINANCE_SOURCES.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-card p-4 transition-colors hover:bg-muted/60"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium group-hover:underline">{s.name}</p>
                <div className="flex gap-1">
                  {s.markers.map((m) => (
                    <Badge key={m} variant="outline">{m}</Badge>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{s.what}</p>
            </a>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
