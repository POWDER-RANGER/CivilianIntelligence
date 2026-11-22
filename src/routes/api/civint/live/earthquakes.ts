import { createFileRoute } from "@tanstack/react-router";
import { getUsgsSnapshot } from "@/lib/usgs-live";

export const Route = createFileRoute("/api/civint/live/earthquakes")({
  server: {
    handlers: {
      GET: async () => {
        const result = await getUsgsSnapshot();
        return Response.json(result, {
          status: result.state === "unavailable" ? 503 : 200,
          headers: {
            "Cache-Control":
              result.state === "available" ? "public, max-age=30, s-maxage=60" : "no-store",
            "Access-Control-Allow-Origin": "*",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
