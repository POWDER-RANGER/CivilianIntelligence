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

export type WatchtowerFeature = {
  id: string;
  sourceId: string | null;
  category: string;
  longitude: number;
  latitude: number;
  properties: Record<string, unknown>;
  confidence: number | null;
  createdAt: string;
};

export type WatchtowerFeatureResponse = {
  features: WatchtowerFeature[];
  count: number;
  ok: boolean;
};

export type TitanSample = {
  domain: string;
  sensor_id: string;
  ts: string;
  metrics: Record<string, unknown>;
};

export type TitanEvidenceRecord = {
  seq: number;
  kind: string;
  hash: string;
  [key: string]: unknown;
};

export type TitanTelemetryResponse = {
  samples: TitanSample[];
  evidence: TitanEvidenceRecord[];
  evidenceOk: boolean | null;
  state: "live" | "demo" | "snapshot" | "unavailable" | null;
  ownerScope: "user_device" | null;
  limitations: string[];
  ok: boolean;
};

type PillarConfig = {
  id: PillarId;
  label: string;
  baseUrl: string | null;
  token?: string;
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
    baseUrl: configuredUrl(process.env.WATCHTOWER_BASE_URL, "http://127.0.0.1:3000"),
  },
  {
    id: "cell-titan",
    label: "Cell Titan",
    baseUrl: configuredUrl(process.env.CELL_TITAN_BASE_URL, "http://127.0.0.1:8000"),
    token: process.env.CELL_TITAN_API_TOKEN ?? process.env.TITAN_API_TOKEN ?? "",
  },
];

function getConfig(id: PillarId): PillarConfig {
  return CONFIG.find((item) => item.id === id)!;
}

async function readJson<T>(config: PillarConfig, path: string, authenticated = false): Promise<T | null> {
  if (!config.baseUrl) return null;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (authenticated && config.token) headers.Authorization = "Bearer " + config.token;
  try {
    const res = await fetch(config.baseUrl + path, {
      headers,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

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
  const body = await readJson<Record<string, unknown>>(config, "/api/health");
  const latencyMs = Math.round(performance.now() - started);

  return {
    id: config.id,
    label: config.label,
    status: body ? "online" : "degraded",
    configured: true,
    checkedAt,
    latencyMs: body ? latencyMs : null,
    service: typeof body?.service === "string" ? body.service : null,
    version: typeof body?.version === "string" ? body.version : null,
  };
}

export const getPillarStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<PillarStatus[]> => Promise.all(CONFIG.map(probe)),
);

export const getWatchtowerFeatures = createServerFn({ method: "GET" }).handler(
  async (): Promise<WatchtowerFeatureResponse> => {
    const body = await readJson<{ features?: WatchtowerFeature[]; count?: number }>(
      getConfig("watchtower"),
      "/api/features",
    );
    const features = Array.isArray(body?.features) ? body.features.slice(0, 500) : [];
    return {
      features,
      count: typeof body?.count === "number" ? body.count : features.length,
      ok: Boolean(body),
    };
  },
);

export const getTitanTelemetry = createServerFn({ method: "GET" }).handler(
  async (): Promise<TitanTelemetryResponse> => {
    const config = getConfig("cell-titan");
    const observations = await readJson<{
      samples?: TitanSample[];
      state?: "live" | "demo" | "snapshot" | "unavailable";
      owner_scope?: "user_device";
      limitations?: string[];
    }>(config, "/api/observations?n=50", true);
    const evidence = await readJson<{ records?: TitanEvidenceRecord[] }>(
      config,
      "/api/evidence/tail?n=20",
      true,
    );
    const verify = await readJson<{ ok?: boolean }>(config, "/api/evidence/verify", true);

    return {
      samples: Array.isArray(observations?.samples) ? observations.samples : [],
      evidence: Array.isArray(evidence?.records) ? evidence.records : [],
      evidenceOk: typeof verify?.ok === "boolean" ? verify.ok : null,
      state: observations?.state ?? null,
      ownerScope: observations?.owner_scope ?? null,
      limitations: Array.isArray(observations?.limitations) ? observations.limitations : [],
      ok: Boolean(observations || evidence || verify),
    };
  },
);
