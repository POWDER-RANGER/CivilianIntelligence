export type FinanceKind =
  | "pac"
  | "dark"
  | "lobbying"
  | "trades"
  | "contract"
  | "state";

export type FinanceItem = {
  id: string;
  date: string;
  actor: string;
  title: string;
  kind: FinanceKind;
  summary: string;
  amount?: string;
  url: string;
  severity: "info" | "watch" | "alert";
};

export const FINANCE_KINDS: Record<FinanceKind, string> = {
  pac: "PAC + party",
  dark: "Dark money",
  lobbying: "Lobbying",
  trades: "Official trades",
  contract: "Contracts",
  state: "State money",
};

export const FINANCE_ITEMS: FinanceItem[] = [
  {
    id: "f1",
    date: "2026-09-29",
    actor: "FEC",
    title: "48-hour independent expenditures in two Senate races",
    kind: "pac",
    summary:
      "Super PACs post last-window independent expenditures — the fastest money in the system, reported within 48 hours of the spend.",
    url: "https://www.fec.gov/data/reports/?form_type=F24",
    severity: "watch",
  },
  {
    id: "f2",
    date: "2026-09-28",
    actor: "OpenSecrets",
    title: "Six-figure media buys traced to a 501(c)(4)",
    kind: "dark",
    summary:
      "New issue-advantage radio and connected-TV buys traced to a social-welfare nonprofit that does not register as a political committee.",
    amount: "$1.4M",
    url: "https://www.opensecrets.org/dark-money",
    severity: "alert",
  },
  {
    id: "f3",
    date: "2026-09-26",
    actor: "Senate LDA",
    title: "Q3 LD-2 filings cluster on AI and biometrics accounts",
    kind: "lobbying",
    summary:
      "New registrants report face-recognition, ALPR, and immigration-tech portfolios — influence work that tracks the surveillance market.",
    url: "https://lda.senate.gov/system/public/",
    severity: "info",
  },
  {
    id: "f4",
    date: "2026-09-25",
    actor: "Capitol Trades",
    title: "STOCK Act PTRs: energy and semiconductor issuers",
    kind: "trades",
    summary:
      "Periodic transaction reports from three offices covering issuers that intersect pending committee business.",
    url: "https://www.capitoltrades.com/",
    severity: "watch",
  },
  {
    id: "f5",
    date: "2026-09-24",
    actor: "USAspending",
    title: "DHS award: commercial location-data subscription",
    kind: "contract",
    summary:
      "Public award feed shows a renewal for brokered location-data access — the procurement path behind warrantless data buying.",
    amount: "$2.1M",
    url: "https://www.usaspending.gov/",
    severity: "alert",
  },
  {
    id: "f6",
    date: "2026-09-22",
    actor: "FEC",
    title: "Party committee transfers ahead of the filing seam",
    kind: "pac",
    summary:
      "National and state party committees move funds between committees — structure that shapes the last month of any cycle.",
    url: "https://www.fec.gov/data/committee-type/party/?cycle=2026",
    severity: "info",
  },
  {
    id: "f7",
    date: "2026-09-21",
    actor: "FollowTheMoney",
    title: "State gubernatorial donor concentration",
    kind: "state",
    summary:
      "State-level filings show a majority of reported funds from the top decile of donors in one open-seat race.",
    url: "https://www.followthemoney.org/",
    severity: "watch",
  },
  {
    id: "f8",
    date: "2026-09-19",
    actor: "ProPublica",
    title: "New politically active nonprofit files first 990",
    kind: "dark",
    summary:
      "Form 990 for a 501(c)(4) formed this cycle, showing donor-free revenue lines and grants to a sister super PAC.",
    url: "https://projects.propublica.org/nonprofits/",
    severity: "info",
  },
  {
    id: "f9",
    date: "2026-09-18",
    actor: "LDA / LD-203",
    title: "Lobbyist campaign contributions report cycle",
    kind: "lobbying",
    summary:
      "LD-203 filings log contributions by registered lobbyists to the campaigns and committees they are paid to visit.",
    url: "https://lda.senate.gov/system/public/",
    severity: "info",
  },
  {
    id: "f10",
    date: "2026-09-17",
    actor: "CREW",
    title: "Complaint alleging coordinated spending",
    kind: "dark",
    summary:
      "Ethics complaint alleges common-vendor coordination between a nominally independent committee and a campaign.",
    url: "https://www.citizensforethics.org/",
    severity: "watch",
  },
];

export const FINANCE_METRICS = [
  { label: "Money rails", value: "6", hint: "PACs, dark money, lobbying, trades, contracts, states" },
  { label: "Primary feeds", value: "10", hint: "FEC, LDA, USAspending, watchdogs" },
  { label: "Cycle window", value: "2026", hint: "Midterm filing pressure peaks Q3-Q4" },
  { label: "Filing cadence", value: "48h", hint: "Fastest independent-expenditure reporting" },
];

export type FinanceSource = {
  name: string;
  url: string;
  what: string;
  markers: string[];
};

export const FINANCE_SOURCES: FinanceSource[] = [
  {
    name: "FEC data",
    url: "https://www.fec.gov/data/",
    what: "Candidate, committee, and expenditure filings — the legal base layer of federal money.",
    markers: ["Portal", "API"],
  },
  {
    name: "OpenSecrets",
    url: "https://www.opensecrets.org/",
    what: "Contributor profiles, outside spending, and dark-money tracing built on FEC data.",
    markers: ["Watchdog"],
  },
  {
    name: "Senate LDA",
    url: "https://lda.senate.gov/system/public/",
    what: "LD-2 lobbying reports and LD-203 lobbyist contributions.",
    markers: ["Portal", "API"],
  },
  {
    name: "USAspending",
    url: "https://www.usaspending.gov/",
    what: "Every federal award — where money-in-politics meets procurement.",
    markers: ["Portal", "API"],
  },
  {
    name: "FollowTheMoney",
    url: "https://www.followthemoney.org/",
    what: "State-level contribution data across all fifty states.",
    markers: ["Watchdog"],
  },
  {
    name: "Capitol Trades",
    url: "https://www.capitoltrades.com/",
    what: "STOCK Act periodic transaction reports, tracked and searchable.",
    markers: ["Watchdog"],
  },
  {
    name: "ProPublica Nonprofit Explorer",
    url: "https://projects.propublica.org/nonprofits/",
    what: "Form 990 search — where political nonprofits surface.",
    markers: ["Watchdog", "API"],
  },
  {
    name: "IRS 527 / 990 search",
    url: "https://apps.irs.gov/app/eos/",
    what: "Tax-exempt organization search, including 527 political organizations.",
    markers: ["Portal"],
  },
];
