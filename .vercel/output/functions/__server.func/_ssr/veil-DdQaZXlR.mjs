import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { r as cn } from "./router-B8jx7Mst.mjs";
import { a as FRAMEWORK, n as Badge, r as Button, s as countLeaves, t as AppShell } from "./badge-DGHcS6kz.mjs";
import { a as VEIL_SIGNALS, i as VEIL_METRICS, n as OVERSIGHT_ITEMS, r as PRIVACY_SYSTEMS, t as MOVEMENT_EVENTS } from "./desks-sheFbokz.mjs";
import { t as getRegisterFeed } from "./feeds-C7m1TAcU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/veil-DdQaZXlR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function pillarVariant(p) {
	if (p === "privacy") return "danger";
	if (p === "oversight") return "warn";
	return "live";
}
function VeilPage() {
	const [register, setRegister] = (0, import_react.useState)([]);
	const [live, setLive] = (0, import_react.useState)(false);
	const sources = countLeaves(FRAMEWORK);
	const liveMovement = MOVEMENT_EVENTS.filter((e) => e.status === "live").length;
	const alerts = OVERSIGHT_ITEMS.filter((i) => i.severity === "alert").length;
	const expanding = PRIVACY_SYSTEMS.filter((s) => s.risk === "expanding").length;
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		getRegisterFeed().then((res) => {
			if (cancelled) return;
			setRegister(res.results.slice(0, 5));
			setLive(res.ok);
		});
		return () => {
			cancelled = true;
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-6xl px-4 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground",
						children: "VEIL protocol"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl md:text-5xl",
						children: "Executive brief"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground",
						children: "Visibility across movement, oversight, and privacy invasion. A civilian situation room built only from public record."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: live ? "live" : "outline",
					children: live ? "Register live" : "Register standby"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					{
						label: "Indexed sources",
						value: String(sources)
					},
					{
						label: "Live movement",
						value: String(liveMovement)
					},
					{
						label: "Oversight alerts",
						value: String(alerts)
					},
					{
						label: "Expanding systems",
						value: String(expanding)
					}
				].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border bg-card px-5 py-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground",
						children: m.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-display text-4xl tabular-nums",
						children: m.value
					})]
				}, m.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-border bg-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "border-b border-border px-5 py-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl",
							children: "Signal tape"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: "Composite public-record brief for 28–30 Sep 2026."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: VEIL_SIGNALS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "border-b border-border last:border-b-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: s.href,
							className: "flex flex-col gap-2 px-5 py-4 hover:bg-muted md:flex-row md:items-start md:gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "md:w-28",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: pillarVariant(s.pillar),
									children: s.pillar
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 font-mono text-[10px] text-muted-foreground",
									children: s.tag
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: s.headline
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: s.detail
								})]
							})]
						})
					}, s.id)) })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border bg-card p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl",
							children: "Register — last published"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-4 space-y-3",
							children: [register.map((doc) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: doc.html_url,
								target: "_blank",
								rel: "noreferrer",
								className: "block text-sm hover:underline",
								children: doc.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-0.5 font-mono text-[10px] text-muted-foreground",
								children: [
									doc.publication_date,
									" · ",
									doc.agencies[0]?.name
								]
							})] }, doc.html_url)), register.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "text-sm text-muted-foreground",
								children: "Waiting on the Federal Register feed."
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border bg-card p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl",
								children: "Three rails"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-4 space-y-3 text-sm",
								children: VEIL_METRICS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-baseline justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: m.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono tabular-nums text-foreground",
										children: m.value
									})]
								}, m.label))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									size: "sm",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/",
										children: "Open framework"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									size: "sm",
									variant: "outline",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/privacy",
										children: "Privacy atlas"
									})
								})]
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: cn("mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground"),
				children: "CIVWATCH indexes publicly available government records, official portals, and investigative reporting. It does not access classified systems, non-public databases, or private accounts. Briefing cards are reconstructions from public calendars and reporting patterns, labeled as such."
			})
		]
	}) });
}
//#endregion
export { VeilPage as component };
