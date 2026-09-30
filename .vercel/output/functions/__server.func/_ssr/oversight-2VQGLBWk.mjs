import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { n as Badge, r as Button, t as AppShell } from "./badge-DGHcS6kz.mjs";
import { n as OVERSIGHT_ITEMS } from "./desks-sheFbokz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/oversight-2VQGLBWk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KINDS = [
	"all",
	"ig",
	"gao",
	"foia",
	"ethics",
	"spending",
	"lobbying",
	"hearing"
];
function severityVariant(s) {
	if (s === "alert") return "danger";
	if (s === "watch") return "warn";
	return "outline";
}
function OversightPage() {
	const [kind, setKind] = (0, import_react.useState)("all");
	const items = (0, import_react.useMemo)(() => OVERSIGHT_ITEMS.filter((i) => kind === "all" || i.kind === kind), [kind]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-6xl px-4 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground",
				children: "Desk 02"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl md:text-5xl",
				children: "Oversight"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
				children: "The civilian audit trail: Inspectors General, GAO, FOIA releases, STOCK Act trades, lobbying registrations, and the watchdogs who read them so you do not have to live in PDFs."
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
				className: "mt-8 overflow-hidden rounded-xl border border-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden grid-cols-[7rem_7rem_1fr_6rem] gap-3 border-b border-border bg-card px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:grid",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Date" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Office" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Filing" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Flag" })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "border-b border-border last:border-b-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: item.url,
						target: "_blank",
						rel: "noreferrer",
						className: "grid gap-2 px-4 py-4 hover:bg-muted md:grid-cols-[7rem_7rem_1fr_6rem] md:items-start",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs text-muted-foreground",
								children: item.date
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs uppercase tracking-wide text-steel",
								children: item.office
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: item.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: item.summary
								}),
								item.amount && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 font-mono text-xs text-foreground",
									children: item.amount
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: severityVariant(item.severity),
									children: item.severity
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									children: item.kind
								})]
							})
						]
					})
				}, item.id)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-4 md:grid-cols-3",
				children: [
					{
						title: "Follow the money",
						body: "USAspending, SAM.gov, Treasury Fiscal Data.",
						node: "oversight-spending"
					},
					{
						title: "Ask for the file",
						body: "FOIA.gov, MuckRock, agency reading rooms.",
						node: "oversight-foia"
					},
					{
						title: "Watch the watchers of money",
						body: "OpenSecrets, FEC, LDA, Capitol Trades.",
						node: "oversight-finance"
					}
				].map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border bg-card p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl",
							children: card.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: card.body
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							variant: "outline",
							size: "sm",
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/",
								search: { node: card.node },
								children: "Open in tree"
							})
						})
					]
				}, card.node))
			})
		]
	}) });
}
//#endregion
export { OversightPage as component };
