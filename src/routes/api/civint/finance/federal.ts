import { createFileRoute } from "@tanstack/react-router";

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
