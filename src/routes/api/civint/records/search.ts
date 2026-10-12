import { createFileRoute } from "@tanstack/react-router";
import { searchIndexedRecords, type RecordSearchFilters } from "@/lib/record-index";

function parseFilters(url: URL): RecordSearchFilters {
  return {
    query: url.searchParams.get("q") ?? undefined,
    identifier: url.searchParams.get("identifier") ?? undefined,
    kind: url.searchParams.get("kind") ?? undefined,
    agency: url.searchParams.get("agency") ?? undefined,
    sourceId: url.searchParams.get("source") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 25),
  };
}

function jsonResult(results: Awaited<ReturnType<typeof searchIndexedRecords>>) {
  return Response.json(
    {
      state: "available",
      strategy: results.length ? "exact-and-keyword" : "empty",
      count: results.length,
      results,
    },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=120" } },
  );
}

export const Route = createFileRoute("/api/civint/records/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          return jsonResult(await searchIndexedRecords(parseFilters(new URL(request.url))));
        } catch (error) {
          // Keep the public response stable and non-sensitive while preserving
          // the actual database error in Render logs for production diagnosis.
          console.error("[records/search] GET failed", {
            message: error instanceof Error ? error.message : String(error),
            code: typeof error === "object" && error !== null && "code" in error
              ? String((error as { code?: unknown }).code ?? "")
              : undefined,
          });
          return Response.json(
            { state: "unavailable", error: "Record index temporarily unavailable" },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json() as RecordSearchFilters;
          return jsonResult(await searchIndexedRecords(body));
        } catch (error) {
          console.error("[records/search] POST failed", {
            message: error instanceof Error ? error.message : String(error),
            code: typeof error === "object" && error !== null && "code" in error
              ? String((error as { code?: unknown }).code ?? "")
              : undefined,
          });
          return Response.json(
            { state: "unavailable", error: "Record index temporarily unavailable" },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
