import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { layoutTree, type IntelNode, type LaidOut } from "@/lib/intel";

type Props = {
  root: IntelNode;
  expanded: Set<string>;
  selectedId?: string;
  matchIds?: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
};

function linkPath(parent: LaidOut, child: LaidOut) {
  const mid = (parent.x + child.x) / 2 + 12;
  return `M ${parent.x} ${parent.y} C ${mid} ${parent.y}, ${mid} ${child.y}, ${child.x} ${child.y}`;
}

export function IntelTree({ root, expanded, selectedId, matchIds, onToggle, onSelect }: Props) {
  const laid = useMemo(() => layoutTree(root, expanded), [root, expanded]);
  const byId = useMemo(() => new Map(laid.map((n) => [n.id, n])), [laid]);
  const width = Math.max(960, ...laid.map((n) => n.x + 280));
  const height = Math.max(480, ...laid.map((n) => n.y + 80));

  const [pan, setPan] = useState({ x: 36, y: 48, k: 0.92 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const selected = selectedId ? byId.get(selectedId) : undefined;
    if (!selected || selected.depth === 0) return;
    setPan((p) => ({
      ...p,
      x: 120 - selected.x * p.k,
      y: 180 - selected.y * p.k,
    }));
  }, [selectedId, byId]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      setPan((p) => ({ ...p, k: Math.min(1.8, Math.max(0.45, p.k * factor)) }));
    };
    svg.addEventListener("wheel", onWheelNative, { passive: false });
    return () => svg.removeEventListener("wheel", onWheelNative);
  }, []);

  function onPointerDown(e: PointerEvent<SVGSVGElement>) {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    drag.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY };
  }
  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    if (!drag.current) return;
    setPan({
      ...pan,
      x: drag.current.x + (e.clientX - drag.current.px),
      y: drag.current.y + (e.clientY - drag.current.py),
    });
  }
  function onPointerUp() {
    drag.current = null;
  }

  return (
    <svg
      ref={svgRef}
      className="h-full w-full touch-none bg-background"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="img"
      aria-label="CIVWATCH framework tree"
    >
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" className="text-border" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" opacity="0.45" />
      <g transform={`translate(${pan.x} ${pan.y}) scale(${pan.k})`}>
        <rect x={-40} y={-40} width={width} height={height} fill="transparent" />
        {laid
          .filter((n) => n.parentId)
          .map((n) => {
            const parent = byId.get(n.parentId!);
            if (!parent) return null;
            const dim = matchIds && matchIds.size > 0 && !matchIds.has(n.id) && !matchIds.has(parent.id);
            return (
              <path
                key={`l-${n.id}`}
                d={linkPath(parent, n)}
                fill="none"
                className={dim ? "stroke-border" : "stroke-steel/40"}
                strokeWidth={1.15}
              />
            );
          })}
        {laid.map((n) => {
          const folder = n.node.type === "folder";
          const open = expanded.has(n.id);
          const selected = selectedId === n.id;
          const matched = matchIds?.has(n.id);
          const dim = matchIds && matchIds.size > 0 && !matched;
          const label = `${n.node.name}${folder && n.node.children ? `  (${n.node.children.length})` : ""}`;
          const labelW = Math.min(250, 20 + label.length * (n.depth === 0 ? 9 : 6.7));
          return (
            <g
              key={n.id}
              data-node="true"
              transform={`translate(${n.x} ${n.y})`}
              className={cn("cursor-pointer", dim && "opacity-35")}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(n.id);
                if (folder) onToggle(n.id);
              }}
            >
              <rect
                x={12}
                y={n.depth === 0 ? -12 : -9}
                width={labelW}
                height={n.depth === 0 ? 24 : 18}
                rx={3}
                className="fill-background/90"
              />
              <circle
                r={selected ? 7 : 5.5}
                className={
                  selected
                    ? "fill-primary stroke-primary"
                    : folder
                      ? open
                        ? "fill-steel/30 stroke-steel"
                        : "fill-background stroke-steel"
                      : "fill-foreground/80 stroke-foreground"
                }
                strokeWidth={1.4}
              />
              <text
                x={14}
                y={4}
                className={cn("select-none", selected ? "fill-foreground" : "fill-foreground/90")}
                fontSize={n.depth === 0 ? 18 : 12.5}
                fontFamily={n.depth === 0 ? "Instrument Serif, Georgia, serif" : "IBM Plex Sans, sans-serif"}
              >
                {label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export function IntelList({ root, expanded, selectedId, onToggle, onSelect }: Props) {
  return (
    <ul className="px-2 py-2">
      <ListNode
        node={root}
        depth={0}
        expanded={expanded}
        selectedId={selectedId}
        onToggle={onToggle}
        onSelect={onSelect}
      />
    </ul>
  );
}

function ListNode({
  node,
  depth,
  expanded,
  selectedId,
  onToggle,
  onSelect,
}: {
  node: IntelNode;
  depth: number;
} & Omit<Props, "root" | "matchIds">) {
  const folder = node.type === "folder";
  const open = depth === 0 || expanded.has(node.id);
  const selected = selectedId === node.id;
  return (
    <li>
      <button
        type="button"
        onClick={() => {
          onSelect(node.id);
          if (folder) onToggle(node.id);
        }}
        style={{ paddingLeft: 8 + depth * 14 }}
        className={cn(
          "flex min-h-11 w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm",
          selected ? "bg-muted text-foreground" : "text-foreground/90 hover:bg-muted",
        )}
      >
        {folder ? (
          open ? (
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="size-3.5 shrink-0 rounded-full border border-steel/70" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {folder && open && node.children && (
        <ul>
          {node.children.map((child) => (
            <ListNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
