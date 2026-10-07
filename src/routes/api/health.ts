import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json(
          { status: "ok", checked_at: new Date().toISOString() },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});