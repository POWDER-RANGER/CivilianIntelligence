import { createFileRoute } from "@tanstack/react-router";
import { upsertIndexedRecord } from "@/lib/record-index";

const API = "https://api.usaspending.gov/api/v2/search/spending_by_award/";

export const Route = createFileRoute("/api/civint/finance/federal")({
  server: { handlers: {
    POST: async ({ request }) => {
      try {
        const body = await request.json();
        const upstream = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(20000),
        });
        const payload = await upstream.text();

        let indexState: "not-attempted" | "indexed" | "partial" | "unavailable" = "not-attempted";
        let indexed = 0;
        if (upstream.ok) {
          try {
            const parsed = JSON.parse(payload) as { results?: Array<Record<string, unknown>> };
            const awards = Array.isArray(parsed.results) ? parsed.results : [];
            const outcomes = await Promise.allSettled(
              awards.map(async (award) => {
                const id = String(award["Award ID"] ?? "").trim();
                if (!id) return false;
                await upsertIndexedRecord({
                  sourceId: "usaspending",
                  sourceRecordId: id,
                  kind: "federal-award",
                  title: "USAspending award " + id + " — " + String(award["Recipient Name"] ?? "Unknown recipient"),
                  agency: award["Awarding Agency"] == null ? null : String(award["Awarding Agency"]),
                  identifiers: [id],
                  entities: [String(award["Recipient Name"] ?? "").trim(), String(award["Awarding Agency"] ?? "").trim()].filter(Boolean),
                  sourceUrl: "https://www.usaspending.gov/",
                  retrievalMethod: "api",
                  adapterVersion: "usaspending-award-v1",
                  rawContent: JSON.stringify(award),
                  hashBasis: "document",
                });
                return true;
              }),
            );
            indexed = outcomes.filter((outcome) => outcome.status === "fulfilled" && outcome.value).length;
            indexState = indexed === awards.length ? "indexed" : indexed > 0 ? "partial" : "unavailable";
          } catch {
            indexState = "unavailable";
          }
        }

        let output: unknown = null;
        try { output = JSON.parse(payload); } catch { output = null; }
        if (output && typeof output === "object" && !Array.isArray(output)) {
          (output as Record<string, unknown>).civint_index = { attempted: upstream.ok, indexed, state: indexState };
          return Response.json(output, {
            status: upstream.status,
            headers: {
              "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=900",
            },
          });
        }

        return new Response(payload, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "application/json",
            "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=900",
          },
        });
      } catch (error) {
        return Response.json({ state: "unavailable", error: error instanceof Error ? error.message : "USAspending unavailable" }, { status: 502 });
      }
    },
  }},
});
