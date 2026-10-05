import type { AssistantIntent } from "./desk-assistant";

export type RouteDecision = {
  intent: AssistantIntent;
  useLlm: boolean;
  cacheKey: string;
};

const RULES: Array<[RegExp, AssistantIntent]> = [
  [/^(where|go to|open|show me).*(finance|watchtower|privacy|movement|oversight|reading room|sources|toolkit|veil|titan)/i, "navigate"],
  [/\b(foia|freedom of information|privacy act)\b.*\b(draft|write|request|letter)\b/i, "draft_foia"],
  [/\b(signal|media|coverage)\b.*\b(record|evidence|public record)\b/i, "signal_vs_record"],
  [/\b(watch|notify|alert)\b/i, "create_watch"],
  [/^(what|explain|why|how)\b/i, "explain"],
];

export function routeAssistantQuery(query: string): RouteDecision {
  const normalized = query.trim().replace(/\s+/g, " ");
  const rule = RULES.find(([pattern]) => pattern.test(normalized));
  const intent = rule?.[1] ?? "search";
  const useLlm = intent === "explain" || intent === "search";
  return { intent, useLlm, cacheKey: normalized.toLowerCase() };
}
