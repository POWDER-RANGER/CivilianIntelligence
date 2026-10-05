import { createFileRoute } from "@tanstack/react-router";

function normalizeCik(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? digits.padStart(10, "0") : "";
}

export const Route = createFileRoute("/api/civint/finance/sec")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cik = normalizeCik(new URL(request.url).searchParams.get("cik") ?? "");
        if (!cik) return Response.json({ state: "invalid", error: "Provide a SEC CIK." }, { status: 400 });
        try {
          const response = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
            headers: { Accept: "application/json", "User-Agent": "CIVINTELLIGENCE public-record research client" },
            signal: AbortSignal.timeout(10000),
          });
          const text = await response.text();
          return new Response(text, {
            status: response.status,
            headers: {
              "Content-Type": response.headers.get("content-type") ?? "application/json",
              "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=900",
            },
          });
        } catch (error) {
          return Response.json({ state: "unavailable", error: error instanceof Error ? error.message : "SEC unavailable" }, { status: 502 });
        }
      },
    },
  },
});
