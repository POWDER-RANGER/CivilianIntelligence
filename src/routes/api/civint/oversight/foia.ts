import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/civint/oversight/foia")({
  server: { handlers: {
    GET: async ({ request }) => {
      const key = process.env.FOIA_API_KEY;
      if (!key) return Response.json({ state: "unconfigured", source: "FOIA.gov", message: "FOIA_API_KEY is not configured." }, { status: 503 });
      const url = new URL(request.url);
      const endpoint = url.searchParams.get("endpoint") || "annual_foia_report";
      // The API key rides along with every forwarded call; only forward simple
      // FOIA.gov endpoint names.
      if (!/^[a-z0-9_/-]{1,80}$/i.test(endpoint) || endpoint.includes("..")) {
        return Response.json({ state: "invalid", message: "Unsupported FOIA.gov endpoint." }, { status: 400 });
      }
      const year = url.searchParams.get("year");
      const query = new URLSearchParams({ "api-key": key });
      if (year) query.set("filter[report_year]", year);
      try {
        const response = await fetch(`https://api.foia.gov/api/${endpoint}?${query}`, {
          headers: { Accept: "application/json", "X-API-Key": key }, signal: AbortSignal.timeout(10000),
        });
        const payload = await response.text();
        return new Response(payload, {
          status: response.status,
          headers: { "Content-Type": response.headers.get("content-type") ?? "application/json", "Cache-Control": "public, max-age=900, s-maxage=900, stale-while-revalidate=3600" },
        });
      } catch {
        return Response.json({ state: "unavailable", source: "FOIA.gov" }, { status: 502 });
      }
    },
  }},
});
