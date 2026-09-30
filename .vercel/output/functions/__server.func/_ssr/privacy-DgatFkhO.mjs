import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { n as Badge, r as Button, t as AppShell } from "./badge-DGHcS6kz.mjs";
import { r as PRIVACY_SYSTEMS } from "./desks-sheFbokz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/privacy-DgatFkhO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CATS = [
	"all",
	"federal",
	"police",
	"biometric",
	"broker",
	"border",
	"fusion",
	"platform"
];
function riskVariant(r) {
	if (r === "expanding") return "danger";
	if (r === "contested") return "warn";
	return "live";
}
function PrivacyPage() {
	const [cat, setCat] = (0, import_react.useState)("all");
	const [openId, setOpenId] = (0, import_react.useState)(PRIVACY_SYSTEMS[0]?.id ?? null);
	const systems = PRIVACY_SYSTEMS.filter((s) => cat === "all" || s.category === cat);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-6xl px-4 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground",
				children: "Desk 03"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl md:text-5xl",
				children: "Privacy invasion"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
				children: "A civilian atlas of how government watches the public — not a leak dump, not a conspiracy board. Each system here has a public-record path: a PIA, a contract, a court opinion, a transparency report, a FOIA desk."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 flex flex-wrap gap-2",
				children: CATS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: cat === c ? "default" : "outline",
					onClick: () => setCat(c),
					className: "capitalize",
					children: c
				}, c))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-3 md:grid-cols-2",
				children: systems.map((sys) => {
					const open = openId === sys.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-xl border border-border bg-card p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "flex w-full items-start justify-between gap-3 text-left",
								onClick: () => setOpenId(open ? null : sys.id),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground",
									children: sys.category
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-1 font-display text-2xl leading-tight",
									children: sys.name
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: riskVariant(sys.risk),
									children: sys.risk
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm leading-relaxed text-muted-foreground",
								children: sys.what
							}),
							open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "mt-4 space-y-3 border-t border-border pt-4 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground",
										children: "Operated by"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "mt-1",
										children: sys.whoOperates
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground",
										children: "Coverage"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "mt-1",
										children: sys.coverage
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground",
										children: "Last public"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "mt-1",
										children: sys.lastPublic
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground",
										children: "How a civilian sees it"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "mt-1",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
											href: sys.howToSeeUrl,
											target: "_blank",
											rel: "noreferrer",
											className: "text-steel hover:underline",
											children: sys.howToSee
										})
									})] })
								]
							})
						]
					}, sys.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 rounded-xl border border-border bg-card p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "Request your own file"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-2xl text-sm text-muted-foreground",
						children: "FBI Identity History, DHS TRIP redress, Privacy Act requests, California Delete Act — the framework branch for first-party records."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							search: { node: "privacy-self" },
							children: "Open records path"
						})
					})
				]
			})
		]
	}) });
}
//#endregion
export { PrivacyPage as component };
