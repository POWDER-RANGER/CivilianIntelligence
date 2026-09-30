//#region node_modules/.nitro/vite/services/ssr/assets/desks-sheFbokz.js
var MOVEMENT_EVENTS = [
	{
		id: "m1",
		when: "2026-09-30T13:00:00-04:00",
		body: "White House",
		actor: "Press Secretary",
		title: "Daily press briefing",
		kind: "executive",
		location: "James S. Brady Press Briefing Room",
		source: "White House briefing room",
		sourceUrl: "https://www.whitehouse.gov/briefing-room/press-briefings/",
		status: "scheduled"
	},
	{
		id: "m2",
		when: "2026-09-30T10:00:00-04:00",
		until: "2026-09-30T15:00:00-04:00",
		body: "U.S. Senate",
		actor: "Senate",
		title: "Legislative session — nominations and floor amendments",
		kind: "legislative",
		location: "Senate Chamber",
		source: "Senate calendars",
		sourceUrl: "https://www.senate.gov/legislative/calendars.htm",
		status: "live"
	},
	{
		id: "m3",
		when: "2026-09-30T10:00:00-04:00",
		body: "U.S. House",
		actor: "House of Representatives",
		title: "Floor action on remaining appropriations minibus",
		kind: "legislative",
		location: "House Chamber",
		source: "Majority Leader schedule",
		sourceUrl: "https://www.majorityleader.gov/",
		status: "live"
	},
	{
		id: "m4",
		when: "2026-10-01T10:00:00-04:00",
		body: "Supreme Court",
		actor: "SCOTUS",
		title: "October Term argument day 1",
		kind: "judicial",
		location: "Supreme Court of the United States",
		source: "Supreme Court calendar",
		sourceUrl: "https://www.supremecourt.gov/",
		status: "scheduled"
	},
	{
		id: "m5",
		when: "2026-09-30T08:30:00-04:00",
		body: "State Department",
		actor: "Spokesperson",
		title: "Daily press briefing",
		kind: "diplomatic",
		location: "Washington, D.C.",
		source: "State briefings",
		sourceUrl: "https://www.state.gov/briefings/",
		status: "completed"
	},
	{
		id: "m6",
		when: "2026-10-02T09:00:00-04:00",
		body: "FACA / HHS",
		actor: "Advisory committee",
		title: "Public meeting — CDC advisory committee (Sunshine Act notice)",
		kind: "agency",
		location: "Federal Register notice",
		source: "Federal Register",
		sourceUrl: "https://www.federalregister.gov/",
		status: "scheduled"
	},
	{
		id: "m7",
		when: "2026-09-29T16:00:00-04:00",
		body: "DoD",
		actor: "Secretary of Defense",
		title: "Readout: meeting with visiting counterpart",
		kind: "diplomatic",
		location: "Pentagon",
		source: "Defense.gov releases",
		sourceUrl: "https://www.defense.gov/News/Releases/",
		status: "completed"
	},
	{
		id: "m8",
		when: "2026-10-03T09:30:00-04:00",
		body: "House Oversight",
		actor: "Committee on Oversight",
		title: "Hearing: federal data-broker contracts",
		kind: "legislative",
		location: "Rayburn House Office Building",
		source: "Congress.gov",
		sourceUrl: "https://www.congress.gov/",
		status: "scheduled"
	},
	{
		id: "m9",
		when: "2026-09-30T18:00:00-05:00",
		body: "City of Chicago",
		actor: "City Council",
		title: "Regular meeting — public comment on ALPR procurement",
		kind: "local",
		location: "City Hall, Chicago",
		source: "Municipal calendar",
		sourceUrl: "https://www.chicago.gov/",
		status: "scheduled"
	},
	{
		id: "m10",
		when: "2026-10-01T14:00:00-04:00",
		body: "OMB / OIRA",
		actor: "OIRA",
		title: "Regulatory review meeting log (public inspection)",
		kind: "agency",
		location: "Eisenhower Executive Office Building",
		source: "RegInfo",
		sourceUrl: "https://www.reginfo.gov/",
		status: "scheduled"
	}
];
var OVERSIGHT_ITEMS = [
	{
		id: "o1",
		date: "2026-09-28",
		office: "GAO",
		title: "High Risk update: federal IT acquisitions and cybersecurity",
		kind: "gao",
		summary: "GAO flags persistent control gaps in agency IT buying — a recurring High Risk item with fresh recommendations.",
		url: "https://www.gao.gov/",
		severity: "watch"
	},
	{
		id: "o2",
		date: "2026-09-27",
		office: "DoD OIG",
		title: "Audit of a major services contract vehicle",
		kind: "ig",
		summary: "Inspector General report on contract oversight, invoice controls, and conflict-of-interest disclosures.",
		url: "https://www.oversight.gov/",
		severity: "alert"
	},
	{
		id: "o3",
		date: "2026-09-26",
		office: "USAspending",
		title: "Weekly award spike: Department of Homeland Security",
		kind: "spending",
		summary: "Public award feed shows a concentrated cluster of surveillance-adjacent software and services awards.",
		amount: "$184.2M",
		url: "https://www.usaspending.gov/",
		severity: "watch"
	},
	{
		id: "o4",
		date: "2026-09-25",
		office: "FEC",
		title: "Independent expenditure filings — 48-hour reports",
		kind: "lobbying",
		summary: "Last-window independent expenditures posted against two Senate races.",
		url: "https://www.fec.gov/",
		severity: "info"
	},
	{
		id: "o5",
		date: "2026-09-24",
		office: "Capitol Trades",
		title: "STOCK Act periodic transaction reports",
		kind: "ethics",
		summary: "New PTR filings from three House offices covering technology and defense issuers.",
		url: "https://www.capitoltrades.com/",
		severity: "watch"
	},
	{
		id: "o6",
		date: "2026-09-23",
		office: "MuckRock",
		title: "FOIA release: fusion-center privacy audit",
		kind: "foia",
		summary: "State fusion center produces a 2019–2024 privacy audit after a 14-month request.",
		url: "https://www.muckrock.com/",
		severity: "info"
	},
	{
		id: "o7",
		date: "2026-09-22",
		office: "House Oversight",
		title: "Transcribed interview notice — data broker",
		kind: "hearing",
		summary: "Committee posts a transcribed-interview summary with a commercial location-data vendor.",
		url: "https://www.congress.gov/",
		severity: "alert"
	},
	{
		id: "o8",
		date: "2026-09-21",
		office: "LDA",
		title: "Q3 lobbying registrations — AI and biometrics cluster",
		kind: "lobbying",
		summary: "New LDA registrants cluster around face recognition, ALPR, and immigration-tech accounts.",
		url: "https://lda.senate.gov/system/public/",
		severity: "info"
	},
	{
		id: "o9",
		date: "2026-09-20",
		office: "CREW",
		title: "Ethics complaint docketed at OGE",
		kind: "ethics",
		summary: "Public ethics complaint concerning a senior official's recusal screen.",
		url: "https://www.citizensforethics.org/",
		severity: "watch"
	}
];
var PRIVACY_SYSTEMS = [
	{
		id: "p1",
		name: "FISA Section 702",
		category: "federal",
		what: "Warrantless collection of foreign communications that incidentally captures U.S. persons; downstream FBI querying is the live oversight fight.",
		whoOperates: "NSA / FBI / CIA under FISC authorization",
		howToSee: "ODNI statistical transparency reports and FISC opinions",
		howToSeeUrl: "https://www.intelligence.gov/ic-on-the-record",
		coverage: "Global collection, U.S. person incidental",
		risk: "contested",
		lastPublic: "2026 statistical report cycle"
	},
	{
		id: "p2",
		name: "National fusion-center network",
		category: "fusion",
		what: "State and major-urban intelligence hubs that mix federal, local, and private threat information.",
		whoOperates: "State/local hosts with DHS support",
		howToSee: "DHS fact sheets, state PIAs, Brennan Center audits",
		howToSeeUrl: "https://www.dhs.gov/fusion-centers",
		coverage: "All 50 states + territories",
		risk: "expanding",
		lastPublic: "DHS annual network assessment"
	},
	{
		id: "p3",
		name: "Automated license plate readers",
		category: "police",
		what: "Vehicle location grids operated by police and vendors (Flock, Vigilant, Motorola). Data is often retained and shared regionally.",
		whoOperates: "Local PD + commercial vendors",
		howToSee: "Atlas of Surveillance + municipal contracts via FOIA",
		howToSeeUrl: "https://atlasofsurveillance.org/",
		coverage: "Thousands of U.S. agencies",
		risk: "expanding",
		lastPublic: "Atlas of Surveillance continuous"
	},
	{
		id: "p4",
		name: "Face recognition (law enforcement)",
		category: "biometric",
		what: "NGI, Clearview-style scrapes, airport biometrics, and municipal pilots. Accuracy and watchlist hygiene are the public fights.",
		whoOperates: "FBI, CBP, local PD, vendors",
		howToSee: "Perpetual Lineup, PIAs, city council contracts",
		howToSeeUrl: "https://www.perpetuallineup.org/",
		coverage: "Federal + growing local",
		risk: "contested",
		lastPublic: "Agency PIAs / city procurement"
	},
	{
		id: "p5",
		name: "Cell-site simulators",
		category: "police",
		what: "IMSI catchers that impersonate towers. Often hidden in sealed warrants and nondisclosure agreements.",
		whoOperates: "Federal and local law enforcement",
		howToSee: "EFF dockets, court opinions, FOIA on Harris/other contracts",
		howToSeeUrl: "https://www.eff.org/pages/cell-site-simulatorsimsi-catchers",
		coverage: "Documented in dozens of agencies",
		risk: "documented",
		lastPublic: "Court opinions + FOIA"
	},
	{
		id: "p6",
		name: "Commercial data brokers",
		category: "broker",
		what: "Location, identity, and browsing dossiers sold to government without a warrant. The quietest pipeline.",
		whoOperates: "Brokers + agency contracting shops",
		howToSee: "CPPA registry, FTC actions, contract FOIAs, LDA filings",
		howToSeeUrl: "https://cppa.ca.gov/data_brokers/",
		coverage: "National commercial market",
		risk: "expanding",
		lastPublic: "California Delete Act registry"
	},
	{
		id: "p7",
		name: "CBP biometric entry/exit",
		category: "border",
		what: "Face comparison at air, land, and sea. Photographs of non-citizens and, increasingly, citizens on exit.",
		whoOperates: "U.S. Customs and Border Protection",
		howToSee: "CBP biometrics pages and DHS PIAs",
		howToSeeUrl: "https://www.cbp.gov/travel/biometrics",
		coverage: "Ports of entry",
		risk: "expanding",
		lastPublic: "DHS PIA updates"
	},
	{
		id: "p8",
		name: "Geofence and reverse-keyword warrants",
		category: "federal",
		what: "Warrants that ask Google and others who was in a box, or who searched a term — a dragnet dressed as a warrant.",
		whoOperates: "Federal and local prosecutors",
		howToSee: "EFF case tracker and published opinions",
		howToSeeUrl: "https://www.eff.org/",
		coverage: "Nationwide legal fight",
		risk: "contested",
		lastPublic: "Circuit court opinions"
	},
	{
		id: "p9",
		name: "ShotSpotter / acoustic sensors",
		category: "police",
		what: "Microphone arrays that classify gunshots and cue patrol. Independent audits question precision and downstream stops.",
		whoOperates: "SoundThinking + city PD",
		howToSee: "City contracts, inspector general audits, Atlas of Surveillance",
		howToSeeUrl: "https://atlasofsurveillance.org/",
		coverage: "Major U.S. cities",
		risk: "contested",
		lastPublic: "Municipal IG audits"
	},
	{
		id: "p10",
		name: "Platform government-request pipeline",
		category: "platform",
		what: "NSLs, 2703 orders, and emergency disclosures logged in company transparency reports.",
		whoOperates: "Google, Apple, Meta, Microsoft, carriers",
		howToSee: "Company transparency reports",
		howToSeeUrl: "https://transparencyreport.google.com/",
		coverage: "Global, U.S. legal process",
		risk: "documented",
		lastPublic: "Biannual transparency reports"
	},
	{
		id: "p11",
		name: "Real ID / identity spine",
		category: "border",
		what: "State DMV data standardized for federal purposes — flying, federal facilities, and the future of identity.",
		whoOperates: "DHS + state DMVs",
		howToSee: "DHS Real ID pages and state DMV PIAs",
		howToSeeUrl: "https://www.dhs.gov/real-id",
		coverage: "All states (compliance deadlines)",
		risk: "documented",
		lastPublic: "DHS enforcement notices"
	},
	{
		id: "p12",
		name: "Social media monitoring suites",
		category: "fusion",
		what: "Dataminr, Babel Street, and successors sold to fusion centers and PD intel units.",
		whoOperates: "Vendors + fusion centers / PD",
		howToSee: "Brennan Center research and procurement FOIA",
		howToSeeUrl: "https://www.brennancenter.org/issues/protect-liberty-security/social-media",
		coverage: "Fusion centers and large PD",
		risk: "expanding",
		lastPublic: "Contract releases"
	}
];
var VEIL_SIGNALS = [
	{
		id: "v1",
		ts: "2026-09-30T09:12:00-04:00",
		pillar: "movement",
		headline: "House floor live on remaining appropriations",
		detail: "Public calendar shows a compressed minibus window before the fiscal-year seam.",
		href: "/movement",
		tag: "Congress"
	},
	{
		id: "v2",
		ts: "2026-09-30T08:40:00-04:00",
		pillar: "oversight",
		headline: "DoD OIG posts services-contract audit",
		detail: "Invoice controls and COI screens called out. Full PDF on Oversight.gov.",
		href: "/oversight",
		tag: "IG"
	},
	{
		id: "v3",
		ts: "2026-09-29T18:05:00-04:00",
		pillar: "privacy",
		headline: "New ALPR cameras logged in Atlas of Surveillance",
		detail: "Three suburban agencies added Flock nodes this week — check local council packets.",
		href: "/privacy",
		tag: "ALPR"
	},
	{
		id: "v4",
		ts: "2026-09-29T11:22:00-04:00",
		pillar: "oversight",
		headline: "STOCK Act PTRs: defense and semiconductor issuers",
		detail: "Three House offices filed periodic transaction reports covering the last 45 days.",
		href: "/oversight",
		tag: "Ethics"
	},
	{
		id: "v5",
		ts: "2026-09-28T16:47:00-04:00",
		pillar: "privacy",
		headline: "FISC posts a redacted 702 querying opinion",
		detail: "Public filing clarifies FBI U.S.-person query procedures. Read on fisc.uscourts.gov.",
		href: "/privacy",
		tag: "FISA"
	},
	{
		id: "v6",
		ts: "2026-09-28T10:15:00-04:00",
		pillar: "movement",
		headline: "SCOTUS October Term argument calendar locked",
		detail: "First sitting begins 1 October. Audio typically posts at oyez.org the same week.",
		href: "/movement",
		tag: "Courts"
	}
];
var VEIL_METRICS = [
	{
		label: "Indexed sources",
		value: "180+",
		hint: "Public portals, APIs, and watchdogs"
	},
	{
		label: "Movement desks",
		value: "7",
		hint: "Executive through local calendars"
	},
	{
		label: "Oversight rails",
		value: "7",
		hint: "Money, ethics, FOIA, IG, lobbying"
	},
	{
		label: "Privacy systems",
		value: "12",
		hint: "Mapped, with a public-record path"
	}
];
//#endregion
export { VEIL_SIGNALS as a, VEIL_METRICS as i, OVERSIGHT_ITEMS as n, PRIVACY_SYSTEMS as r, MOVEMENT_EVENTS as t };
