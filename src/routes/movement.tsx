import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRegisterFeed, type RegisterDoc } from "@/lib/feeds";

export const Route = createFileRoute("/movement")({ component: MovementPage });

const KINDS = ["all", "executive", "legislative", "judicial", "diplomatic", "agency", "local"] as const;

function MovementPage() {
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const [register, setRegister] = useState<RegisterDoc[] | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getRegisterFeed().then((res) => {
      if (cancelled) return;
      setRegister(res.results);
      setLive(res.ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">Desk 01</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Government movement</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Public calendars of power: the floor, the briefing room, the bench, the advisory committee, the CODEL.
          CIVWATCH does not track people in secret. It indexes where government said it would be.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)} className="capitalize">
              {k}
            </Button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
          <div role="status" className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">No verified government calendar events available</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Illustrative calendar entries have been removed. {kind === "all" ? "Government" : kind} events will appear after a verified public calendar source is integrated.
            </p>
          </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl">Federal Register</h2>
                <Badge variant={live ? "live" : "outline"}>{register === null ? "Loading" : live ? "API" : "Unavailable"}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Newest public inspection from the daily journal of the federal government.
              </p>
              <ul className="mt-4 space-y-3">
                {(register ?? []).slice(0, 6).map((doc) => (
                  <li key={doc.html_url} className="border-t border-border pt-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      {doc.publication_date} · {doc.type}
                      {doc.duplicateCount ? ` · ${doc.duplicateCount} same-day documents` : ""}
                    </p>
                    <a
                      href={doc.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block text-sm leading-snug hover:underline"
                    >
                      {doc.title}
                    </a>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {doc.agencies.map((a) => a.name).filter(Boolean).join(", ")}
                    </p>
                  </li>
                ))}
                {register && register.length === 0 && (
                  <li className="text-sm text-muted-foreground">
                    {live
                      ? "The Federal Register returned no new documents."
                      : "The Federal Register API is unavailable right now. Nothing is substituted."}
                  </li>
                )}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-medium">Open the movement branch</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Calendars, CODELs, FACA, dockets — every source used to build this desk.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link to="/" search={{ node: "movement" }}>
                  Jump to tree
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
