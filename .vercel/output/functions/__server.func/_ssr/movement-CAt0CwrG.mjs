import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { r as cn } from "./router-B8jx7Mst.mjs";
import { n as Badge, r as Button, t as AppShell } from "./badge-DGHcS6kz.mjs";
import { t as MOVEMENT_EVENTS } from "./desks-sheFbokz.mjs";
import { t as getRegisterFeed } from "./feeds-C7m1TAcU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/movement-CAt0CwrG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KINDS = [
	"all",
	"executive",
	"legislative",
	"judicial",
	"diplomatic",
	"agency",
	"local"
];
function formatWhen(iso) {
	return new Intl.DateTimeFormat("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "short"
	}).format(new Date(iso));
}
function MovementPage() {
	const [kind, setKind] = (0, import_react.useState)("all");
	const [register, setRegister] = (0, import_react.useState)(null);
	const [live, setLive] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		getRegisterFeed().then((res) => {
			if (cancelled) return;
			setRegister(res.results);
			setLive(res.ok);
		});
		return () => {
			cancelled = true;
		};
	}, []);
	const events = MOVEMENT_EVENTS.filter((e) => kind === "all" || e.kind === kind).sort((a, b) => +new Date(a.when) - +new Date(b.when));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-6xl px-4 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground",
				children: "Desk 01"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl md:text-5xl",
				children: "Government movement"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
				children: "Public calendars of power: the floor, the briefing room, the bench, the advisory committee, the CODEL. CIVWATCH does not track people in secret. It indexes where government said it would be."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 flex flex-wrap gap-2",
				children: KINDS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: kind === k ? "default" : "outline",
					onClick: () => setKind(k),
					className: "capitalize",
					children: k
				}, k))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "relative space-y-3 border-l border-border pl-5",
					children: events.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute -left-[25px] top-2 size-2.5 rounded-full border", event.status === "live" ? "border-live bg-live" : event.status === "completed" ? "border-border bg-muted" : "border-steel bg-background") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-lg border border-border bg-card p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: event.status === "live" ? "live" : "outline",
											children: event.status
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "default",
											children: event.kind
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-[11px] text-muted-foreground",
											children: formatWhen(event.when)
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-2 text-base font-medium",
									children: event.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: [
										event.actor,
										" · ",
										event.body,
										" · ",
										event.location
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: event.sourceUrl,
									target: "_blank",
									rel: "noreferrer",
									className: "mt-3 inline-block text-xs text-steel hover:underline",
									children: ["Source: ", event.source]
								})
							]
						})]
					}, event.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border bg-card p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-2xl",
									children: "Federal Register"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: live ? "live" : "outline",
									children: live ? "Live" : "Queued"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: "Newest public inspection from the daily journal of the federal government."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-4 space-y-3",
								children: [(register ?? []).slice(0, 6).map((doc) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "border-t border-border pt-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground",
											children: [
												doc.publication_date,
												" · ",
												doc.type
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
											href: doc.html_url,
											target: "_blank",
											rel: "noreferrer",
											className: "mt-1 block text-sm leading-snug hover:underline",
											children: doc.title
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-muted-foreground",
											children: doc.agencies.map((a) => a.name).filter(Boolean).join(", ")
										})
									]
								}, doc.html_url)), register && register.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									className: "text-sm text-muted-foreground",
									children: "Register feed is unavailable. Use the framework tree."
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border bg-card p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-medium",
								children: "Open the movement branch"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted-foreground",
								children: "Calendars, CODELs, FACA, dockets — every source used to build this desk."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								className: "mt-4",
								variant: "outline",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/",
									search: { node: "movement" },
									children: "Jump to tree"
								})
							})
						]
					})]
				})]
			})
		]
	}) });
}
//#endregion
export { MovementPage as component };
