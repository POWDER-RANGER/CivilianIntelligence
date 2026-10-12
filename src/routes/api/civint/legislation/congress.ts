import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/civint/legislation/congress")({
  server: { handlers: {
    GET: async ({ request }) => {
      const key = process.env.CONGRESS_API_KEY;
      if (!key) return Response.json({ state: "unconfigured", source: "Congress.gov", message: "CONGRESS_API_KEY is not configured." }, { status: 503 });
      const url = new URL(request.url);
      const path = url.searchParams.get("path") || "bill";
      // The server's API key is attached to whatever path is forwarded; allow
      // only plain Congress.gov v3 resource paths (no dot segments or queries).
      if (!/^[A-Za-z0-9][A-Za-z0-9/_-]{0,120}$/.test(path) || path.includes("..")) {
        return Response.json({ state: "invalid", message: "Unsupported Congress.gov path." }, { status: 400 });
      }
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
