import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as Link, p as useRouterState, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as Menu, c as Eye, r as Search, t as X } from "../_libs/lucide-react.mjs";
import { i as Slot } from "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { r as cn } from "./router-B8jx7Mst.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-DGHcS6kz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MARKER_LEGEND = {
	P: {
		label: "Portal",
		hint: "Official public portal or database"
	},
	A: {
		label: "API",
		hint: "Machine-readable API or bulk download"
	},
	R: {
		label: "Register",
		hint: "Account or registration required"
	},
	J: {
		label: "Watchdog",
		hint: "Journalism, NGO, or investigative desk"
	},
	F: {
		label: "FOIA",
		hint: "Records-request or reading-room workflow"
	},
	T: {
		label: "Tool",
		hint: "Installable or locally run tool"
	},
	$: {
		label: "Paid",
		hint: "Paid, freemium, or metered access"
	}
};
function flatten(node, path = []) {
	const self = {
		node,
		path
	};
	if (!node.children?.length) return [self];
	return [self, ...node.children.flatMap((child) => flatten(child, [...path, node.name]))];
}
function findNode(root, id) {
	if (root.id === id) return root;
	for (const child of root.children ?? []) {
		const hit = findNode(child, id);
		if (hit) return hit;
	}
}
function pathTo(root, id) {
	if (root.id === id) return [root];
	for (const child of root.children ?? []) {
		const rest = pathTo(child, id);
		if (rest) return [root, ...rest];
	}
	return null;
}
function countLeaves(node) {
	if (node.type === "url") return 1;
	return (node.children ?? []).reduce((sum, child) => sum + countLeaves(child), 0);
}
function searchNodes(root, query) {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	return flatten(root).filter(({ node, path }) => {
		return [
			node.name,
			node.description ?? "",
			node.bestFor ?? "",
			path.join(" ")
		].join(" ").toLowerCase().includes(q);
	});
}
function layoutTree(root, expanded, hGap = 268, vGap = 38) {
	const result = [];
	function sizeOf(node) {
		if (!expanded.has(node.id) || !node.children?.length) return 1;
		return Math.max(1, node.children.reduce((sum, child) => sum + sizeOf(child), 0));
	}
	function visit(node, depth, yStart, parentId) {
		const y = yStart + (sizeOf(node) - 1) * vGap / 2;
		result.push({
			id: node.id,
			node,
			x: depth * hGap,
			y,
			depth,
			parentId
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
function slug(value) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function folder(id, name, children, description) {
	return {
		id,
		name,
		type: "folder",
		description,
		children
	};
}
function leaf(id, name, url, description, markers = ["P"], extra) {
	return {
		id,
		name,
		type: "url",
		url,
		description,
		markers,
		...extra
	};
}
function leaves(prefix, rows) {
	return rows.map((row) => {
		const [name, url, description, markers, bestFor] = row;
		return leaf(`${prefix}-${slug(name)}`, name, url, description, markers ?? ["P"], { bestFor });
	});
}
var FRAMEWORK = folder("civwatch", "CIVWATCH", [
	folder("movement", "Government Movement", [
		folder("movement-executive", "Executive calendars", leaves("movement-executive", [
			[
				"White House briefing room",
				"https://www.whitehouse.gov/briefing-room/",
				"Presidential remarks, statements, and pool notices — the public log of executive movement.",
				["P"],
				"Daily executive activity"
			],
			[
				"White House press office",
				"https://www.whitehouse.gov/briefing-room/press-briefings/",
				"Press secretary briefings and gaggles with questions on schedule, travel, and policy.",
				["P"]
			],
			[
				"Federal Register presidential documents",
				"https://www.federalregister.gov/presidential-documents",
				"Executive orders, proclamations, and presidential determinations as they are published.",
				["P", "A"]
			],
			[
				"USA.gov executive agencies",
				"https://www.usa.gov/agency-index",
				"Canonical index of federal agencies, with leadership pages and public calendars.",
				["P"]
			],
			[
				"OMB Office of Information and Regulatory Affairs",
				"https://www.reginfo.gov/",
				"Regulatory review desk — where agency rules sit while the White House reviews them.",
				["P"]
			]
		]), "Where the presidency and cabinet actually are: remarks, travel, and published actions."),
		folder("movement-congress", "Legislative floor and hearings", leaves("movement-congress", [
			[
				"Congress.gov",
				"https://www.congress.gov/",
				"Bills, members, committees, the Congressional Record, and the official legislative calendar.",
				["P", "A"],
				"Primary legislative tracker"
			],
			[
				"House floor schedule",
				"https://www.majorityleader.gov/",
				"Majority Leader's published floor agenda and weekly whip notices.",
				["P"]
			],
			[
				"Senate calendars",
				"https://www.senate.gov/legislative/calendars.htm",
				"Senate legislative calendar, executive calendar, and committee meeting notices.",
				["P"]
			],
			[
				"C-SPAN",
				"https://www.c-span.org/",
				"Live and archived floor, hearing, and event video — movement you can watch.",
				["P"]
			],
			[
				"GovTrack",
				"https://www.govtrack.us/",
				"Bill status, vote tracking, and legislator timelines built on official data.",
				["J", "A"]
			],
			[
				"EveryCRSReport",
				"https://www.everycrsreport.com/",
				"Congressional Research Service reports released to the public.",
				["J"]
			],
			[
				"ProPublica Represent",
				"https://projects.propublica.org/represent/",
				"Members, bills, and votes with a journalism-grade API.",
				["J", "A"]
			],
			[
				"Clerk of the House",
				"https://clerk.house.gov/",
				"Roll calls, member lists, and official House records.",
				["P"]
			]
		])),
		folder("movement-courts", "Judicial dockets", leaves("movement-courts", [
			[
				"Supreme Court of the United States",
				"https://www.supremecourt.gov/",
				"Argument calendar, orders, opinions, and argument audio.",
				["P"]
			],
			[
				"Oyez",
				"https://www.oyez.org/",
				"SCOTUS argument audio, transcripts, and case pages.",
				["J"]
			],
			[
				"CourtListener",
				"https://www.courtlistener.com/",
				"RECAP-backed federal dockets, opinions, and oral argument archive.",
				[
					"J",
					"A",
					"F"
				],
				"Federal docket search"
			],
			[
				"PACER",
				"https://pacer.uscourts.gov/",
				"Official federal court electronic records. Metered; pair with RECAP.",
				[
					"P",
					"R",
					"$"
				]
			],
			[
				"U.S. Courts calendars",
				"https://www.uscourts.gov/court-calendar",
				"National directory into district, bankruptcy, and circuit calendars.",
				["P"]
			],
			[
				"FISC public filings",
				"https://www.fisc.uscourts.gov/public-filings",
				"Declassified Foreign Intelligence Surveillance Court opinions and orders.",
				["P"]
			]
		])),
		folder("movement-diplomatic", "Diplomatic and foreign travel", leaves("movement-diplomatic", [
			[
				"State Department briefings",
				"https://www.state.gov/briefings/",
				"Daily press briefings covering travel, visits, and diplomatic movement.",
				["P"]
			],
			[
				"State Department foreign travel",
				"https://www.state.gov/secretary/travel/",
				"Secretary of State travel notices and readouts.",
				["P"]
			],
			[
				"Defense Department releases",
				"https://www.defense.gov/News/Releases/",
				"Public notices of senior DoD travel, engagements, and posture statements.",
				["P"]
			],
			[
				"U.S. Mission announcements",
				"https://www.state.gov/bureaus-offices/bureaus-and-offices-reporting-directly-to-the-secretary/u-s-missions/",
				"Embassy and mission pages with public event notices.",
				["P"]
			],
			[
				"United Nations media",
				"https://media.un.org/",
				"UN meetings, stakeouts, and Security Council schedules.",
				["P"]
			]
		])),
		folder("movement-travel", "Official travel and CODELs", leaves("movement-travel", [
			[
				"LegiStorm",
				"https://www.legistorm.com/",
				"Congressional staff, salary, and privately funded travel records (freemium).",
				[
					"J",
					"R",
					"$"
				]
			],
			[
				"Clerk gift and travel disclosures",
				"https://disclosures-clerk.house.gov/",
				"House travel, gift, and financial disclosure search.",
				["P"]
			],
			[
				"Senate public financial disclosure",
				"https://efdsearch.senate.gov/search/",
				"Senate e-filing search for financial and travel-related disclosures.",
				["P"]
			],
			[
				"GSA travel and per diem",
				"https://www.gsa.gov/travel/plan-a-trip/per-diem-rates",
				"Official per-diem rates used to audit public travel claims.",
				["P"]
			]
		])),
		folder("movement-meetings", "Public meetings and FACA", leaves("movement-meetings", [
			[
				"FACA database",
				"https://www.facadatabase.gov/",
				"Federal advisory committee membership, meetings, and charters.",
				["P"]
			],
			[
				"Federal Register meeting notices",
				"https://www.federalregister.gov/documents/search?conditions%5Btype%5D=NOTICE",
				"Sunshine Act and FACA meeting notices as they publish.",
				["P", "A"]
			],
			[
				"Regulations.gov",
				"https://www.regulations.gov/",
				"Rulemaking dockets, comments, and hearing notices.",
				["P", "A"]
			],
			[
				"BoardDocs",
				"https://go.boarddocs.com/",
				"Agenda and packet host used by thousands of school boards and local bodies.",
				["P"]
			]
		])),
		folder("movement-local", "State and local calendars", leaves("movement-local", [
			[
				"OpenStates",
				"https://openstates.org/",
				"Bills, legislators, and events across U.S. statehouses.",
				["J", "A"]
			],
			[
				"Ballotpedia",
				"https://ballotpedia.org/",
				"Elections, incumbents, and public-meeting encyclopedic coverage.",
				["J"]
			],
			[
				"Municode library",
				"https://library.municode.com/",
				"Codified municipal ordinances — the standing rules of local power.",
				["P"]
			],
			[
				"USA.gov state governments",
				"https://www.usa.gov/state-governments",
				"Directory of official state sites, legislatures, and governors.",
				["P"]
			]
		]))
	], "Track where government is: calendars, hearings, travel, dockets, and public meetings."),
	folder("oversight", "Oversight and accountability", [
		folder("oversight-spending", "Spending and contracts", leaves("oversight-spending", [
			[
				"USAspending",
				"https://www.usaspending.gov/",
				"Federal awards, contracts, loans, and spending by agency, recipient, and location.",
				["P", "A"],
				"Follow the money"
			],
			[
				"SAM.gov",
				"https://sam.gov/",
				"Entity registration, exclusions, contract opportunities, and wage determinations.",
				["P", "R"]
			],
			[
				"Grants.gov",
				"https://www.grants.gov/",
				"Federal grant opportunities and applicant resources.",
				["P"]
			],
			[
				"Federal Pay",
				"https://www.federalpay.org/",
				"Federal employee salary data compiled from official sources.",
				["J"]
			],
			[
				"GSA schedule",
				"https://www.gsaelibrary.gsa.gov/",
				"Multiple-award schedule catalog — how agencies buy.",
				["P"]
			],
			[
				"Treasury Fiscal Data",
				"https://fiscaldata.treasury.gov/",
				"Debt, revenue, and spending datasets from Treasury.",
				["P", "A"]
			]
		])),
		folder("oversight-ig", "Inspectors General and audit", leaves("oversight-ig", [
			[
				"Oversight.gov",
				"https://www.oversight.gov/",
				"Central library of Inspector General reports across the federal government.",
				["P"],
				"IG report search"
			],
			[
				"GAO",
				"https://www.gao.gov/",
				"Government Accountability Office audits, bid protests, and High Risk list.",
				["P"]
			],
			[
				"CIGIE",
				"https://www.ignet.gov/",
				"Council of the Inspectors General on Integrity and Efficiency.",
				["P"]
			],
			[
				"Pandemic Response Accountability Committee",
				"https://www.pandemicoversight.gov/",
				"COVID-era spending oversight still useful as a model for emergency money.",
				["P"]
			]
		])),
		folder("oversight-ethics", "Ethics and financial disclosure", leaves("oversight-ethics", [
			[
				"Office of Government Ethics",
				"https://www.oge.gov/",
				"Executive-branch ethics rules, 278 public financial disclosures, and guidance.",
				["P"]
			],
			[
				"OGE 278 search",
				"https://extapps2.oge.gov/201/Presiden.nsf/201+Search+Page?OpenForm",
				"Public financial disclosure search for senior executive officials.",
				["P"]
			],
			[
				"Capitol Trades",
				"https://www.capitoltrades.com/",
				"STOCK Act periodic transaction reports for members of Congress.",
				["J"],
				"Officials' stock trades"
			],
			[
				"House financial disclosures",
				"https://disclosures-clerk.house.gov/PublicDisclosure/FinancialDisclosure",
				"Official House financial disclosure PDFs.",
				["P"]
			],
			[
				"Quiver Quantitative",
				"https://www.quiverquant.com/",
				"Congressional and agency trading dashboards (freemium).",
				["J", "$"]
			]
		])),
		folder("oversight-finance", "Campaign finance and lobbying", leaves("oversight-finance", [
			[
				"FEC",
				"https://www.fec.gov/",
				"Federal campaign finance filings, candidate committees, and independent expenditures.",
				["P", "A"]
			],
			[
				"OpenSecrets",
				"https://www.opensecrets.org/",
				"Campaign money, lobbying, revolving door, and dark-money tracking.",
				["J", "A"]
			],
			[
				"FollowTheMoney",
				"https://www.followthemoney.org/",
				"State-level campaign finance across all 50 states.",
				["J"]
			],
			[
				"Lobbying Disclosure Act House",
				"https://lobbyingdisclosure.house.gov/",
				"Official LDA filings: who is paid to influence whom.",
				["P"]
			],
			[
				"Senate lobbying disclosure",
				"https://lda.senate.gov/system/public/",
				"Senate LDA query system.",
				["P"]
			],
			[
				"LittleSis",
				"https://littlesis.org/",
				"A free database of who-knows-who at the intersections of business and government.",
				["J"]
			]
		])),
		folder("oversight-foia", "FOIA and public records", leaves("oversight-foia", [
			[
				"FOIA.gov",
				"https://www.foia.gov/",
				"Central FOIA portal: agency contacts, reports, and the national FOIA request form.",
				["P", "F"]
			],
			[
				"National Archives",
				"https://www.archives.gov/",
				"Federal records, presidential libraries, and the Federal Register archive.",
				["P", "F"]
			],
			[
				"CIA FOIA reading room",
				"https://www.cia.gov/readingroom/",
				"Declassified CREST documents and agency FOIA releases.",
				["P", "F"]
			],
			[
				"FBI Vault",
				"https://vault.fbi.gov/",
				"FBI electronic reading room of previously released files.",
				["P", "F"]
			],
			[
				"NSA FOIA",
				"https://www.nsa.gov/Helpful-Links/NSA-FOIA/",
				"NSA FOIA program, reading room, and declassification.",
				["P", "F"]
			],
			[
				"DOJ Office of Information Policy",
				"https://www.justice.gov/oip",
				"Government-wide FOIA policy, reports, and the FOIA Library.",
				["P", "F"]
			],
			[
				"MuckRock",
				"https://www.muckrock.com/",
				"File, track, and read FOIA requests with a public archive of releases.",
				[
					"J",
					"F",
					"R"
				]
			],
			[
				"FOIA Project",
				"https://foiaproject.org/",
				"Syracuse TRAC litigation tracker for FOIA lawsuits.",
				["J"]
			],
			[
				"RCFP Open Government Guide",
				"https://www.rcfp.org/open-government-guide/",
				"State-by-state reporter's guide to public records and open meetings.",
				["J", "F"]
			],
			[
				"NFOIC",
				"https://www.nfoic.org/",
				"National Freedom of Information Coalition — state coalitions and audit tools.",
				["J"]
			]
		])),
		folder("oversight-watchdogs", "Watchdogs and investigators", leaves("oversight-watchdogs", [
			[
				"ProPublica",
				"https://www.propublica.org/",
				"Investigative newsroom with deep civic data desks.",
				["J"]
			],
			[
				"POGO",
				"https://www.pogo.org/",
				"Project on Government Oversight — waste, fraud, and national-security accountability.",
				["J"]
			],
			[
				"CREW",
				"https://www.citizensforethics.org/",
				"Citizens for Responsibility and Ethics in Washington.",
				["J"]
			],
			[
				"ICIJ",
				"https://www.icij.org/",
				"International Consortium of Investigative Journalists.",
				["J"]
			],
			[
				"The Intercept",
				"https://theintercept.com/",
				"National-security and surveillance reporting archive.",
				["J"]
			],
			[
				"DocumentCloud",
				"https://www.documentcloud.org/",
				"Public document annotation and hosting used by newsrooms.",
				["J", "T"]
			],
			[
				"GovInfo",
				"https://www.govinfo.gov/",
				"GPO authentic publications: statutes, hearings, the Record, the Budget.",
				["P", "A"]
			]
		])),
		folder("oversight-whistle", "Whistleblowers", leaves("oversight-whistle", [
			[
				"Office of Special Counsel",
				"https://www.osc.gov/",
				"Federal whistleblower disclosures, Hatch Act, and prohibited personnel practices.",
				["P"]
			],
			[
				"Whistleblower.gov",
				"https://www.whistleblowers.gov/",
				"DOL OSHA whistleblower protection programs.",
				["P"]
			],
			[
				"Government Accountability Project",
				"https://www.whistleblower.org/",
				"Legal support and guidance for public-interest whistleblowers.",
				["J"]
			]
		]))
	], "Follow public money, ethics, lobbying, audits, FOIA, and the watchdogs who read them."),
	folder("privacy", "Privacy invasion", [
		folder("privacy-authorities", "Federal surveillance authorities", leaves("privacy-authorities", [
			[
				"ODNI IC on the Record",
				"https://www.intelligence.gov/ic-on-the-record",
				"Declassified FISA, 702, and IC documents released for public oversight.",
				["P"]
			],
			[
				"ODNI Statistical Transparency Report",
				"https://www.dni.gov/",
				"Annual counts of FISA orders, NSLs, and U.S. person queries as the IC publishes them.",
				["P"]
			],
			[
				"DOJ National Security Division FISA",
				"https://www.justice.gov/nsd/fisa",
				"FISA overview, 702 certifications, and public NSD reporting.",
				["P"]
			],
			[
				"FISC public filings",
				"https://www.fisc.uscourts.gov/public-filings",
				"Opinions that define the legal surface of U.S. electronic surveillance.",
				["P"]
			],
			[
				"NSA FOIA and declassification",
				"https://www.nsa.gov/Helpful-Links/NSA-FOIA/",
				"Agency reading room for historical and contemporary surveillance programs.",
				["P", "F"]
			],
			[
				"EFF NSA spying docket",
				"https://www.eff.org/nsa-spying",
				"Litigation history and explainers for post-2001 bulk collection.",
				["J"]
			]
		])),
		folder("privacy-local-tech", "Police and city surveillance tech", leaves("privacy-local-tech", [
			[
				"Atlas of Surveillance",
				"https://atlasofsurveillance.org/",
				"EFF/UC Berkeley map of police acquisition of cameras, ALPRs, drones, face recognition, and more.",
				["J", "A"],
				"Where the cameras are"
			],
			[
				"EFF Street-Level Surveillance",
				"https://sls.eff.org/",
				"Field guides to ALPR, stingrays, face recognition, ShotSpotter, and bodycams.",
				["J"]
			],
			[
				"EFF ALPR explainer",
				"https://www.eff.org/pages/automated-license-plate-readers-alpr",
				"How plate readers work, who buys the data, and how to FOIA the logs.",
				["J", "F"]
			],
			[
				"EFF cell-site simulators",
				"https://www.eff.org/pages/cell-site-simulatorsimsi-catchers",
				"Stingray / IMSI-catcher public record trail and legal status.",
				["J", "F"]
			],
			[
				"SoundThinking / ShotSpotter coverage",
				"https://www.eff.org/deeplinks/2021/07/shotspotter-continues-rely-secret-contracts-and-unaccountable-algorithms",
				"Gunshot-detection contracts and accuracy disputes in the public record.",
				["J"]
			],
			[
				"Geofence and keyword warrants",
				"https://www.eff.org/deeplinks/2022/07/federal-court-holds-geofence-warrants-are-unconstitutional",
				"How location and search-query reverse warrants work, and the cases against them.",
				["J"]
			]
		])),
		folder("privacy-biometrics", "Biometrics", leaves("privacy-biometrics", [
			[
				"Perpetual Lineup",
				"https://www.perpetuallineup.org/",
				"Georgetown Center on Privacy & Technology survey of U.S. face-recognition systems.",
				["J"]
			],
			[
				"FBI NGI",
				"https://www.fbi.gov/how-we-can-help-you/dna",
				"Next Generation Identification and CODIS public fact sheets.",
				["P"]
			],
			[
				"CBP biometrics",
				"https://www.cbp.gov/travel/biometrics",
				"Entry/exit face comparison at air, land, and sea ports.",
				["P"]
			],
			[
				"TSA security technologies",
				"https://www.tsa.gov/travel/security-screening",
				"Checkpoint identity, CAT, and credential authentication public pages.",
				["P"]
			],
			[
				"EPIC face recognition",
				"https://epic.org/issues/surveillance-oversight/face-surveillance/",
				"Litigation, agency use, and ban-status tracking.",
				["J"]
			]
		])),
		folder("privacy-brokers", "Data brokers and commercial pipeline", leaves("privacy-brokers", [
			[
				"FTC data broker resources",
				"https://www.ftc.gov/news-events/topics/protecting-consumer-privacy-security",
				"Enforcement and reports on commercial data markets feeding government buyers.",
				["P"]
			],
			[
				"EPIC data brokers",
				"https://epic.org/issues/consumer-privacy/data-brokers/",
				"Who sells location, identity, and browsing data — and to which agencies.",
				["J"]
			],
			[
				"The Markup",
				"https://themarkup.org/",
				"Investigations into data brokers, adtech, and algorithmic governance.",
				["J"]
			],
			[
				"Brennan Center social media surveillance",
				"https://www.brennancenter.org/issues/protect-liberty-security/social-media",
				"How fusion centers and police buy social media monitoring.",
				["J"]
			],
			[
				"CPPA data broker registry",
				"https://cppa.ca.gov/data_brokers/",
				"California's public registry of data brokers — a rare official list.",
				["P"]
			]
		])),
		folder("privacy-border", "Border, travel, and identity", leaves("privacy-border", [
			[
				"DHS Real ID",
				"https://www.dhs.gov/real-id",
				"National identity standard and what states share to fly and enter federal facilities.",
				["P"]
			],
			[
				"CBP",
				"https://www.cbp.gov/",
				"Border operations, device search policy, and traveler programs.",
				["P"]
			],
			[
				"ICE FOIA",
				"https://www.ice.gov/foia",
				"Immigration and Enforcement records request portal and library.",
				["P", "F"]
			],
			[
				"DHS Privacy Impact Assessments",
				"https://www.dhs.gov/privacy-impact-assessments",
				"How DHS systems collect, share, and retain personal data — in the agency's own words.",
				["P"]
			]
		])),
		folder("privacy-fusion", "Fusion centers and info sharing", leaves("privacy-fusion", [
			[
				"DHS fusion centers",
				"https://www.dhs.gov/fusion-centers",
				"Official map and fact sheets for the national fusion-center network.",
				["P"]
			],
			[
				"Brennan Center fusion centers",
				"https://www.brennancenter.org/our-work/research-reports/national-network-fusion-centers",
				"Independent audit of what fusion centers actually collect.",
				["J"]
			],
			[
				"DOJ privacy impact assessments",
				"https://www.justice.gov/opcl/doj-privacy-impact-assessments",
				"PIAs for DOJ systems of records, including intel-sharing platforms.",
				["P"]
			],
			[
				"System of Records Notices",
				"https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=system+of+records+notice",
				"Privacy Act SORN publications — the legal notices that a database exists.",
				["P", "A"]
			]
		])),
		folder("privacy-transparency", "Platform transparency reports", leaves("privacy-transparency", [
			[
				"Google Transparency Report",
				"https://transparencyreport.google.com/",
				"Government information requests, content removals, and traffic disruptions.",
				["P"]
			],
			[
				"Apple transparency",
				"https://www.apple.com/legal/transparency/",
				"Device and account requests by country and legal process type.",
				["P"]
			],
			[
				"Microsoft law-enforcement requests",
				"https://www.microsoft.com/en-us/corporate-responsibility/law-enforcement-requests-report",
				"National security and LE request volumes.",
				["P"]
			],
			[
				"Cloudflare transparency",
				"https://www.cloudflare.com/transparency/",
				"Requests to take content down or hand over customer data.",
				["P"]
			]
		])),
		folder("privacy-rights", "Civil liberties desks", leaves("privacy-rights", [
			[
				"EFF",
				"https://www.eff.org/",
				"Electronic Frontier Foundation — litigation, guides, and the Atlas of Surveillance.",
				["J"]
			],
			[
				"ACLU Privacy & Technology",
				"https://www.aclu.org/issues/privacy-technology",
				"Litigation and policy on surveillance, biometrics, and algorithmic decision-making.",
				["J"]
			],
			[
				"EPIC",
				"https://epic.org/",
				"Electronic Privacy Information Center — FOIA, comments, and the EPIC Alert.",
				["J", "F"]
			],
			[
				"CDT",
				"https://cdt.org/",
				"Center for Democracy & Technology.",
				["J"]
			],
			[
				"Privacy and Civil Liberties Oversight Board",
				"https://www.pclob.gov/",
				"Independent executive-branch board that reviews counterterrorism programs.",
				["P"]
			]
		])),
		folder("privacy-self", "Request your own records", leaves("privacy-self", [
			[
				"FBI Identity History Summary",
				"https://www.fbi.gov/how-we-can-help-you/more-fbi-services-and-information/identity-history-summary-checks",
				"Your own FBI criminal-history file (Identity History Summary).",
				["P", "R"]
			],
			[
				"DHS TRIP",
				"https://www.dhs.gov/dhs-trip",
				"Traveler Redress Inquiry Program — watchlist and screening redress.",
				["P", "R"]
			],
			[
				"TSA PreCheck / redress",
				"https://www.tsa.gov/travel/passenger-support/travel-redress-inquiries",
				"Screening complaint and redress path.",
				["P"]
			],
			[
				"CPPA Delete Act",
				"https://cppa.ca.gov/",
				"California tools to demand deletion from registered data brokers.",
				["P"]
			],
			[
				"Privacy Act request (any agency)",
				"https://www.foia.gov/",
				"First-party Privacy Act / FOIA requests for your own federal files.",
				["P", "F"]
			]
		]))
	], "Map the public record of how government watches the public — authorities, vendors, and how to ask."),
	folder("records", "Public records and data", [
		folder("records-federal", "Federal open data", leaves("records-federal", [
			[
				"Data.gov",
				"https://data.gov/",
				"U.S. government's open-data catalog.",
				["P", "A"]
			],
			[
				"Census data",
				"https://data.census.gov/",
				"Decennial, ACS, and economic census tables.",
				["P", "A"]
			],
			[
				"Bureau of Labor Statistics",
				"https://www.bls.gov/",
				"Employment, inflation, and wage series.",
				["P", "A"]
			],
			[
				"IRS Tax Stats",
				"https://www.irs.gov/statistics",
				"SOI tables, exempt-organization data, and migration files.",
				["P"]
			],
			[
				"ProPublica Nonprofit Explorer",
				"https://projects.propublica.org/nonprofits/",
				"IRS Form 990 search for nonprofits, including politically active 501(c) groups.",
				["J", "A"]
			],
			[
				"Federal Register API",
				"https://www.federalregister.gov/developers/api/v1",
				"Machine-readable daily journal of the federal government.",
				["A"]
			]
		])),
		folder("records-people", "People in power", leaves("records-people", [
			[
				"Biographical Directory of Congress",
				"https://bioguide.congress.gov/",
				"Official biographies of members since 1774.",
				["P"]
			],
			[
				"Congress.gov members",
				"https://www.congress.gov/members",
				"Current and historical member pages with sponsored legislation.",
				["P"]
			],
			[
				"House directory",
				"https://www.house.gov/representatives",
				"Office, committee, and contact directory.",
				["P"]
			],
			[
				"Senate directory",
				"https://www.senate.gov/senators/index.htm",
				"Senate directory with class, committee, and office information.",
				["P"]
			],
			[
				"USA.gov elected officials",
				"https://www.usa.gov/elected-officials",
				"Find elected officials by address.",
				["P"]
			]
		])),
		folder("records-state-local", "State and city portals", leaves("records-state-local", [
			[
				"Open data network",
				"https://www.opendatanetwork.com/",
				"Cross-city open-data search (Socrata).",
				["P", "A"]
			],
			[
				"NYC Open Data",
				"https://opendata.cityofnewyork.us/",
				"Reference-class municipal data portal.",
				["P", "A"]
			],
			[
				"Checkbook NYC",
				"https://www.checkbooknyc.com/",
				"Line-item New York City spending.",
				["P"]
			],
			[
				"LA Controller",
				"https://controller.lacity.gov/",
				"Los Angeles payroll, contracts, and budget dashboards.",
				["P"]
			]
		]))
	]),
	folder("methods", "Methods", [
		folder("methods-foia", "How to request", leaves("methods-foia", [
			[
				"DOJ FOIA.gov FAQ",
				"https://www.foia.gov/faq.html",
				"What to ask for, fees, expedited processing, and appeals.",
				["P", "F"]
			],
			[
				"RCFP",
				"https://www.rcfp.org/",
				"Reporters Committee legal guides, hotline, and the Open Government Guide.",
				["J"]
			],
			[
				"MuckRock guides",
				"https://www.muckrock.com/news/",
				"Practical FOIA tactics with real request language.",
				["J", "F"]
			],
			[
				"IAPP glossary",
				"https://iapp.org/resources/glossary/",
				"Privacy-law vocabulary used in PIAs, SORNs, and DPIAs.",
				["J"]
			]
		])),
		folder("methods-verify", "Verification", leaves("methods-verify", [
			[
				"Bellingcat toolkit",
				"https://www.bellingcat.com/category/resources/how-tos/",
				"Open-source verification methods applicable to civic claims.",
				["J"]
			],
			[
				"First Draft / Meedan",
				"https://meedan.com/",
				"Verification workflows for media and civic claims.",
				["J"]
			],
			[
				"Internet Archive Wayback",
				"https://web.archive.org/",
				"Capture official pages before they move or vanish.",
				["P", "T"]
			]
		])),
		folder("methods-opsec", "Researcher hygiene", leaves("methods-opsec", [[
			"EFF Surveillance Self-Defense",
			"https://ssd.eff.org/",
			"Defensive security for journalists and researchers handling public-but-sensitive work.",
			["J"]
		], [
			"CPJ safety kit",
			"https://cpj.org/emergency-response/",
			"Committee to Protect Journalists digital and physical safety resources.",
			["J"]
		]]))
	], "Legal, public methods for asking, verifying, and staying safe while doing civic research."),
	folder("apis", "APIs and bulk data", [folder("apis-official", "Official APIs", leaves("apis-official", [
		[
			"Congress.gov API",
			"https://api.congress.gov/",
			"Bills, members, committees, amendments. Key required.",
			["A", "R"]
		],
		[
			"FEC API",
			"https://api.open.fec.gov/developers/",
			"Campaign finance filings as data.",
			["A", "R"]
		],
		[
			"USAspending API",
			"https://api.usaspending.gov/",
			"Awards, spending, and recipient graphs.",
			["A"]
		],
		[
			"Federal Register API",
			"https://www.federalregister.gov/developers/api/v1",
			"Documents, agencies, and public inspection.",
			["A"]
		],
		[
			"GovInfo API",
			"https://api.govinfo.gov/",
			"Authentic GPO collections.",
			["A", "R"]
		],
		[
			"Regulations.gov API",
			"https://open.gsa.gov/api/regulationsgov/",
			"Dockets, documents, and comments.",
			["A", "R"]
		],
		[
			"data.census.gov API",
			"https://www.census.gov/data/developers.html",
			"Census and ACS.",
			["A", "R"]
		]
	])), folder("apis-civic", "Civic data platforms", leaves("apis-civic", [
		[
			"CourtListener API",
			"https://www.courtlistener.com/api/",
			"Opinions, RECAP dockets, judges, and oral arguments.",
			["A", "R"]
		],
		[
			"OpenStates API",
			"https://docs.openstates.org/api-v3/",
			"State bills and legislators.",
			["A", "R"]
		],
		[
			"OpenSecrets API",
			"https://www.opensecrets.org/api",
			"Campaign finance and lobbying (key required).",
			["A", "R"]
		],
		[
			"ProPublica Congress API",
			"https://www.propublica.org/datastore/api/propublica-congress-api",
			"Members, votes, bills, and statements.",
			["A", "R"]
		],
		[
			"Atlas of Surveillance data",
			"https://atlasofsurveillance.org/",
			"Downloadable police-tech inventory.",
			["A", "J"]
		]
	]))])
], "Civilian government intelligence framework — public systems of movement, oversight, and privacy invasion.");
var DEFAULT_EXPANDED = /* @__PURE__ */ new Set(["civwatch"]);
var Input = (0, import_react.forwardRef)(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/90",
			secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
			outline: "border border-border bg-transparent hover:bg-muted",
			ghost: "hover:bg-muted hover:text-foreground",
			link: "text-steel underline-offset-4 hover:underline"
		},
		size: {
			default: "h-10 px-4 py-2",
			sm: "h-8 rounded-sm px-3 text-xs",
			lg: "h-11 rounded-md px-6",
			icon: "h-10 w-10"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = (0, import_react.forwardRef)(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var NAV = [
	{
		to: "/",
		label: "Framework",
		hint: "Directory"
	},
	{
		to: "/movement",
		label: "Movement",
		hint: "Where government is"
	},
	{
		to: "/oversight",
		label: "Oversight",
		hint: "Money, ethics, FOIA"
	},
	{
		to: "/privacy",
		label: "Privacy",
		hint: "How you are watched"
	},
	{
		to: "/veil",
		label: "VEIL",
		hint: "Briefing"
	}
];
function AppShell({ children, flush = false }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [query, setQuery] = (0, import_react.useState)("");
	const [focused, setFocused] = (0, import_react.useState)(false);
	const hits = query.trim().length >= 2 ? searchNodes(FRAMEWORK, query).slice(0, 8) : [];
	function jump(id) {
		setQuery("");
		setFocused(false);
		setOpen(false);
		navigate({
			to: "/",
			search: {
				node: id,
				q: void 0,
				view: void 0
			}
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							className: "flex shrink-0 items-center gap-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-7 items-center justify-center rounded-sm border border-border",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
									className: "size-3.5 text-steel",
									strokeWidth: 1.75
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-xl leading-none tracking-tight",
								children: "CIVWATCH"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "ml-4 hidden items-center gap-1 lg:flex",
							children: NAV.map((item) => {
								const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: item.to,
									className: cn("rounded-md px-3 py-1.5 text-sm transition-colors", active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"),
									children: item.label
								}, item.to);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative ml-auto hidden min-w-0 max-w-md flex-1 md:block",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: query,
									onChange: (e) => setQuery(e.target.value),
									onFocus: () => setFocused(true),
									onBlur: () => setTimeout(() => setFocused(false), 180),
									placeholder: "Search the framework",
									className: "h-9 border-border bg-card pl-9",
									"aria-label": "Search CIVWATCH"
								}),
								focused && hits.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute right-0 top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg",
									children: hits.map(({ node, path }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted",
										onMouseDown: (e) => e.preventDefault(),
										onClick: () => jump(node.id),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm text-foreground",
											children: node.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] text-muted-foreground",
											children: path.filter((p) => p !== "CIVWATCH").join(" / ")
										})]
									}, node.id))
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							className: "ml-auto lg:hidden",
							onClick: () => setOpen((v) => !v),
							"aria-label": open ? "Close menu" : "Open menu",
							children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
						})
					]
				}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-t border-border bg-background px-4 py-3 lg:hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative mb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: query,
								onChange: (e) => setQuery(e.target.value),
								placeholder: "Search the framework",
								className: "h-10 pl-9"
							})]
						}),
						hits.map(({ node, path }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2 text-left hover:bg-muted",
							onClick: () => jump(node.id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm",
								children: node.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] text-muted-foreground",
								children: path.filter((p) => p !== "CIVWATCH").join(" / ")
							})]
						}, node.id)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "mt-2 grid gap-1",
							children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								onClick: () => setOpen(false),
								className: "flex items-baseline justify-between rounded-md px-2 py-2.5 hover:bg-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: item.hint
								})]
							}, item.to))
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b border-border bg-card",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-auto max-w-[1600px] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground",
					children: "Unclassified // public records // civilian access"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: cn("flex min-h-0 flex-1 flex-col", flush ? "lg:overflow-hidden" : ""),
				children
			})
		]
	});
}
var badgeVariants = cva("inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider", {
	variants: { variant: {
		default: "border-border bg-secondary text-muted-foreground",
		steel: "border-transparent bg-steel/15 text-steel",
		live: "border-transparent bg-live/15 text-live",
		warn: "border-transparent bg-warn/15 text-warn",
		danger: "border-transparent bg-danger/15 text-danger",
		outline: "border-border text-muted-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
//#endregion
export { FRAMEWORK as a, findNode as c, pathTo as d, searchNodes as f, DEFAULT_EXPANDED as i, flatten as l, Badge as n, MARKER_LEGEND as o, Button as r, countLeaves as s, AppShell as t, layoutTree as u };
