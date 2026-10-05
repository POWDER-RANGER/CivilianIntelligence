export type AssistantIntent = "search" | "navigate" | "explain" | "draft_foia" | "signal_vs_record" | "create_watch";

export type IndexedRecord = {
  id: string;
  title: string;
  kind: string;
  agency?: string;
  identifiers: string[];
  entities: string[];
  publishedAt?: string;
  updatedAt?: string;
  source: { id: string; name: string; originalUrl: string };
  text: string;
};

export type NavigationEntry = {
  id: string;
  label: string;
  route: string;
  description: string;
  actions: string[];
};

export type RetrievedChunk = {
  recordId: string;
  title: string;
  text: string;
  score: number;
  match: "exact" | "keyword" | "semantic";
};

export type AssistantResponse = {
  answer: string;
  intent: AssistantIntent;
  supportingRecords: Array<{ id: string; title: string; provenance: string }>;
  confidence: "strong" | "limited" | "no-strong-match";
  nextActions: Array<{ label: string; action: string }>;
};

export const ASSISTANT_SYSTEM_RULES = [
  "Answer only from retrieved CIVINT index records and navigation metadata.",
  "Never use model memory or open-web knowledge as evidence for CIVINT claims.",
  "Every factual answer must identify supporting record IDs.",
  "If retrieval is weak, say so and offer nearest indexed alternatives or FOIA.",
  "Never convert an absence from the index into a claim that no record exists.",
  "Never let outlet reputation or political/bias labels alter evidence ranking.",
] as const;
