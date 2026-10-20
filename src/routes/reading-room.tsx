import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, ExternalLink, FileText, Library, Search, ShieldCheck, X } from "lucide-react";

export const Route = createFileRoute("/reading-room")({ component: ReadingRoomPage });

type LibraryEntry = {
  id: "cia" | "fbi" | "state" | "dhs" | "nsa" | "dia";
  name: string;
  agency: string;
  tier: "Core" | "Secondary";
  description: string;
  tags: string[];
  url: string;
  searchUrl: string;
  searchLabel: string;
};

const LIBRARIES: LibraryEntry[] = [
  {
    id: "cia",
    name: "CIA Electronic Reading Room",
    agency: "Central Intelligence Agency",
    tier: "Core",
    description: "A large declassified-record collection spanning intelligence history, Cold War material, science and technology, operations, analysis, and major historical collections.",
    tags: ["CREST", "declassified", "historical"],
    url: "https://www.cia.gov/readingroom/",
    searchUrl: "https://www.cia.gov/readingroom/search/site/",
    searchLabel: "Search Reading Room",
  },
  {
    id: "fbi",
    name: "FBI Vault",
    agency: "Federal Bureau of Investigation",
    tier: "Core",
    description: "The FBI's public FOIA library with searchable records, alphabetical browsing, categories, proactive disclosures, discretionary releases, and frequently requested material.",
    tags: ["FOIA", "frequently requested", "categories"],
    url: "https://vault.fbi.gov/",
    searchUrl: "https://vault.fbi.gov/search",
    searchLabel: "Search Vault",
  },
  {
    id: "state",
    name: "FOIA Virtual Reading Room",
    agency: "U.S. Department of State",
    tier: "Core",
    description: "Searchable State Department releases, including litigation records and proactively disclosed foreign-policy material such as historical cables.",
    tags: ["foreign policy", "cables", "FOIA"],
    url: "https://foia.state.gov/Search/Search.aspx",
    searchUrl: "https://foia.state.gov/Search/Search.aspx",
    searchLabel: "Search released records",
  },
  {
    id: "dhs",
    name: "DHS FOIA Library",
    agency: "Department of Homeland Security",
    tier: "Core",
    description: "A multi-component collection covering DHS and participating components, with frequently requested records, FOIA logs, policy material, and high-interest releases.",
    tags: ["DHS", "components", "FOIA"],
    url: "https://www.dhs.gov/publications-library/collections/foia-library",
    searchUrl: "https://www.dhs.gov/publications?combine=&field_collections_target_id=All&field_taxonomy_topics_target_id=All&items_per_page=10",
    searchLabel: "Browse DHS library",
  },
  {
    id: "nsa",
    name: "NSA Reading Room",
    agency: "National Security Agency",
    tier: "Secondary",
    description: "NSA's FOIA reading room for required public records, frequently requested information, FOIA reports and releases, and agency policy material.",
    tags: ["NSA", "policy", "FOIA"],
    url: "https://www.nsa.gov/Helpful-Links/NSA-FOIA/Reading-Room/",
    searchUrl: "https://www.nsa.gov/Helpful-Links/NSA-FOIA/Reading-Room/",
    searchLabel: "Open Reading Room",
  },
  {
    id: "dia",
    name: "DIA FOIA Electronic Reading Room",
    agency: "Defense Intelligence Agency",
    tier: "Secondary",
    description: "DIA's electronic reading room with records selected for FOIA publication, including documents requested repeatedly and other public releases.",
    tags: ["DIA", "intelligence", "FOIA"],
    url: "https://www.dia.mil/FOIA.aspx",
    searchUrl: "https://www.dia.mil/FOIA.aspx",
    searchLabel: "Open DIA library",
  },
];

const CIA_COLLECTIONS = [
  {
    title: "CREST: 25-Year Program Archive",
    description: "Declassified CIA records covering intelligence, Cold War history, science and technology, operations, analysis, and related subjects.",
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
    description: "Declassified records associated with the STAR GATE remote-viewing research program. CIVWATCH treats the records as historical evidence, not validation of their underlying claims.",
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


type ReaderTarget = {
  title: string;
  url: string;
  sourceHost: string;
  kind: "portal" | "document";
};

/**
 * Accept only direct HTTPS links on official .gov/.mil hosts for the in-app
 * reader. The browser loads the original URL; CIVINT does not proxy, rewrite,
 * or persist the source content.
 */
function officialSourceUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    const hostname = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      (url.port && url.port !== "443") ||
      !(hostname.endsWith(".gov") || hostname.endsWith(".mil")) ||
      hostname === "gov" ||
      hostname === "mil"
    ) return null;
    return url;
  } catch {
    return null;
  }
}

const SEARCH_TIPS = [
  ["Start broad", "Use a person, program, place, agency, or document number before adding date or collection filters."],
  ["Use exact phrases", "Put distinctive names or program titles in quotes when the source search supports phrase matching."],
  ["Try identifiers", "Agency document numbers, case numbers, and collection identifiers can be more precise than topic words."],
  ["Cross-check agencies", "A topic may appear in multiple reading rooms. Compare release dates, originating agency, document metadata, and redactions."],
  ["Treat results as records", "A search hit proves a document exists in a public collection; it does not by itself prove every assertion inside the document."],
];

function ReadingRoomPage() {
  const [searchSourceId, setSearchSourceId] = useState<LibraryEntry["id"]>("cia");
  const [sourceQuery, setSourceQuery] = useState("");
  const [documentUrlInput, setDocumentUrlInput] = useState("");
  const [readerError, setReaderError] = useState("");
  const [activeReader, setActiveReader] = useState<ReaderTarget | null>(null);

  function openLibraryInReader(library: LibraryEntry) {
    const query = sourceQuery.trim();
    let url = new URL(library.searchUrl);
    if (library.id === "cia" && query) {
      url = new URL(library.searchUrl.replace(/\\/?$/, "/") + encodeURIComponent(query));
    } else if (library.id === "fbi" && query) {
      url.searchParams.set("SearchableText", query);
    }
    setReaderError("");
    setActiveReader({
      title: library.name + (query ? " — " + query : ""),
      url: url.href,
      sourceHost: url.hostname,
      kind: "portal",
    });
  }

  function openDirectDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = officialSourceUrl(documentUrlInput);
    if (!url) {
      setReaderError("Enter a valid HTTPS URL on an official .gov or .mil domain. The reader does not accept third-party hosts.");
      return;
    }
    setReaderError("");
    setActiveReader({
      title: "Official record",
      url: url.href,
      sourceHost: url.hostname,
      kind: "document",
    });
  }

  function closeReader() {
    setActiveReader(null);
    setReaderError("");
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">Public record library</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">Reading Room</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A civilian-friendly index to federal FOIA libraries and declassified collections. CIVWATCH organizes
              discovery and context; the releasing institution remains the source of record.
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
              <h2 className="font-display text-2xl">Search the source library</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Start with the CIVWATCH index to choose the right federal collection. Search and document retrieval remain
                tied to the official publisher so provenance, metadata, and the original record stay visible.
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


        <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">In-app access</p>
              <h2 className="mt-1 font-display text-2xl">Official source desk</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Search CIA and FBI public collections inside CIVINT, or open a direct record/PDF from an official government source here.
                Documents load from the publisher’s URL; CIVINT does not alter or store a second copy. Use the original-source link to verify the record independently.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              HTTPS .gov / .mil only
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <form
              className="rounded-xl border border-border bg-background p-4"
              onSubmit={(event) => {
                event.preventDefault();
                const library = LIBRARIES.find((item) => item.id === searchSourceId);
                if (library) openLibraryInReader(library);
              }}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Search an official portal</h3>
              </div>
              <label className="mt-3 block text-xs font-medium text-muted-foreground" htmlFor="reading-room-source">
                Agency library
              </label>
              <select
                id="reading-room-source"
                value={searchSourceId}
                onChange={(event) => setSearchSourceId(event.target.value as LibraryEntry["id"])}
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground"
              >
                {LIBRARIES.map((library) => (
                  <option key={library.id} value={library.id}>{library.name}</option>
                ))}
              </select>
              <label className="mt-3 block text-xs font-medium text-muted-foreground" htmlFor="reading-room-query">
                Search term (CIA/FBI searches are prefilled; other portals open their official search page)
              </label>
              <input
                id="reading-room-query"
                value={sourceQuery}
                onChange={(event) => setSourceQuery(event.target.value)}
                placeholder="Program, person, case or document identifier"
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button type="submit" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Open portal inside CIVINT <BookOpen className="size-4" />
              </button>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Some agencies restrict framing. When an official portal will not display here, use the original-source link on its library card.
              </p>
            </form>

            <form className="rounded-xl border border-border bg-background p-4" onSubmit={openDirectDocument}>
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Open a specific record or PDF</h3>
              </div>
              <label className="mt-3 block text-xs font-medium text-muted-foreground" htmlFor="reading-room-document-url">
                Official document URL
              </label>
              <input
                id="reading-room-document-url"
                value={documentUrlInput}
                onChange={(event) => setDocumentUrlInput(event.target.value)}
                placeholder="https://www.cia.gov/readingroom/document/..."
                inputMode="url"
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button type="submit" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">
                Read inside CIVINT <FileText className="size-4" />
              </button>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                A direct PDF URL usually gives the cleanest reading experience. This field accepts only HTTPS .gov/.mil hosts and does not route content through a CIVINT file proxy.
              </p>
            </form>
          </div>

          {readerError && (
            <p role="alert" className="mt-4 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              {readerError}
            </p>
          )}

          {activeReader && (
            <section className="mt-5 overflow-hidden rounded-xl border border-border bg-background" aria-label="Official source viewer">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{activeReader.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Loaded directly from {activeReader.sourceHost} · {activeReader.kind === "document" ? "record/document URL" : "official portal"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <a href={activeReader.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-muted">
                    Verify original <ExternalLink className="size-3.5" />
                  </a>
                  <button type="button" onClick={closeReader} aria-label="Close official source viewer" className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-card hover:bg-muted">
                    <X className="size-4" />
                  </button>
                </div>
              </header>
              <div className="h-[65dvh] min-h-[380px] bg-card sm:min-h-[520px]">
                <iframe
                  key={activeReader.url}
                  title={activeReader.title}
                  src={activeReader.url}
                  className="size-full border-0 bg-card"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  sandbox="allow-forms allow-scripts allow-same-origin allow-downloads"
                />
              </div>
              <footer className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                The publisher controls document availability and framing policy. CIVINT does not claim a local hash or byte-for-byte verification because the file is not mirrored here. Use “Verify original” to inspect the same source URL directly; if the viewer is blank or blocked, the source may prohibit embedding.
              </footer>
            </section>
          )}
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">Federal libraries</p>
              <h2 className="mt-1 font-display text-2xl">Where the records live</h2>
            </div>
            <Badge variant="outline">{LIBRARIES.length} indexed libraries</Badge>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {LIBRARIES.map((library) => (
              <article
                key={library.name}
                className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-lg bg-muted p-2"><Library className="size-4 text-primary" /></div>
                  <Badge variant={library.tier === "Core" ? "default" : "outline"}>{library.tier}</Badge>
                </div>
                <h3 className="mt-4 font-display text-xl">{library.name}</h3>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{library.agency}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{library.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {library.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openLibraryInReader(library)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    View inside CIVINT <BookOpen className="size-3.5" />
                  </button>
                  <a href={library.searchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline">
                    {library.searchLabel} <ExternalLink className="size-3.5" />
                  </a>
                  <a href={library.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline">
                    Source home <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">CIA collections</p>
              <h2 className="mt-1 font-display text-2xl">Start with high-value collections</h2>
            </div>
            <Badge variant="outline">{CIA_COLLECTIONS.length} entry points</Badge>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {CIA_COLLECTIONS.map((collection) => (
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
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">Search practice</p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">CIVWATCH principle</p>
            <h2 className="mt-1 font-display text-2xl">Remove UI dependency, not attribution</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The long-term goal is a searchable evidence layer: normalized metadata, document dossiers, cross-desk
              relationships, and eventually full-text search for selected collections. CIVWATCH should make records easier
              to find without pretending to be the releasing agency or silently replacing the original record.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">Source agency</Badge>
              <Badge variant="outline">Collection</Badge>
              <Badge variant="outline">Document metadata</Badge>
              <Badge variant="outline">Publication context</Badge>
              <Badge variant="outline">Original file</Badge>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
