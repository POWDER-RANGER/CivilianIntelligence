/** Shared evidence contracts for Signal vs. Record and future CIVINT search/watches. */
export type RecordKind = "federal-register" | "spending-award" | "oversight" | "legislation" | "foia" | "reading-room" | "other";

export type EvidenceRecord = {
  id: string;
  title: string;
  description?: string;
  kind: RecordKind;
  agency?: string;
  identifiers: string[];
  publishedAt?: string;
  updatedAt?: string;
  source: { id: string; name: string; url: string; originalUrl: string };
  provenance: { retrievedAt?: string; method: "api" | "feed" | "official-index" | "manual"; confidence: "source" | "normalized" };
  entities: string[];
};

export type MediaItem = {
  id: string;
  outlet: string;
  headline: string;
  url: string;
  publishedAt: string;
  author?: string;
  description?: string;
  entities: string[];
  provenance: { sourceUrl: string; method: "rss" | "permitted-feed" | "official-index" };
};

export type MatchType = "hard" | "strong" | "agency-topic" | "historical";
export type MatchEvidence = { type: MatchType; score: number; explanation: string };

export type StoryCluster = {
  id: string;
  canonicalTopic: string;
  firstSeen: string;
  lastSeen: string;
  mediaItems: MediaItem[];
  publicRecords: EvidenceRecord[];
  entities: string[];
  agencies: string[];
  locations: string[];
  identifiers: string[];
  matchingEvidence: MatchEvidence[];
  coverage: { outletCount: number; labels?: string[] };
  provenance: { generatedAt: string; algorithm: "deterministic-v1" };
};

export const MATCH_THRESHOLDS = { hard: 1, strongMin: 0.7, agencyTopicMin: 0.4, historical: 0.3, defaultMin: 0.4 } as const;

export function absenceLabel(hasMatchingRecord: boolean): string {
  return hasMatchingRecord ? "Public record baseline found" : "No matching indexed public record found in this window.";
}

export const ABSENCE_DISCLAIMER =
  "This does not establish that no record exists. CIVINT may not have the relevant source, document, or indexing coverage yet.";

export function visibleMatch(score: number, includeWeaker = false): boolean {
  return Number.isFinite(score) && score >= (includeWeaker ? 0.3 : MATCH_THRESHOLDS.defaultMin);
}
