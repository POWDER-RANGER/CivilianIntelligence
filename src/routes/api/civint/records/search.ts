import { createFileRoute } from "@tanstack/react-router";
import { parseRecordSearchFilters, searchIndexedRecords } from "@/lib/record-index";

function parseFilters(url: URL): ReturnType<typeof parseRecordSearchFilters> {
  // Apply the same validation to GET and POST. Number(NaN) previously reached
  // the SQL LIMIT parameter and converted malformed requests into 503s.
  const input: Record<string, unknown> = {};
  const names: Record<string, string> = { q: "query", identifier: "identifier", kind: "kind", agency: "agency", source: "sourceId", from: "from", to: "to" };
  const seen = new Set<string>();
  for (const [key, value] of url.searchParams) {
    if (seen.has(key)) {
      return { ok: false, error: `Duplicate query parameter: ${key}.` };
    }
    seen.add(key);
    if (key === "limit") {
      input.limit = /^\d+$/.test(value) ? Number(value) : NaN;
    } else if (names[key]) {
      input[names[key]] = value;
    } else {
      return { ok: false, error: `Unsupported query parameter: ${key}.` };
    }
  }
  return parseRecordSearchFilters(input);
}

function jsonResult(results: Awaited<ReturnType<typeof searchIndexedRecords>>) {
  return Response.json(
    {
      state: "available",
      strategy: results.length ? "exact-and-keyword" : "empty",
      count: results.length,
      results,
    },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=120", "Access-Control-Allow-Origin": "*" } },
  );
}

export const Route = createFileRoute("/api/civint/records/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const parsed = parseFilters(new URL(request.url));
          if (!parsed.ok) {
            return Response.json({ state: "invalid-request", error: parsed.error }, { status: 400, headers: { "Cache-Control": "no-store" } });
          }
          return jsonResult(await searchIndexedRecords(parsed.filters));
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
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return Response.json({ state: "invalid-request", error: "Request body must be valid JSON." }, { status: 400, headers: { "Cache-Control": "no-store" } });
        }
        const parsed = parseRecordSearchFilters(raw);
        if (!parsed.ok) {
          return Response.json({ state: "invalid-request", error: parsed.error }, { status: 400, headers: { "Cache-Control": "no-store" } });
        }
        try {
          return jsonResult(await searchIndexedRecords(parsed.filters));
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
