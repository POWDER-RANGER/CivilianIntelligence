import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  formatUsd,
  getCivintAwards,
  isRecipientMatch,
  topRecipients,
  totalAwardAmount,
  usaspendingAwardUrl,
  type CivintAward,
} from "@/lib/civint-feeds";

const SHOWN = 8;

/** Federal awards matching surveillance search terms (USAspending, via civint_ingest). */
export function AwardsPanel() {
  const [awards, setAwards] = useState<CivintAward[] | null>(null);

  useEffect(() => {
    let live = true;
    void getCivintAwards().then((a) => {
      if (live) setAwards(a);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!awards) return null;

  if (awards.length === 0) {
    return (
      <section className="mt-10 rounded-xl border border-dashed border-border bg-card p-5">
        <h2 className="font-display text-2xl">Federal surveillance awards</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          No snapshot published yet. The nightly ingest writes <code className="font-mono text-xs">awards.json</code>{" "}
          to <code className="font-mono text-xs">public/civint/</code>.
        </p>
      </section>
    );
  }

  const leaders = topRecipients(awards, 3);

  return (
    <section className="mt-10 rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-display text-2xl">Federal surveillance awards</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            USAspending awards matching Flock / ALPR search terms. Federal only: city and county contracts are not
            here.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="warn">{awards.length.toLocaleString("en-US")} awards</Badge>
          <Badge variant="steel">{formatUsd(totalAwardAmount(awards))} total</Badge>
        </div>
      </header>

      {leaders.length > 0 && (
        <p className="border-b border-border px-5 py-3 text-xs text-muted-foreground">
          Largest recipients:{" "}
          {leaders.map((l, i) => (
            <span key={l.recipient}>
              {i > 0 && " · "}
              <span className="font-medium text-foreground">{l.recipient}</span> {formatUsd(l.total)}
            </span>
          ))}
        </p>
      )}

      <ul>
        {awards.slice(0, SHOWN).map((w) => (
          <li key={w.internal_id} className="border-b border-border px-5 py-3 last:border-b-0">
            <a
              href={usaspendingAwardUrl(w.internal_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug group-hover:underline">{w.recipient}</p>
                <Badge variant="steel">{formatUsd(w.amount)}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{w.agency}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                <span>
                  {w.start_date} · {w.award_group}
                </span>
                <Badge variant={isRecipientMatch(w) ? "live" : "outline"}>
                  {isRecipientMatch(w) ? "recipient match" : "keyword match"}
                </Badge>
              </p>
            </a>
          </li>
        ))}
      </ul>

      <p className="px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
        Keyword matches are search hits, not findings. Open the award record to confirm what was actually bought.
        Showing the {Math.min(SHOWN, awards.length)} largest of {awards.length.toLocaleString("en-US")}.
      </p>
    </section>
  );
}
