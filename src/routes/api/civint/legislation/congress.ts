import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/civint/legislation/congress")({
  server: { handlers: {
    GET: async ({ request }) => {
      const key = process.env.CONGRESS_API_KEY;
      if (!key) return Response.json({ state: "unconfigured", source: "Congress.gov", message: "CONGRESS_API_KEY is not configured." }, { status: 503 });
      const url = new URL(request.url);
      const path = url.searchParams.get("path") || "bill";
      const limit = Math.min(Number(url.searchParams.get("limit") || 20), 50);
      const endpoint = `https://api.congress.gov/v3/${path.replace(/^\/+/, "")}`;
      try {
        const response = await fetch(`${endpoint}?format=json&limit=${limit}&api_key=${encodeURIComponent(key)}`, {
          headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000),
        });
        const payload = await response.text();
        return new Response(payload, {
          status: response.status,
          headers: { "Content-Type": response.headers.get("content-type") ?? "application/json", "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=900" },
        });
      } catch {
        return Response.json({ state: "unavailable", source: "Congress.gov" }, { status: 502 });
      }
    },
  }},
});
