import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";
import { ExternalLink, FileSearch, History, Link2, ShieldCheck } from "lucide-react";

type Dossier = {
  record: {
    id: string;
    sourceRecordId: string;
    kind: string;
    title: string;
    agency: string | null;
    identifiers: string[];
    entities: string[];
    publishedAt: string | null;
    updatedAt: string | null;
    source: { id: string; name: string; originalUrl: string };
    sourceUrl: string;
    retrievedAt: string;
    retrievalMethod: string;
    contentHash: string;
    hashBasis: string;
    adapterVersion: string;
    bodyRef: string | null;
  };
  edges: Array<{ fromRecordId: string; toRecordId: string; edgeType: string; basis: string; tier: string }>;
  versions: Array<{ contentHash: string; hashBasis: string; retrievedAt: string; retrievalMethod: string; adapterVersion: string; bodyRef: string | null }>;
};

export const Route = createFileRoute("/records/$id")({ component: RecordDossierPage });

function RecordDossierPage() {
  const { id } = Route.useParams();
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [state, setState] = useState<"loading" | "available" | "not-found" | "unavailable">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/civint/records/" + encodeURIComponent(id), { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { dossier?: Dossier; state?: string };
        if (response.status === 404) {
          setState("not-found");
          return;
        }
        if (!response.ok || !payload.dossier) throw new Error(payload.state ?? "unavailable");
        setDossier(payload.dossier);
        setState("available");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState("unavailable");
      });
    return () => controller.abort();
  }, [id]);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {state === "loading" && <p className="text-sm text-muted-foreground">Loading the record dossier...</p>}
        {state === "not-found" && (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <FileSearch className="mx-auto size-7 text-muted-foreground" />
            <h1 className="mt-3 font-display text-3xl">Record not found in the CIVINT index.</h1>
            <p className="mt-2 text-sm text-muted-foreground">The index is not being treated as proof that no source record exists.</p>
            <Link to="/records" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">Return to Record Index</Link>
          </div>
        )}

        {state === "unavailable" && <p className="text-sm text-muted-foreground">The record service is unavailable. No substitute text is shown.</p>}

        {state === "available" && dossier && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-4xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">CIVINT Record Dossier</p>
                <h1 className="mt-2 font-display text-4xl md:text-5xl">{dossier.record.title}</h1>
                <p className="mt-3 text-sm text-muted-foreground">{dossier.record.agency ?? "Agency not specified"} · {dossier.record.kind}</p>
              </div>
              <Badge variant="outline">{dossier.record.hashBasis === "document" ? "Document hash" : "Observation hash"}</Badge>
            </div>

            <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <FileSearch className="mt-0.5 size-5 text-primary" />
                  <div>
                    <h2 className="font-display text-2xl">The record</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      CIVINT context is intentionally limited here. The source document is not replaced by a model-generated explanation.
                    </p>
                    <a href={dossier.record.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                      Open official/source record
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="size-5 text-primary" />
                  <div>
                    <h2 className="font-display text-2xl">Provenance</h2>
                    <dl className="mt-3 space-y-2 text-xs">
                      <div><dt className="text-muted-foreground">Source</dt><dd>{dossier.record.source.name}</dd></div>
                      <div><dt className="text-muted-foreground">Source record ID</dt><dd className="break-all font-mono">{dossier.record.sourceRecordId}</dd></div>
                      <div><dt className="text-muted-foreground">Retrieved</dt><dd>{dossier.record.retrievedAt}</dd></div>
                      <div><dt className="text-muted-foreground">Method</dt><dd>{dossier.record.retrievalMethod}</dd></div>
                      <div><dt className="text-muted-foreground">Adapter</dt><dd>{dossier.record.adapterVersion}</dd></div>
                      <div><dt className="text-muted-foreground">Hash basis</dt><dd>{dossier.record.hashBasis}</dd></div>
                      <div><dt className="text-muted-foreground">SHA-256</dt><dd className="break-all font-mono">{dossier.record.contentHash}</dd></div>
                    </dl>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">CIVINT context</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Everything on this panel is CIVINT-authored metadata: classification, indexing, provenance presentation, and relationships. It is not source text and should not be mistaken for the publisher's statement.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {dossier.record.identifiers.map((identifier) => <Badge key={identifier} variant="outline">{identifier}</Badge>)}
                {dossier.record.entities.map((entity) => <Badge key={"entity-" + entity} variant="outline">{entity}</Badge>)}
              </div>
            </section>

            <section className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2"><Link2 className="size-4 text-primary" /><h2 className="font-display text-2xl">Related records</h2></div>
                <div className="mt-4 space-y-3">
                  {dossier.edges.length ? dossier.edges.map((edge) => {
                    const otherId = edge.fromRecordId === dossier.record.id ? edge.toRecordId : edge.fromRecordId;
                    return (
                      <Link key={edge.fromRecordId + "-" + edge.toRecordId + "-" + edge.edgeType} to="/records/$id" params={{ id: otherId }} className="block rounded-lg border border-border p-3 hover:bg-muted">
                        <div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="outline">{edge.tier}</Badge><span className="text-xs text-muted-foreground">{edge.edgeType}</span></div>
                        <p className="mt-2 text-sm font-medium">Record {otherId}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{edge.basis}</p>
                      </Link>
                    );
                  }) : <p className="text-sm text-muted-foreground">No typed relationships have been established yet.</p>}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2"><History className="size-4 text-primary" /><h2 className="font-display text-2xl">Change history</h2></div>
                <div className="mt-4 space-y-3">
                  {dossier.versions.map((version) => (
                    <div key={version.contentHash} className="rounded-lg border border-border p-3">
                      <p className="font-mono break-all text-[11px]">{version.contentHash}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{version.hashBasis} · {version.retrievedAt} · {version.retrievalMethod} · {version.adapterVersion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
