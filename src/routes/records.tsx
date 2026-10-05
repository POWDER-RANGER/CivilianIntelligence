import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/layout/app-shell";
import { FileSearch, Search } from "lucide-react";
import { rememberRecentRecord } from "@/lib/recent-records";

type RecordResult = {
  id: string;
  title: string;
  kind: string;
  agency: string | null;
  identifiers: string[];
  publishedAt: string | null;
  retrievedAt: string;
  source: { id: string; name: string; originalUrl: string };
  matchReason: string;
};

export const Route = createFileRoute("/records")({ component: RecordsPage });

function RecordsPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "available" | "empty" | "unavailable">("idle");
  const [results, setResults] = useState<RecordResult[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    if (!submitted.trim()) {
      setResults([]);
      setState("idle");
      return () => controller.abort();
    }

    setState("loading");
    fetch("/api/civint/records/search?q=" + encodeURIComponent(submitted), { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { results?: RecordResult[]; state?: string };
        if (!response.ok) throw new Error(payload.state ?? "unavailable");
        setResults(payload.results ?? []);
        setState(payload.results?.length ? "available" : "empty");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState("unavailable");
      });

    return () => controller.abort();
  }, [submitted]);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Evidence layer</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">Record Index</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Find the record, then read it yourself. Search returns pointers into the CIVINT index; it does not replace the source with a summary.
          </p>
        </div>

        <form
          className="mt-8 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(query.trim());
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records, agencies, identifiers..." className="h-11 pl-9" />
          </div>
          <button type="submit" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground">
            Search
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
          Search order: exact identifier → PostgreSQL full-text → structured filters. Semantic/vector retrieval is reserved for a later phase and will be labeled as a similarity match.
        </div>

        {state === "idle" && (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <FileSearch className="mx-auto size-7 text-muted-foreground" />
            <h2 className="mt-3 font-display text-2xl">Start with the question, finish with the document.</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              No records are invented for the empty state. When adapters begin writing to the index, each result will carry its source, retrieval time, method, and hash.
            </p>
          </div>
        )}

        {state === "loading" && <p className="mt-6 text-sm text-muted-foreground">Searching the indexed record metadata...</p>}
        {state === "unavailable" && <p className="mt-6 text-sm text-muted-foreground">The Record Index is unavailable. No synthetic results are shown.</p>}
        {state === "empty" && (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <h2 className="font-display text-2xl">No matching indexed record found.</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
              This does not establish that no record exists. CIVINT may not have the relevant source, document, or indexing coverage yet.
            </p>
            <Link to="/toolkit" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">Open Toolkit for a public-record request</Link>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6 space-y-3">
            {results.map((record) => (
              <Link key={record.id} to="/records/$id" params={{ id: record.id }} onClick={() => rememberRecentRecord({ id: record.id, title: record.title, kind: record.kind, sourceName: record.source.name })} className="block rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl">{record.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{record.agency ?? "Agency not specified"} · {record.source.name} · {record.kind}</p>
                  </div>
                  <Badge variant="outline">{record.matchReason}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {record.identifiers.slice(0, 5).map((identifier) => <Badge key={identifier} variant="outline">{identifier}</Badge>)}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">Published {record.publishedAt ?? "—"} · Retrieved {record.retrievedAt}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
