import { createFileRoute } from "@tanstack/react-router";

// render.yaml sets healthCheckPath: /api/health, but no route existed, so every
// health probe returned 404 (live audit P1-19). This reports process liveness
// only; per-source health lives on /sources and the pillar bridge.
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          {
            status: "ok",
            service: "civintelligence",
            checkedAt: new Date().toISOString(),
            uptimeSeconds: Math.round(process.uptime()),
          },
          { headers: { "Cache-Control": "no-store" } },
        ),
    },
  },
});
