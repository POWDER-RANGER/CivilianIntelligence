import { createServerFn } from "@tanstack/react-start";

export type PillarId = "watchtower" | "cell-titan";

export type PillarStatus = {
  id: PillarId;
  label: string;
  status: "online" | "degraded" | "unconfigured";
  configured: boolean;
  checkedAt: string;
  latencyMs: number | null;
  service: string | null;
  version: string | null;
};

type PillarConfig = {
  id: PillarId;
  label: string;
  baseUrl: string | null;
};

const isProduction = process.env.NODE_ENV === "production";

function configuredUrl(value: string | undefined, localFallback: string): string | null {
  if (value?.trim()) return value.trim().replace(/\/$/, "");
  if (!isProduction) return localFallback;
  return null;
}

const CONFIG: PillarConfig[] = [
  {
    id: "watchtower",
    label: "Watchtower",
    baseUrl: configuredUrl(
      process.env.WATCHTOWER_BASE_URL,
      "http://127.0.0.1:3000",
    ),
  },
  {
    id: "cell-titan",
    label: "Cell Titan",
    baseUrl: configuredUrl(
      process.env.CELL_TITAN_BASE_URL,
      "http://127.0.0.1:8000",
    ),
  },
];

async function probe(config: PillarConfig): Promise<PillarStatus> {
  const checkedAt = new Date().toISOString();

  if (!config.baseUrl) {
    return {
      id: config.id,
      label: config.label,
      status: "unconfigured",
      configured: false,
      checkedAt,
      latencyMs: null,
      service: null,
      version: null,
    };
  }

  const started = performance.now();
  try {
    const res = await fetch(`${config.baseUrl}/api/health`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(2500),
    });
    const latencyMs = Math.round(performance.now() - started);
    let body: Record<string, unknown> = {};
    try {
      const parsed = await res.json();
      if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
    } catch {
      // Keep the transport result even when an upstream sends invalid JSON.
    }

    return {
      id: config.id,
      label: config.label,
      status: res.ok ? "online" : "degraded",
      configured: true,
      checkedAt,
      latencyMs,
      service: typeof body.service === "string" ? body.service : null,
      version: typeof body.version === "string" ? body.version : null,
    };
  } catch {
    return {
      id: config.id,
      label: config.label,
      status: "degraded",
      url: config.baseUrl,
      checkedAt,
      latencyMs: null,
      service: null,
      version: null,
    };
  }
}

/**
 * Server-only integration probe.
 *
 * The browser receives health metadata only; upstream URLs remain on the
 * server side so credentials and internal service topology are never exposed.
 */
export const getPillarStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<PillarStatus[]> => Promise.all(CONFIG.map(probe)),
);
