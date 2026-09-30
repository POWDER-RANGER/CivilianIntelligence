export type Marker = "P" | "A" | "R" | "J" | "F" | "T" | "$";

export const MARKER_LEGEND: Record<Marker, { label: string; hint: string }> = {
  P: { label: "Portal", hint: "Official public portal or database" },
  A: { label: "API", hint: "Machine-readable API or bulk download" },
  R: { label: "Register", hint: "Account or registration required" },
  J: { label: "Watchdog", hint: "Journalism, NGO, or investigative desk" },
  F: { label: "FOIA", hint: "Records-request or reading-room workflow" },
  T: { label: "Tool", hint: "Installable or locally run tool" },
  $: { label: "Paid", hint: "Paid, freemium, or metered access" },
};

export type IntelNode = {
  id: string;
  name: string;
  type: "folder" | "url";
  url?: string;
  description?: string;
  markers?: Marker[];
  bestFor?: string;
  input?: string;
  output?: string;
  children?: IntelNode[];
};

export type FlatNode = {
  node: IntelNode;
  path: string[];
};

export function flatten(node: IntelNode, path: string[] = []): FlatNode[] {
  const self: FlatNode = { node, path };
  if (!node.children?.length) return [self];
  return [self, ...node.children.flatMap((child) => flatten(child, [...path, node.name]))];
}

export function findNode(root: IntelNode, id: string): IntelNode | undefined {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const hit = findNode(child, id);
    if (hit) return hit;
  }
  return undefined;
}

export function pathTo(root: IntelNode, id: string): IntelNode[] | null {
  if (root.id === id) return [root];
  for (const child of root.children ?? []) {
    const rest = pathTo(child, id);
    if (rest) return [root, ...rest];
  }
  return null;
}

export function countLeaves(node: IntelNode): number {
  if (node.type === "url") return 1;
  return (node.children ?? []).reduce((sum, child) => sum + countLeaves(child), 0);
}

export function countFolders(node: IntelNode): number {
  const self = node.type === "folder" ? 1 : 0;
  return self + (node.children ?? []).reduce((sum, child) => sum + countFolders(child), 0);
}

export function searchNodes(root: IntelNode, query: string): FlatNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return flatten(root).filter(({ node, path }) => {
    const hay = [node.name, node.description ?? "", node.bestFor ?? "", path.join(" ")]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export type LaidOut = {
  id: string;
  node: IntelNode;
  x: number;
  y: number;
  depth: number;
  parentId?: string;
};

export function layoutTree(
  root: IntelNode,
  expanded: Set<string>,
  hGap = 268,
  vGap = 38,
): LaidOut[] {
  const result: LaidOut[] = [];

  function sizeOf(node: IntelNode): number {
    if (!expanded.has(node.id) || !node.children?.length) return 1;
    return Math.max(
      1,
      node.children.reduce((sum, child) => sum + sizeOf(child), 0),
    );
  }

  function visit(node: IntelNode, depth: number, yStart: number, parentId?: string) {
    const size = sizeOf(node);
    const y = yStart + ((size - 1) * vGap) / 2;
    result.push({
      id: node.id,
      node,
      x: depth * hGap,
      y,
      depth,
      parentId,
    });
    if (expanded.has(node.id) && node.children?.length) {
      let cursor = yStart;
      for (const child of node.children) {
        const childSize = sizeOf(child);
        visit(child, depth + 1, cursor, node.id);
        cursor += childSize * vGap;
      }
    }
  }

  visit(root, 0, 0);
  return result;
}

export function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function folder(id: string, name: string, children: IntelNode[], description?: string): IntelNode {
  return { id, name, type: "folder", description, children };
}

export function leaf(
  id: string,
  name: string,
  url: string,
  description: string,
  markers: Marker[] = ["P"],
  extra?: Pick<IntelNode, "bestFor" | "input" | "output">,
): IntelNode {
  return { id, name, type: "url", url, description, markers, ...extra };
}

export function leaves(
  prefix: string,
  rows: Array<
    | [string, string, string]
    | [string, string, string, Marker[]]
    | [string, string, string, Marker[], string]
  >,
): IntelNode[] {
  return rows.map((row) => {
    const [name, url, description, markers, bestFor] = row;
    return leaf(`${prefix}-${slug(name)}`, name, url, description, markers ?? ["P"], {
      bestFor,
    });
  });
}
