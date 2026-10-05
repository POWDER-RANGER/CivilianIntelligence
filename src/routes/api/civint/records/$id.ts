import { createFileRoute } from "@tanstack/react-router";
import { getRecordDossier } from "@/lib/record-index";

export const Route = createFileRoute("/api/civint/records/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const dossier = await getRecordDossier(params.id);
          if (!dossier) {
            return Response.json(
              { state: "not-found", message: "Record not found in the CIVINT index." },
              { status: 404 },
            );
          }
          return Response.json(
            { state: "available", dossier },
            { headers: { "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300" } },
          );
        } catch (error) {
          return Response.json(
            { state: "unavailable", error: error instanceof Error ? error.message : "Record unavailable" },
            { status: 503 },
          );
        }
      },
    },
  },
});
