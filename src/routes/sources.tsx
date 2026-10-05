import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Database, ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { SOURCES } from "@/lib/sources";

export const Route = createFileRoute("/sources")({ component: SourcesPage });

function SourcesPage() {
  const groups = [...new Set(SOURCES.map((source) => source.category))];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Evidence infrastructure</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Source registry</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Inspect the public sources CIVINT is designed to use, how each source is accessed, and where its original records live.
          Listing a source does not mean its feed is currently healthy or that its records have been indexed.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge variant="outline">{SOURCES.length} registered sources</Badge>
          <Badge variant="outline">Provenance first</Badge>
          <Badge variant="outline">Original sources remain authoritative</Badge>
        </div>

        <div className="mt-8 space-y-8">
          {groups.map((category) => {
            const sources = SOURCES.filter((source) => source.category === category);
            return (
              <section key={category}>
                <div className="mb-3 flex items-center gap-2">
                  <Database className="size-4 text-muted-foreground" />
                  <h2 className="font-display text-xl capitalize">{category}</h2>
                  <span className="font-mono text-xs text-muted-foreground">{sources.length}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {sources.map((source) => (
                    <article key={source.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium">{source.name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{source.attribution}</p>
                        </div>
                        <Badge variant="outline">{source.accessMethod}</Badge>
                      </div>
                      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground">CIVINT surface</dt>
                          <dd className="mt-1">{source.nativeSurface}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Update cadence</dt>
                          <dd className="mt-1">{source.cadence}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-muted-foreground">Access / reuse notes</dt>
                          <dd className="mt-1 leading-relaxed">{source.license}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                        <a href={source.endpoint} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90">
                          Open source <ArrowUpRight className="size-3.5" />
                        </a>
                        <a href={source.healthcheckUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs hover:bg-muted">
                          Source home / status <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        <p className="mt-8 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
          Registry entries describe intended source integrations. Feed health, successful retrieval, indexing, and document availability are separate states and should be verified independently.
        </p>
      </div>
    </AppShell>
  );
}
