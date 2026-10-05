import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Library, Search, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/reading-room")({ component: ReadingRoomPage });

const COLLECTIONS = [
  {
    title: "CREST: 25-Year Program Archive",
    description: "The core historical release collection: declassified CIA records covering intelligence, Cold War history, science and technology, operations, analysis, and related subjects.",
    tags: ["CREST", "declassified", "historical"],
    url: "https://www.cia.gov/readingroom/collection/crest-25-year-program-archive",
  },
  {
    title: "Declassified Documents Related to 9/11",
    description: "CIA-released records concerning the Agency's performance and activities surrounding the September 11 attacks.",
    tags: ["9/11", "oversight", "CIA"],
    url: "https://www.cia.gov/readingroom/collection/declassified-documents-related-911-attacks",
  },
  {
    title: "Former Detention & Interrogation Program",
    description: "A public collection of declassified records related to the former CIA detention and interrogation program.",
    tags: ["FOIA", "detention", "interrogation"],
    url: "https://www.cia.gov/readingroom/collection/documents-related-former-detention-and-interrogation-program",
  },
  {
    title: "President's Daily Brief: Nixon & Ford",
    description: "A historical collection of President's Daily Brief material released from the Nixon and Ford administrations.",
    tags: ["PDB", "Nixon", "Ford"],
    url: "https://www.cia.gov/readingroom/presidents-daily-brief",
  },
  {
    title: "STAR GATE",
    description: "Declassified records associated with the STAR GATE remote-viewing research program. CIVINT treats the records as historical evidence, not validation of their underlying claims.",
    tags: ["STAR GATE", "science", "historical"],
    url: "https://www.cia.gov/readingroom/search/site/STAR%20GATE",
  },
  {
    title: "Studies in Intelligence",
    description: "Declassified articles from the CIA's professional intelligence journal, useful for understanding historical methods, institutions, and analytic practice.",
    tags: ["analysis", "history", "journal"],
    url: "https://www.cia.gov/readingroom/collection/declassified-articles-studies-intelligence",
  },
] as const;

const SEARCH_TIPS = [
  ["Start broad", "Use a person, program, place, agency, or document number before adding date or collection filters."],
  ["Use exact phrases", "Put distinctive names or program titles in quotes when the Reading Room search supports phrase matching."],
  ["Try identifiers", "CIA document numbers and ESDN-style identifiers can be more precise than topic words."],
  ["Treat results as records", "A search hit is evidence that a document exists; read the original document and its metadata before drawing conclusions."],
];

function ReadingRoomPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Public record library</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">Reading Room</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A civilian-friendly index to declassified intelligence records. CIVINT organizes discovery and context;
              the releasing institution remains the source of record.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
            <ShieldCheck className="size-4 text-primary" />
            <span className="text-xs text-muted-foreground">Public / declassified records</span>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2"><Search className="size-5" /></div>
            <div>
              <h2 className="font-display text-2xl">Search the official Reading Room</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                CIA's Electronic Reading Room provides full-text search across its declassified material. CIVINT starts
                with a guided index here, then sends you to the official search when the primary catalog is the right tool.
              </p>
              <a
                href="https://www.cia.gov/readingroom/search/site/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Open CIA Reading Room search
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Curated collections</p>
              <h2 className="mt-1 font-display text-2xl">Start with the records</h2>
            </div>
            <Badge variant="outline">{COLLECTIONS.length} entry points</Badge>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {COLLECTIONS.map((collection) => (
              <a
                key={collection.title}
                href={collection.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-lg bg-muted p-2"><Library className="size-4 text-primary" /></div>
                  <ExternalLink className="size-4 text-muted-foreground transition group-hover:text-foreground" />
                </div>
                <h3 className="mt-4 font-display text-xl">{collection.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{collection.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {collection.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Search practice</p>
            <h2 className="mt-1 font-display text-2xl">Find better records</h2>
            <div className="mt-4 grid gap-3">
              {SEARCH_TIPS.map(([title, text]) => (
                <div key={title} className="rounded-lg bg-muted/60 p-3">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Provenance</p>
            <h2 className="mt-1 font-display text-2xl">Keep the source visible</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              These materials are public releases. CIVINT does not turn a declassified document into a new factual
              claim merely by indexing it. Source agency, collection, document metadata, publication context, and the
              original file remain part of the evidence chain.
            </p>
            <a
              href="https://www.cia.gov/readingroom/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              CIA Electronic Reading Room
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
