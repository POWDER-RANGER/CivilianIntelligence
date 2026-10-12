import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Eye, Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FRAMEWORK } from "@/data/catalog";
import { searchNodes } from "@/lib/intel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const NAV_GROUPS = [
  { label: "Start", items: [
    { to: "/", label: "Open Desk", hint: "Local context & map" },
    { to: "/place", label: "Place Dossier", hint: "Who watches an address" },
    { to: "/toolkit", label: "Toolkit", hint: "Request & verify" },
  ] },
  { label: "Desks", items: [
    { to: "/finance", label: "Finance", hint: "Money & filings" },
    { to: "/privacy", label: "Privacy", hint: "How systems watch" },
    { to: "/movement", label: "Movement", hint: "Government activity" },
    { to: "/oversight", label: "Oversight", hint: "Money, ethics & FOIA" },
  ] },
  { label: "Libraries", items: [
    { to: "/reading-room", label: "Reading Room", hint: "Declassified records" },
    { to: "/records", label: "Record Index", hint: "Find the record" },
    { to: "/sources", label: "Sources", hint: "Public source registry" },
    { to: "/github-reading-room", label: "GitHub Reading Room", hint: "Inspect repositories safely" },
  ] },
  { label: "Tools", items: [
    { to: "/watchtower", label: "Watchtower", hint: "Places & infrastructure" },
    { to: "/globe", label: "Global View", hint: "God's Eye 3D globe" },
    { to: "/signal", label: "Signal vs Record", hint: "Attention & evidence" },
    { to: "/veil", label: "VEIL", hint: "Briefing" },
    { to: "/titan", label: "Cell Titan", hint: "User-owned RF" },
  ] },
] as const;

type NavItem = (typeof NAV_GROUPS)[number]["items"][number];
const NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((group) => [...group.items] as NavItem[]);

export function AppShell({
  children,
  flush = false,
}: {
  children: ReactNode;
  flush?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  // Live audit P1-12: the box only matched framework nodes, gave no feedback on
  // a miss, and Enter did nothing. It now matches desks too, always offers a
  // Record Index search, and Enter takes the first result.
  const term = query.trim();
  const needle = term.toLowerCase();
  const deskHits = term.length >= 2
    ? NAV_ITEMS.filter((item) =>
        `${item.label} ${item.hint}`.toLowerCase().includes(needle),
      ).slice(0, 4)
    : [];
  const hits = term.length >= 2 ? searchNodes(FRAMEWORK, query).slice(0, 6) : [];

  function reset() {
    setQuery("");
    setFocused(false);
    setOpen(false);
  }

  function jump(id: string) {
    reset();
    void navigate({ to: "/", search: { node: id, q: undefined, view: undefined } });
  }

  function goDesk(to: NavItem["to"]) {
    reset();
    void navigate({ to });
  }

  function searchRecords() {
    if (term.length < 2) return;
    const q = term;
    reset();
    void navigate({ to: "/records", search: { q } });
  }

  function onSearchKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") return reset();
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (deskHits[0]) goDesk(deskHits[0].to);
    else if (hits[0]) jump(hits[0].node.id);
    else searchRecords();
  }

  const results = term.length >= 2 && (
    <>
      {deskHits.map((item) => (
        <button
          key={item.to}
          type="button"
          className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => goDesk(item.to)}
        >
          <span className="text-sm text-foreground">{item.label}</span>
          <span className="text-[11px] text-muted-foreground">Desk · {item.hint}</span>
        </button>
      ))}
      {hits.map(({ node, path }) => (
        <button
          key={node.id}
          type="button"
          className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => jump(node.id)}
        >
          <span className="text-sm text-foreground">{node.name}</span>
          <span className="text-[11px] text-muted-foreground">
            {path.filter((p) => p !== "CIVWATCH").join(" / ")}
          </span>
        </button>
      ))}
      <button
        type="button"
        className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm hover:bg-muted"
        onMouseDown={(e) => e.preventDefault()}
        onClick={searchRecords}
      >
        <Search className="size-3.5 text-muted-foreground" />
        <span>
          Search the Record Index for <strong className="font-medium">“{term}”</strong>
        </span>
      </button>
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-sm border border-border">
              <Eye className="size-3.5 text-steel" strokeWidth={1.75} />
            </span>
            <span className="font-display text-xl leading-none tracking-tight">CIVINTELLIGENCE</span>

          </Link>

          <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {NAV_GROUPS.map((group) => {
              const active = group.items.some((item) => item.to === "/" ? pathname === "/" : pathname.startsWith(item.to));
              return (
                <details key={group.label} className="group relative">
                  <summary className={cn(
                    "cursor-pointer list-none rounded-md px-3 py-2 text-sm transition-colors [&::-webkit-details-marker]:hidden",
                    active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}>{group.label}</summary>
                  <div className="absolute left-0 top-full z-50 mt-1 min-w-56 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
                    {group.items.map((item) => (
                      <Link key={item.to} to={item.to} className={cn(
                        "flex flex-col rounded-md px-3 py-2 hover:bg-muted",
                        (item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)) ? "bg-muted" : "",
                      )}>
                        <span className="text-sm text-foreground">{item.label}</span>
                        <span className="text-[11px] text-muted-foreground">{item.hint}</span>
                      </Link>
                    ))}
                  </div>
                </details>
              );
            })}
          </nav>

          <div className="relative ml-auto hidden min-w-0 max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 180)}
              onKeyDown={onSearchKey}
              placeholder="Search desks, sources, records"
              className="h-9 border-border bg-card pl-9"
              aria-label="Search CIVINTELLIGENCE"
            />
            {focused && term.length >= 2 && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                {results}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>

        {open && (
          <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKey}
                placeholder="Search desks, sources, records"
                aria-label="Search CIVINTELLIGENCE"
                className="h-10 pl-9"
              />
            </div>
            {term.length >= 2 && <div className="overflow-hidden rounded-lg border border-border">{results}</div>}
            <nav className="mt-2 grid gap-4" aria-label="Main navigation">
              {NAV_GROUPS.map((group) => (
                <section key={group.label}>
                  <h2 className="px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{group.label}</h2>
                  <div className="grid gap-0.5">
                    {group.items.map((item) => (
                      <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="flex items-baseline justify-between rounded-md px-2 py-2.5 hover:bg-muted">
                        <span>{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.hint}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </nav>
          </div>
        )}
      </header>

      <div className="border-b border-border bg-card">
        <p className="mx-auto max-w-[1600px] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Unclassified // public records // civilian access
        </p>
      </div>

      <main className={cn("flex min-h-0 flex-1 flex-col", flush ? "lg:overflow-hidden" : "")}>{children}</main>
    </div>
  );
}
