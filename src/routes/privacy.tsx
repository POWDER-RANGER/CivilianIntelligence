import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRIVACY_SYSTEMS, type PrivacySystem } from "@/data/desks";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

const CATS: Array<PrivacySystem["category"] | "all"> = [
  "all",
  "federal",
  "police",
  "biometric",
  "broker",
  "border",
  "fusion",
  "platform",
];

function riskVariant(r: PrivacySystem["risk"]) {
  if (r === "expanding") return "danger" as const;
  if (r === "contested") return "warn" as const;
  return "live" as const;
}

function PrivacyPage() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("all");
  const [openId, setOpenId] = useState<string | null>(PRIVACY_SYSTEMS[0]?.id ?? null);
  const systems = PRIVACY_SYSTEMS.filter((s) => cat === "all" || s.category === cat);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Desk 03</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Privacy invasion</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          A civilian atlas of how government watches the public — not a leak dump, not a conspiracy board. Each
          system here has a public-record path: a PIA, a contract, a court opinion, a transparency report, a FOIA
          desk.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} onClick={() => setCat(c)} className="capitalize">
              {c}
            </Button>
          ))}
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {systems.map((sys) => {
            const open = openId === sys.id;
            return (
              <article
                key={sys.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 text-left"
                  onClick={() => setOpenId(open ? null : sys.id)}
                >
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {sys.category}
                    </p>
                    <h2 className="mt-1 font-display text-2xl leading-tight">{sys.name}</h2>
                  </div>
                  <Badge variant={riskVariant(sys.risk)}>{sys.risk}</Badge>
                </button>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{sys.what}</p>
                {open && (
                  <dl className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Operated by
                      </dt>
                      <dd className="mt-1">{sys.whoOperates}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Coverage
                      </dt>
                      <dd className="mt-1">{sys.coverage}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Last public
                      </dt>
                      <dd className="mt-1">{sys.lastPublic}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        How a civilian sees it
                      </dt>
                      <dd className="mt-1">
                        <a href={sys.howToSeeUrl} target="_blank" rel="noreferrer" className="text-steel hover:underline">
                          {sys.howToSee}
                        </a>
                      </dd>
                    </div>
                  </dl>
                )}
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-2xl">Request your own file</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            FBI Identity History, DHS TRIP redress, Privacy Act requests, California Delete Act — the framework
            branch for first-party records.
          </p>
          <Button asChild className="mt-4">
            <Link to="/" search={{ node: "privacy-self" }}>
              Open records path
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
