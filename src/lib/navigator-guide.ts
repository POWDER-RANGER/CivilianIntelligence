/** Read-only in-app guidance. This never fabricates records or executes user actions. */
export const GUIDE_DESTINATIONS = [
  { to: "/watchtower", label: "Watchtower map", keywords: ["map", "mapped", "alpr", "camera", "cameras", "license plate", "surveillance camera", "watchtower"], detail: "Explore mapped public surveillance infrastructure and follow its cited sources." },
  { to: "/place", label: "Place dossier", keywords: ["address", "near me", "place", "location", "who watches", "nearby"], detail: "Check place-based context and linked public datasets." },
  { to: "/records", label: "Record index", keywords: ["record", "records", "document", "documents", "evidence", "search", "public record", "case file"], detail: "Search indexed documents, identifiers, agencies and source links." },
  { to: "/sources", label: "Source registry", keywords: ["source", "sources", "data origin", "provenance", "data quality", "verify", "accuracy"], detail: "Review provider attribution, source links and reachability checks." },
  { to: "/finance", label: "Federal spending", keywords: ["money", "contract", "contracts", "spending", "budget", "grant", "grants", "funding", "usaspending"], detail: "Investigate federal awards and follow original financial records." },
  { to: "/toolkit", label: "Records toolkit", keywords: ["foia", "request", "freedom of information", "records request", "file a request"], detail: "Find guidance and tools for requesting and checking public records." },
  { to: "/reading-room", label: "Reading room", keywords: ["declassified", "reading room", "archive", "classified history", "vault"], detail: "Browse links to official public document collections." },
  { to: "/signal", label: "Signal vs Record", keywords: ["news", "media", "signal", "coverage", "corroborate", "reporting"], detail: "Compare reporting and signals against indexed documentary evidence." },
  { to: "/oversight", label: "Oversight", keywords: ["oversight", "accountability", "ethics", "regulation", "investigation"], detail: "Browse government accountability and regulatory resources." },
  { to: "/movement", label: "Movement", keywords: ["movement", "aircraft", "transit", "flight", "transport"], detail: "Explore public movement and government activity data." },
  { to: "/privacy", label: "Privacy", keywords: ["privacy", "tracking", "rights", "surveillance policy"], detail: "Learn about surveillance systems and privacy implications." },
  { to: "/globe", label: "Globe", keywords: ["globe", "3d", "earth"], detail: "Open the geographic globe view and public overlays." },
] as const;

export type GuideDestination = (typeof GUIDE_DESTINATIONS)[number];

export function guideSuggestions(prompt: string): GuideDestination[] {
  const normalized = prompt.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!normalized) return [];
  const haystack = " " + normalized + " ";
  const ranked = GUIDE_DESTINATIONS.map((destination, index) => {
    const score = destination.keywords.reduce((total, word) => {
      const needle = " " + word.replace(/[^a-z0-9]+/g, " ").trim() + " ";
      return total + (haystack.includes(needle) ? 2 + word.split(" ").length : 0);
    }, 0);
    return { destination, score, index };
  }).filter((item) => item.score > 0);
  ranked.sort((a, b) => b.score - a.score || a.index - b.index);
  return ranked.slice(0, 3).map((item) => item.destination);
}

export const GUIDE_DISCLAIMER = "This guide routes you to CIVWATCH tools. It does not verify allegations, search unseen records, or perform actions on your behalf.";
