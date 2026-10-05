import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Eye, Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FRAMEWORK } from "@/data/catalog";
import { searchNodes } from "@/lib/intel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Framework", hint: "Start here" },
  { to: "/watchtower", label: "Watchtower", hint: "Places & infrastructure" },
  { to: "/finance", label: "Finance", hint: "Money & filings" },
  { to: "/privacy", label: "Privacy", hint: "How systems watch" },
  { to: "/sources", label: "Sources", hint: "Live data registry" },
  { to: "/toolkit", label: "Toolkit", hint: "Request & verify" },
  { to: "/titan", label: "Cell Titan", hint: "User-owned RF" },
  { to: "/veil", label: "VEIL", hint: "Briefing" },
  { to: "/signal", label: "Signal vs Record", hint: "Attention & evidence" },
  { to: "/movement", label: "Movement", hint: "Government activity" },
  { to: "/oversight", label: "Oversight", hint: "Money, ethics & FOIA" },
  { to: "/reading-room", label: "Reading Room", hint: "Declassified records" },
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

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
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
            <nav className="mt-2 grid gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline justify-between rounded-md px-2 py-2.5 hover:bg-muted"
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.hint}</span>
                </Link>
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
