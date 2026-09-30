import { ExternalLink, FolderTree } from "lucide-react";
import type { IntelNode } from "@/lib/intel";
import { MARKER_LEGEND, countLeaves } from "@/lib/intel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function NodePanel({
  node,
  crumb,
  onOpenChild,
}: {
  node: IntelNode | null;
  crumb: string[];
  onOpenChild?: (id: string) => void;
}) {
  if (!node) {
    return (
      <div className="flex h-full flex-col justify-between p-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Inspector</p>
          <h2 className="mt-3 font-display text-3xl leading-tight">Select a node</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            CIVWATCH is a civilian map of public government power: where it moves, who watches it, and how it
            watches you. Every leaf is a real portal, API, FOIA desk, or watchdog.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Click a circle to expand. Click a source to inspect. Nothing here is classified; nothing here is hidden
          behind a badge.
        </p>
      </div>
    );
  }

  const isFolder = node.type === "folder";
  const n = isFolder ? countLeaves(node) : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {crumb.filter((c) => c !== "CIVWATCH").join(" / ") || "Framework"}
        </p>
        <h2 className="mt-2 font-display text-2xl leading-tight">{node.name}</h2>
        {node.markers && node.markers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {node.markers.map((m) => (
              <Badge key={m} variant="steel" title={MARKER_LEGEND[m].hint}>
                {m} {MARKER_LEGEND[m].label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {node.description && (
          <p className="text-sm leading-relaxed text-foreground/90">{node.description}</p>
        )}
        {node.bestFor && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Best for</p>
            <p className="mt-1 text-sm">{node.bestFor}</p>
          </div>
        )}
        {isFolder && (
          <p className="text-sm text-muted-foreground">
            {n} public source{n === 1 ? "" : "s"} in this branch.
          </p>
        )}
        {node.url && (
          <Button asChild className="w-full">
            <a href={node.url} target="_blank" rel="noreferrer">
              Open source
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        )}
        {isFolder && node.children && (
          <>
            <Separator />
            <ul className="space-y-1">
              {node.children.map((child) => (
                <li key={child.id}>
                  <button
                    type="button"
                    onClick={() => onOpenChild?.(child.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                  >
                    <FolderTree className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{child.name}</span>
                    {child.type === "url" && child.markers?.[0] && (
                      <Badge variant="outline">{child.markers[0]}</Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
