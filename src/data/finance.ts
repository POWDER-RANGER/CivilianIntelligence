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
