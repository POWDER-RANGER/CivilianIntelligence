import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { List, Network } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { IntelList, IntelTree } from "@/components/framework/intel-tree";
import { NodePanel } from "@/components/framework/node-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FRAMEWORK, DEFAULT_EXPANDED } from "@/data/catalog";
import { MARKER_LEGEND, countLeaves, findNode, flatten, pathTo, searchNodes, type Marker } from "@/lib/intel";

type View = "tree" | "index";

type Search = {
  node?: string;
  q?: string;
  view?: View;
};

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    node: typeof s.node === "string" ? s.node : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
    view: s.view === "index" ? "index" : s.view === "tree" ? "tree" : undefined,
  }),
  component: Home,
});

function Home() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(DEFAULT_EXPANDED));
  const [selectedId, setSelectedId] = useState<string>(search.node ?? "civwatch");
  const [view, setView] = useState<View>(search.view ?? "tree");

  const selected = findNode(FRAMEWORK, selectedId) ?? FRAMEWORK;
  const crumb = (pathTo(FRAMEWORK, selectedId) ?? [FRAMEWORK]).map((n) => n.name);
  const total = countLeaves(FRAMEWORK);

  const matchIds = useMemo(() => {
    if (!search.q) return undefined;
    const hits = searchNodes(FRAMEWORK, search.q);
    return new Set(hits.flatMap((h) => (pathTo(FRAMEWORK, h.node.id) ?? []).map((n) => n.id)));
  }, [search.q]);

  useEffect(() => {
    if (!search.node) return;
    const path = pathTo(FRAMEWORK, search.node);
    if (!path) return;
    setSelectedId(search.node);
    setExpanded((prev) => {
      const next = new Set(prev);
      path.forEach((n) => next.add(n.id));
      return next;
    });
  }, [search.node]);

  function toggle(id: string) {
    if (id === "civwatch") return;
    setExpanded((prev) => {
      const next = new Set(prev);
      const collapsing = next.has(id);
      if (collapsing) {
        next.delete(id);
        const node = findNode(FRAMEWORK, id);
        if (node) flatten(node).forEach(({ node: child }) => next.delete(child.id));
        next.add("civwatch");
        return next;
      }
      const path = pathTo(FRAMEWORK, id);
      const parent = path?.[path.length - 2];
      if (parent?.children) {
        for (const sib of parent.children) {
          if (sib.id === id) continue;
          next.delete(sib.id);
          flatten(sib).forEach(({ node: child }) => next.delete(child.id));
        }
      }
      next.add(id);
      next.add("civwatch");
      return next;
    });
  }

  function select(id: string) {
    setSelectedId(id);
    void navigate({
      search: (prev) => ({ ...prev, node: id }),
      replace: true,
    });
  }

  function expandTo(id: string) {
    const path = pathTo(FRAMEWORK, id);
    if (!path) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      path.forEach((n) => next.add(n.id));
      return next;
    });
    select(id);
  }

  return (
    <AppShell flush>
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
        <section className="relative flex min-w-0 flex-col lg:min-h-0 lg:flex-1">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-4">
            <div className="max-w-2xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Civilian government intelligence
              </p>
              <h1 className="mt-1 font-display text-3xl leading-none md:text-4xl">The framework</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                What OSINT Framework is to open-source intelligence, CIVWATCH is to government power — movement,
                oversight, and privacy invasion, indexed as public record.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{total} sources</Badge>
              <div className="flex rounded-md border border-border p-0.5">
                <Button
                  variant={view === "tree" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("tree")}
                >
                  <Network className="size-3.5" />
                  Tree
                </Button>
                <Button
                  variant={view === "index" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("index")}
                >
                  <List className="size-3.5" />
                  Index
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-b border-border px-4 py-2">
            {(Object.keys(MARKER_LEGEND) as Marker[]).map((m) => (
              <span key={m} className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="text-steel">({m})</span> {MARKER_LEGEND[m].label}
              </span>
            ))}
            <span className="ml-auto hidden text-[11px] text-muted-foreground md:inline">
              Drag to pan · scroll to zoom
            </span>
          </div>

          <div className="relative md:min-h-[480px] lg:min-h-0 lg:flex-1">
            {view === "tree" ? (
              <>
                <div className="absolute inset-0 hidden md:block">
                  <IntelTree
                    root={FRAMEWORK}
                    expanded={expanded}
                    selectedId={selectedId}
                    matchIds={matchIds}
                    onToggle={toggle}
                    onSelect={select}
                  />
                </div>
                <div className="md:hidden">
                  <IntelList
                    root={FRAMEWORK}
                    expanded={expanded}
                    selectedId={selectedId}
                    onToggle={toggle}
                    onSelect={select}
                  />
                </div>
              </>
            ) : (
              <div className="h-full overflow-y-auto">
                <IntelList
                  root={FRAMEWORK}
                  expanded={expanded}
                  selectedId={selectedId}
                  onToggle={toggle}
                  onSelect={select}
                />
              </div>
            )}
          </div>
        </section>

        <aside className="hidden w-[360px] shrink-0 border-l border-border bg-card lg:block">
          <NodePanel node={selected} crumb={crumb} onOpenChild={expandTo} />
        </aside>

        <div className="border-t border-border bg-card lg:hidden">
          <NodePanel node={selected} crumb={crumb} onOpenChild={expandTo} />
        </div>
      </div>
    </AppShell>
  );
}
