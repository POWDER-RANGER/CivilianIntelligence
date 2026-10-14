import { createServerFn } from "@tanstack/react-start";

export type PillarId = "watchtower" | "cell-titan";

/**
 * Why a server-side pillar request did or did not return data. Kept separate
 * from PillarStatus.status so the UI can tell a sleeping free-tier service
 * ("timeout"/"network" — retry) from a misconfiguration ("unauthorized",
 * "not_found" — operator action required).
 */
export type FetchOutcome =
  | "ok"
  | "timeout"
  | "network"
  | "unauthorized"
  | "not_found"
  | "http_error"
  | "invalid_json"
  | "unconfigured";

export type PillarStatus = {
  id: PillarId;
  label: string;
  /** online: healthy · degraded: reachable but unhealthy · unreachable: configured but no response · unconfigured: no endpoint set */
  status: "online" | "degraded" | "unreachable" | "unconfigured";
  configured: boolean;
  checkedAt: string;
  latencyMs: number | null;
  service: string | null;
  version: string | null;
  /** Classified cause of the most recent health probe. */
  reason?: FetchOutcome | null;
};

export type WatchtowerFeature = {
  id: string;
  sourceId: string | null;
  category: string;
  longitude: number;
  latitude: number;
  properties: Record<string, JsonValue>;
  confidence: number | null;
  createdAt: string;
};

/** JSON-serializable value: server functions must return serializable data. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type WatchtowerFeatureResponse = {
  features: WatchtowerFeature[];
  count: number;
  ok: boolean;
};

export type TitanSample = {
  domain: string;
  sensor_id: string;
  ts: string;
  metrics: Record<string, JsonValue>;
};

export type TitanEvidenceRecord = {
  seq: number;
  kind: string;
  hash: string;
  [key: string]: JsonValue;
};

export type TitanTelemetryResponse = {
  samples: TitanSample[];
  evidence: TitanEvidenceRecord[];
  evidenceOk: boolean | null;
  state: "live" | "demo" | "snapshot" | "unavailable" | null;
  ownerScope: "user_device" | null;
  limitations: string[];
  ok: boolean;
  diagnostics?: TitanDiagnostics;
};

export type TitanDiagnostics = {
  observations: FetchOutcome;
  evidence: FetchOutcome;
  verify: FetchOutcome;
};

export type TitanProblem = {
  kind:
    | "unconfigured"
    | "waking"
    | "unauthorized"
    | "outdated_service"
    | "unverified"
    | "unknown";
  /** True when retrying shortly is the correct response (cold start). */
  retryable: boolean;
  message: string;
};

export type TitanTelemetryInputs = {
  recent: { samples?: TitanSample[] } | null;
  evidence: { records?: TitanEvidenceRecord[] } | null;
  verify: { ok?: boolean } | null;
  observation?: {
    state?: "live" | "demo" | "snapshot" | "unavailable";
    owner_scope?: "user_device";
    limitations?: string[];
  } | null;
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
    label: "Platform",
    baseUrl: configuredUrl(process.env.WATCHTOWER_BASE_URL, "http://127.0.0.1:3000"),
  },
  {
    id: "cell-titan",
    label: "Cell Monitor",
    baseUrl: configuredUrl(process.env.CELL_TITAN_BASE_URL, "http://127.0.0.1:8000"),
    token: process.env.CELL_TITAN_API_TOKEN ?? process.env.TITAN_API_TOKEN ?? "",
  },
];

function getConfig(id: PillarId): PillarConfig {
  return CONFIG.find((item) => item.id === id)!;
}

/**
 * Per-request timeout. Render Free services sleep when idle and take
 * 30-60s to wake; the first request triggers the wake, so a short timeout
 * plus client-side retry beats one long blocking request.
 */
const PILLAR_TIMEOUT_MS = 8000;

type ReadResult<T> = { body: T | null; outcome: FetchOutcome; httpStatus: number | null };

export function outcomeForHttpStatus(status: number): FetchOutcome {
  if (status >= 200 && status < 300) return "ok";
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 404) return "not_found";
  return "http_error";
}

export function outcomeForFetchError(error: unknown): FetchOutcome {
  const name = (error as { name?: unknown } | null)?.name;
  return name === "TimeoutError" || name === "AbortError" ? "timeout" : "network";
}

async function readJsonResult<T>(
  config: PillarConfig,
  path: string,
  authenticated = false,
): Promise<ReadResult<T>> {
  if (!config.baseUrl) return { body: null, outcome: "unconfigured", httpStatus: null };
  const headers: Record<string, string> = { Accept: "application/json" };
  if (authenticated && config.token) headers.Authorization = "Bearer " + config.token;
  let res: Response;
  try {
    res = await fetch(config.baseUrl + path, {
      headers,
      signal: AbortSignal.timeout(PILLAR_TIMEOUT_MS),
    });
  } catch (error) {
    return { body: null, outcome: outcomeForFetchError(error), httpStatus: null };
  }
  const outcome = outcomeForHttpStatus(res.status);
  if (outcome !== "ok") return { body: null, outcome, httpStatus: res.status };
  try {
    return { body: (await res.json()) as T, outcome: "ok", httpStatus: res.status };
  } catch {
    return { body: null, outcome: "invalid_json", httpStatus: res.status };
  }
}

async function readJson<T>(config: PillarConfig, path: string, authenticated = false): Promise<T | null> {
  return (await readJsonResult<T>(config, path, authenticated)).body;
}

export function getPillarHealthStatus(
  body: Record<string, unknown> | null,
): "online" | "degraded" | "unreachable" {
  // Live audit P1-18: a configured-but-silent pillar was labeled "degraded"
  // beside the copy "endpoint not configured". No response is its own state.
  if (!body) return "unreachable";
  return body.status === "ok" || body.status === "online" ? "online" : "degraded";
}

/**
 * Turn a health probe plus per-endpoint outcomes into one actionable
 * explanation. Order matters: configuration first, then reachability, then
 * credentials, then contract version, then evidence integrity.
 */
export function describeTitanProblem(
  health: Pick<PillarStatus, "status" | "reason"> | null,
  telemetry: Pick<TitanTelemetryResponse, "ok" | "evidenceOk" | "diagnostics"> | null,
): TitanProblem | null {
  if (telemetry?.ok) return null;
  if (!health || health.status === "unconfigured") {
    return {
      kind: "unconfigured",
      retryable: false,
      message: "Cell Monitor endpoint is not configured on this deployment.",
    };
  }
  const d = telemetry?.diagnostics;
  const outcomes = d ? [d.observations, d.evidence, d.verify] : [];
  const transient = (o: FetchOutcome | null | undefined) => o === "timeout" || o === "network";
  if (health.status === "unreachable" && (transient(health.reason) || health.reason == null)) {
    return {
      kind: "waking",
      retryable: true,
      message:
        "Cell Monitor is not responding yet. Free hosting puts idle services to sleep and waking takes up to a minute — retrying automatically.",
    };
  }
  if (outcomes.includes("unauthorized")) {
    return {
      kind: "unauthorized",
      retryable: false,
      message:
        "Cell Monitor rejected this portal's server credentials. The portal's CELL_TITAN_API_TOKEN must match TITAN_API_TOKEN on the Cell Monitor service.",
    };
  }
  if (d?.observations === "not_found") {
    return {
      kind: "outdated_service",
      retryable: false,
      message:
        "Cell Monitor is reachable but is running a build without the observation contract (/api/observations). Redeploy Cell Monitor from main (v0.1.3 or later).",
    };
  }
  if (outcomes.some(transient)) {
    return {
      kind: "waking",
      retryable: true,
      message: "Cell Monitor responded to its health check but telemetry timed out. Retrying automatically.",
    };
  }
  if (telemetry?.evidenceOk === false) {
    return {
      kind: "unverified",
      retryable: false,
      message: "Cell Monitor evidence chain verification failed. Treat returned records as unverified.",
    };
  }
  return {
    kind: "unknown",
    retryable: false,
    message: "Cell Monitor data is not verified. Review service status and evidence verification below.",
  };
}

export function summarizeTitanTelemetry(inputs: TitanTelemetryInputs): TitanTelemetryResponse {
  const { recent, evidence, verify, observation } = inputs;
  const evidenceOk = typeof verify?.ok === "boolean" ? verify.ok : null;
  const reachable = Boolean(recent || evidence || verify);

  return {
    samples: Array.isArray(recent?.samples) ? recent.samples : [],
    evidence: Array.isArray(evidence?.records) ? evidence.records : [],
    evidenceOk,
    state: observation?.state ?? null,
    ownerScope: observation?.owner_scope ?? null,
    limitations: Array.isArray(observation?.limitations) ? observation.limitations : [],
    // Healthy requires BOTH the observation contract response and an explicit
    // evidence-verifier pass. Evidence alone must not mask a missing contract
    // (e.g. an outdated Titan build that 404s /api/observations).
    ok: reachable && Boolean(recent) && evidenceOk === true,
  };
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
      reason: "unconfigured",
    };
  }

  const started = performance.now();
  const result = await readJsonResult<Record<string, unknown>>(config, "/api/health");
  const body = result.body;
  const latencyMs = Math.round(performance.now() - started);
  const reachable = Boolean(body);

  return {
    id: config.id,
    label: config.label,
    status: getPillarHealthStatus(body),
    configured: true,
    checkedAt,
    latencyMs: reachable ? latencyMs : null,
    service: typeof body?.service === "string" ? body.service : null,
    version: typeof body?.version === "string" ? body.version : null,
    reason: result.outcome,
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
    const [observations, evidence, verify] = await Promise.all([
      readJsonResult<{
        samples?: TitanSample[];
        state?: "live" | "demo" | "snapshot" | "unavailable";
        owner_scope?: "user_device";
        limitations?: string[];
      }>(config, "/api/observations?n=50", true),
      readJsonResult<{ records?: TitanEvidenceRecord[] }>(config, "/api/evidence/tail?n=20", true),
      readJsonResult<{ ok?: boolean }>(config, "/api/evidence/verify", true),
    ]);

    return {
      ...summarizeTitanTelemetry({
        recent: observations.body,
        evidence: evidence.body,
        verify: verify.body,
        observation: observations.body,
      }),
      diagnostics: {
        observations: observations.outcome,
        evidence: evidence.outcome,
        verify: verify.outcome,
      },
    };
  },
);
