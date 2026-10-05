import { useState, type ReactNode } from "react";
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
  ] },
  { label: "Tools", items: [
    { to: "/watchtower", label: "Watchtower", hint: "Places & infrastructure" },
    { to: "/signal", label: "Signal vs Record", hint: "Attention & evidence" },
    { to: "/veil", label: "VEIL", hint: "Briefing" },
    { to: "/titan", label: "Cell Titan", hint: "User-owned RF" },
  ] },
] as const;

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

  const hits = query.trim().length >= 2 ? searchNodes(FRAMEWORK, query).slice(0, 8) : [];

  function jump(id: string) {
    setQuery("");
    setFocused(false);
    setOpen(false);
    void navigate({ to: "/", search: { node: id, q: undefined, view: undefined } });
  }

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
              placeholder="Search the framework"
              className="h-9 border-border bg-card pl-9"
              aria-label="Search CIVINTELLIGENCE"
            />
            {focused && hits.length > 0 && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
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
                placeholder="Search the framework"
                className="h-10 pl-9"
              />
            </div>
            {hits.map(({ node, path }) => (
              <button
                key={node.id}
                type="button"
                className="flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2 text-left hover:bg-muted"
                onClick={() => jump(node.id)}
              >
                <span className="text-sm">{node.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {path.filter((p) => p !== "CIVWATCH").join(" / ")}
                </span>
              </button>
            ))}
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
