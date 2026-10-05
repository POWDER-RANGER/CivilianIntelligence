import { createFileRoute } from "@tanstack/react-router";
import { SOURCES } from "@/lib/sources";

type SourceStatus = {
  source: (typeof SOURCES)[number];
  state: "reachable" | "unavailable";
  checked_at: string;
};

async function probe(url: string) {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "*/*" },
    signal: AbortSignal.timeout(8000),
  });
  return response.ok;
}

export const Route = createFileRoute("/api/civint/sources")({
  server: {
    handlers: {
      GET: async () => {
        const checked_at = new Date().toISOString();
        const results: SourceStatus[] = await Promise.all(
          SOURCES.map(async (source) => {
            try {
              return { source, state: (await probe(source.healthcheckUrl)) ? "reachable" : "unavailable", checked_at };
            } catch {
              return { source, state: "unavailable", checked_at };
            }
          }),
        );
        return Response.json({ generated_at: checked_at, sources: results }, {
          headers: { "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300" },
        });
      },
    },
  },
});
