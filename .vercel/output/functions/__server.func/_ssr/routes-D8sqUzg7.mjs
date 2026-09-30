import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { d as ChevronDown, i as Network, l as ExternalLink, o as List, s as FolderTree, u as ChevronRight } from "../_libs/lucide-react.mjs";
import { n as Route$4, r as cn } from "./router-B8jx7Mst.mjs";
import { a as FRAMEWORK, c as findNode, d as pathTo, f as searchNodes, i as DEFAULT_EXPANDED, l as flatten, n as Badge, o as MARKER_LEGEND, r as Button, s as countLeaves, t as AppShell, u as layoutTree } from "./badge-DGHcS6kz.mjs";
import { t as Root } from "../_libs/radix-ui__react-separator.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D8sqUzg7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function linkPath(parent, child) {
	const mid = (parent.x + child.x) / 2 + 12;
	return `M ${parent.x} ${parent.y} C ${mid} ${parent.y}, ${mid} ${child.y}, ${child.x} ${child.y}`;
}
function IntelTree({ root, expanded, selectedId, matchIds, onToggle, onSelect }) {
	const laid = (0, import_react.useMemo)(() => layoutTree(root, expanded), [root, expanded]);
	const byId = (0, import_react.useMemo)(() => new Map(laid.map((n) => [n.id, n])), [laid]);
	const width = Math.max(960, ...laid.map((n) => n.x + 280));
	const height = Math.max(480, ...laid.map((n) => n.y + 80));
	const [pan, setPan] = (0, import_react.useState)({
		x: 36,
		y: 48,
		k: .92
	});
	const drag = (0, import_react.useRef)(null);
	const svgRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const selected = selectedId ? byId.get(selectedId) : void 0;
		if (!selected || selected.depth === 0) return;
		setPan((p) => ({
			...p,
			x: 120 - selected.x * p.k,
			y: 180 - selected.y * p.k
		}));
	}, [selectedId, byId]);
	(0, import_react.useEffect)(() => {
		const svg = svgRef.current;
		if (!svg) return;
		const onWheelNative = (e) => {
			e.preventDefault();
			const factor = e.deltaY < 0 ? 1.08 : .92;
			setPan((p) => ({
				...p,
				k: Math.min(1.8, Math.max(.45, p.k * factor))
			}));
		};
		svg.addEventListener("wheel", onWheelNative, { passive: false });
		return () => svg.removeEventListener("wheel", onWheelNative);
	}, []);
	function onPointerDown(e) {
		if (e.target.closest("[data-node]")) return;
		e.currentTarget.setPointerCapture(e.pointerId);
		drag.current = {
			x: pan.x,
			y: pan.y,
			px: e.clientX,
			py: e.clientY
		};
	}
	function onPointerMove(e) {
		if (!drag.current) return;
		setPan({
			...pan,
			x: drag.current.x + (e.clientX - drag.current.px),
			y: drag.current.y + (e.clientY - drag.current.py)
		});
	}
	function onPointerUp() {
		drag.current = null;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		ref: svgRef,
		className: "h-full w-full touch-none bg-background",
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onPointerCancel: onPointerUp,
		role: "img",
		"aria-label": "CIVWATCH framework tree",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pattern", {
				id: "grid",
				width: "32",
				height: "32",
				patternUnits: "userSpaceOnUse",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M 32 0 L 0 0 0 32",
					fill: "none",
					stroke: "currentColor",
					className: "text-border",
					strokeWidth: "0.6"
				})
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "100%",
				height: "100%",
				fill: "url(#grid)",
				opacity: "0.45"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				transform: `translate(${pan.x} ${pan.y}) scale(${pan.k})`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: -40,
						y: -40,
						width,
						height,
						fill: "transparent"
					}),
					laid.filter((n) => n.parentId).map((n) => {
						const parent = byId.get(n.parentId);
						if (!parent) return null;
						const dim = matchIds && matchIds.size > 0 && !matchIds.has(n.id) && !matchIds.has(parent.id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: linkPath(parent, n),
							fill: "none",
							className: dim ? "stroke-border" : "stroke-steel/40",
							strokeWidth: 1.15
						}, `l-${n.id}`);
					}),
					laid.map((n) => {
						const folder = n.node.type === "folder";
						const open = expanded.has(n.id);
						const selected = selectedId === n.id;
						const matched = matchIds?.has(n.id);
						const dim = matchIds && matchIds.size > 0 && !matched;
						const label = `${n.node.name}${folder && n.node.children ? `  (${n.node.children.length})` : ""}`;
						const labelW = Math.min(250, 20 + label.length * (n.depth === 0 ? 9 : 6.7));
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							"data-node": "true",
							transform: `translate(${n.x} ${n.y})`,
							className: cn("cursor-pointer", dim && "opacity-35"),
							onClick: (e) => {
								e.stopPropagation();
								onSelect(n.id);
								if (folder) onToggle(n.id);
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
									x: 12,
									y: n.depth === 0 ? -12 : -9,
									width: labelW,
									height: n.depth === 0 ? 24 : 18,
									rx: 3,
									className: "fill-background/90"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									r: selected ? 7 : 5.5,
									className: selected ? "fill-primary stroke-primary" : folder ? open ? "fill-steel/30 stroke-steel" : "fill-background stroke-steel" : "fill-foreground/80 stroke-foreground",
									strokeWidth: 1.4
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
									x: 14,
									y: 4,
									className: cn("select-none", selected ? "fill-foreground" : "fill-foreground/90"),
									fontSize: n.depth === 0 ? 18 : 12.5,
									fontFamily: n.depth === 0 ? "Instrument Serif, Georgia, serif" : "IBM Plex Sans, sans-serif",
									children: label
								})
							]
						}, n.id);
					})
				]
			})
		]
	});
}
function IntelList({ root, expanded, selectedId, onToggle, onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "px-2 py-2",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListNode, {
			node: root,
			depth: 0,
			expanded,
			selectedId,
			onToggle,
			onSelect
		})
	});
}
function ListNode({ node, depth, expanded, selectedId, onToggle, onSelect }) {
	const folder = node.type === "folder";
	const open = depth === 0 || expanded.has(node.id);
	const selected = selectedId === node.id;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => {
			onSelect(node.id);
			if (folder) onToggle(node.id);
		},
		style: { paddingLeft: 8 + depth * 14 },
		className: cn("flex min-h-11 w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm", selected ? "bg-muted text-foreground" : "text-foreground/90 hover:bg-muted"),
		children: [folder ? open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3.5 shrink-0 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3.5 shrink-0 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-3.5 shrink-0 rounded-full border border-steel/70" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "truncate",
			children: node.name
		})]
	}), folder && open && node.children && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: node.children.map((child) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListNode, {
		node: child,
		depth: depth + 1,
		expanded,
		selectedId,
		onToggle,
		onSelect
	}, child.id)) })] });
}
var Separator = (0, import_react.forwardRef)(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	decorative,
	orientation,
	className: cn("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className),
	...props
}));
Separator.displayName = Root.displayName;
function NodePanel({ node, crumb, onOpenChild }) {
	if (!node) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col justify-between p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
				children: "Inspector"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-3 font-display text-3xl leading-tight",
				children: "Select a node"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted-foreground",
				children: "CIVWATCH is a civilian map of public government power: where it moves, who watches it, and how it watches you. Every leaf is a real portal, API, FOIA desk, or watchdog."
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: "Click a circle to expand. Click a source to inspect. Nothing here is classified; nothing here is hidden behind a badge."
		})]
	});
	const isFolder = node.type === "folder";
	const n = isFolder ? countLeaves(node) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border-b border-border px-5 py-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
					children: crumb.filter((c) => c !== "CIVWATCH").join(" / ") || "Framework"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 font-display text-2xl leading-tight",
					children: node.name
				}),
				node.markers && node.markers.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-wrap gap-1.5",
					children: node.markers.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: "steel",
						title: MARKER_LEGEND[m].hint,
						children: [
							m,
							" ",
							MARKER_LEGEND[m].label
						]
					}, m))
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 space-y-4 overflow-y-auto px-5 py-4",
			children: [
				node.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-relaxed text-foreground/90",
					children: node.description
				}),
				node.bestFor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
					children: "Best for"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm",
					children: node.bestFor
				})] }),
				isFolder && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						n,
						" public source",
						n === 1 ? "" : "s",
						" in this branch."
					]
				}),
				node.url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					className: "w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: node.url,
						target: "_blank",
						rel: "noreferrer",
						children: ["Open source", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" })]
					})
				}),
				isFolder && node.children && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1",
					children: node.children.map((child) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onOpenChild?.(child.id),
						className: "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderTree, { className: "size-3.5 shrink-0 text-muted-foreground" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 flex-1 truncate",
								children: child.name
							}),
							child.type === "url" && child.markers?.[0] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								children: child.markers[0]
							})
						]
					}) }, child.id))
				})] })
			]
		})]
	});
}
function Home() {
	const search = Route$4.useSearch();
	const navigate = Route$4.useNavigate();
	const [expanded, setExpanded] = (0, import_react.useState)(() => new Set(DEFAULT_EXPANDED));
	const [selectedId, setSelectedId] = (0, import_react.useState)(search.node ?? "civwatch");
	const [view, setView] = (0, import_react.useState)(search.view ?? "tree");
	const selected = findNode(FRAMEWORK, selectedId) ?? FRAMEWORK;
	const crumb = (pathTo(FRAMEWORK, selectedId) ?? [FRAMEWORK]).map((n) => n.name);
	const total = countLeaves(FRAMEWORK);
	const matchIds = (0, import_react.useMemo)(() => {
		if (!search.q) return void 0;
		const hits = searchNodes(FRAMEWORK, search.q);
		return new Set(hits.flatMap((h) => (pathTo(FRAMEWORK, h.node.id) ?? []).map((n) => n.id)));
	}, [search.q]);
	(0, import_react.useEffect)(() => {
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
	function toggle(id) {
		if (id === "civwatch") return;
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
				const node = findNode(FRAMEWORK, id);
				if (node) flatten(node).forEach(({ node: child }) => next.delete(child.id));
				next.add("civwatch");
				return next;
			}
			const path = pathTo(FRAMEWORK, id);
			const parent = path?.[path.length - 2];
			if (parent?.children) for (const sib of parent.children) {
				if (sib.id === id) continue;
				next.delete(sib.id);
				flatten(sib).forEach(({ node: child }) => next.delete(child.id));
			}
			next.add(id);
			next.add("civwatch");
			return next;
		});
	}
	function select(id) {
		setSelectedId(id);
		navigate({
			search: (prev) => ({
				...prev,
				node: id
			}),
			replace: true
		});
	}
	function expandTo(id) {
		const path = pathTo(FRAMEWORK, id);
		if (!path) return;
		setExpanded((prev) => {
			const next = new Set(prev);
			path.forEach((n) => next.add(n.id));
			return next;
		});
		select(id);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		flush: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "relative flex min-w-0 flex-col lg:min-h-0 lg:flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "max-w-2xl",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground",
										children: "Civilian government intelligence"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "mt-1 font-display text-3xl leading-none md:text-4xl",
										children: "The framework"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground",
										children: "What OSINT Framework is to open-source intelligence, CIVWATCH is to government power — movement, oversight, and privacy invasion, indexed as public record."
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									variant: "outline",
									children: [total, " sources"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex rounded-md border border-border p-0.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: view === "tree" ? "secondary" : "ghost",
										size: "sm",
										onClick: () => setView("tree"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Network, { className: "size-3.5" }), "Tree"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: view === "index" ? "secondary" : "ghost",
										size: "sm",
										onClick: () => setView("index"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, { className: "size-3.5" }), "Index"]
									})]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-3 border-b border-border px-4 py-2",
							children: [Object.keys(MARKER_LEGEND).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-steel",
										children: [
											"(",
											m,
											")"
										]
									}),
									" ",
									MARKER_LEGEND[m].label
								]
							}, m)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-auto hidden text-[11px] text-muted-foreground md:inline",
								children: "Drag to pan · scroll to zoom"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative md:min-h-[480px] lg:min-h-0 lg:flex-1",
							children: view === "tree" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute inset-0 hidden md:block",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntelTree, {
									root: FRAMEWORK,
									expanded,
									selectedId,
									matchIds,
									onToggle: toggle,
									onSelect: select
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "md:hidden",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntelList, {
									root: FRAMEWORK,
									expanded,
									selectedId,
									onToggle: toggle,
									onSelect: select
								})
							})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full overflow-y-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntelList, {
									root: FRAMEWORK,
									expanded,
									selectedId,
									onToggle: toggle,
									onSelect: select
								})
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: "hidden w-[360px] shrink-0 border-l border-border bg-card lg:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodePanel, {
						node: selected,
						crumb,
						onOpenChild: expandTo
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-t border-border bg-card lg:hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodePanel, {
						node: selected,
						crumb,
						onOpenChild: expandTo
					})
				})
			]
		})
	});
}
//#endregion
export { Home as component };
