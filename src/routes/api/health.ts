import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const db = await getSql();
          await db.query("select 1");
          return Response.json(
            {
              status: "ok",
              service: "civintelligence",
              database: "available",
              checkedAt: new Date().toISOString(),
              uptimeSeconds: Math.round(process.uptime()),
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch (error) {
          console.error("[health] database readiness check failed", {
            message: error instanceof Error ? error.message : String(error),
            code:
              typeof error === "object" && error !== null && "code" in error
                ? String((error as { code?: unknown }).code ?? "")
                : undefined,
          });
          return Response.json(
            {
              status: "degraded",
              service: "civintelligence",
              database: "unavailable",
              checkedAt: new Date().toISOString(),
            },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
