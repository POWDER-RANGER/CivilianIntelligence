import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  getCivintAlprSnapshot,
  snapshotAgeDays,
  summarizeAlpr,
  type CivintAlprSnapshot,
} from "@/lib/civint-feeds";

const STALE_AFTER_DAYS = 30;

/** Live ALPR snapshot from civint_ingest (OpenStreetMap). Renders nothing until the fetch settles. */
export function AlprPanel() {
  const [snap, setSnap] = useState<CivintAlprSnapshot | null>(null);

  useEffect(() => {
    let live = true;
    void getCivintAlprSnapshot().then((s) => {
      if (live) setSnap(s);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!snap) return null;

  if (snap.nodes.length === 0) {
    return (
      <section className="mt-8 rounded-xl border border-dashed border-border bg-card p-5">
        <h2 className="font-display text-2xl">Mapped license plate readers</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          No snapshot published yet. Generate one from a Geofabrik extract with{" "}
          <code className="font-mono text-xs">python ingest/civint_ingest.py osm --pbf iowa-latest.osm.pbf</code> and
          place <code className="font-mono text-xs">alpr_overpass.json</code> in{" "}
          <code className="font-mono text-xs">public/civint/</code>.
        </p>
      </section>
    );
  }

  const summary = summarizeAlpr(snap.nodes);
  const age = snapshotAgeDays(snap.asOf);
  const ageVariant = age === null ? "outline" : age > STALE_AFTER_DAYS ? "warn" : "live";
  const ageLabel = age === null ? "extract date unknown" : age === 0 ? "extract from today" : `extract ${age}d old`;

  return (
    <section className="mt-8 rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-display text-2xl">Mapped license plate readers</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            OpenStreetMap nodes tagged <span className="font-mono">surveillance:type=ALPR</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="steel">{summary.total.toLocaleString("en-US")} mapped</Badge>
          <Badge variant={ageVariant}>{ageLabel}</Badge>
        </div>
      </header>

      <div className="grid gap-px border-b border-border bg-border sm:grid-cols-3">
        <div className="bg-card p-4">
          <p className="font-display text-2xl leading-none text-steel">{summary.total.toLocaleString("en-US")}</p>
          <p className="mt-1 text-xs font-medium">Mapped points</p>
        </div>
        <div className="bg-card p-4">
          <p className="font-display text-2xl leading-none text-steel">{summary.withOperator.toLocaleString("en-US")}</p>
          <p className="mt-1 text-xs font-medium">Name an operator</p>
        </div>
        <div className="bg-card p-4">
          <p className="font-display text-2xl leading-none text-steel">{summary.withDirection.toLocaleString("en-US")}</p>
          <p className="mt-1 text-xs font-medium">Record a facing direction</p>
        </div>
      </div>

      {summary.operators.length > 0 && (
        <ul className="divide-y divide-border">
          {summary.operators.map((o) => (
            <li key={o.name} className="flex items-center justify-between px-5 py-2.5 text-sm">
              <span>{o.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{o.count.toLocaleString("en-US")}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
        Crowd-mapped, so this is a floor, not an inventory: unmapped cameras are not counted, and operator tags are
        volunteer-entered. © OpenStreetMap contributors (ODbL).
      </p>
    </section>
  );
}
