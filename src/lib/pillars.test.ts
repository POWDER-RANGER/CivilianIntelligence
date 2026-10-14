import assert from "node:assert/strict";
import test from "node:test";
import {
  describeTitanProblem,
  getPillarHealthStatus,
  outcomeForFetchError,
  outcomeForHttpStatus,
  summarizeTitanTelemetry,
  type TitanDiagnostics,
} from "./pillars.ts";

test("reachable healthy pillar reports online", () => {
  assert.equal(getPillarHealthStatus({ status: "ok" }), "online");
  assert.equal(getPillarHealthStatus({ status: "online" }), "online");
});

test("reachable non-healthy pillar reports degraded", () => {
  assert.equal(getPillarHealthStatus({ status: "degraded" }), "degraded");
  assert.equal(getPillarHealthStatus({ status: "error" }), "degraded");
  assert.equal(getPillarHealthStatus({}), "degraded");
});

test("unreachable pillar reports unreachable, not degraded", () => {
  assert.equal(getPillarHealthStatus(null), "unreachable");
});

test("Titan evidence must explicitly verify before reporting healthy", () => {
  const recent = { samples: [] };
  const evidence = { records: [] };

  assert.equal(
    summarizeTitanTelemetry({ recent, evidence, verify: { ok: true } }).ok,
    true,
  );
  assert.equal(
    summarizeTitanTelemetry({ recent, evidence, verify: { ok: false } }).ok,
    false,
  );
  assert.equal(
    summarizeTitanTelemetry({ recent, evidence, verify: null }).ok,
    false,
  );
});

test("Titan verifier failure remains distinguishable from absent telemetry", () => {
  const broken = summarizeTitanTelemetry({
    recent: { samples: [] },
    evidence: null,
    verify: { ok: false },
  });
  assert.equal(broken.evidenceOk, false);
  assert.equal(broken.ok, false);

  const absent = summarizeTitanTelemetry({
    recent: null,
    evidence: null,
    verify: null,
  });
  assert.equal(absent.evidenceOk, null);
  assert.equal(absent.ok, false);
});


test("Titan observation envelope is preserved", () => {
  const result = summarizeTitanTelemetry({
    recent: { samples: [] },
    evidence: { records: [] },
    verify: { ok: true },
    observation: {
      state: "live",
      owner_scope: "user_device",
      limitations: ["observation only"],
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.state, "live");
  assert.equal(result.ownerScope, "user_device");
  assert.deepEqual(result.limitations, ["observation only"]);
});

test("HTTP status codes classify into actionable outcomes", () => {
  assert.equal(outcomeForHttpStatus(200), "ok");
  assert.equal(outcomeForHttpStatus(401), "unauthorized");
  assert.equal(outcomeForHttpStatus(403), "unauthorized");
  assert.equal(outcomeForHttpStatus(404), "not_found");
  assert.equal(outcomeForHttpStatus(502), "http_error");
});

test("fetch timeouts are distinguished from other network failures", () => {
  assert.equal(outcomeForFetchError(Object.assign(new Error("t"), { name: "TimeoutError" })), "timeout");
  assert.equal(outcomeForFetchError(Object.assign(new Error("a"), { name: "AbortError" })), "timeout");
  assert.equal(outcomeForFetchError(new TypeError("fetch failed")), "network");
  assert.equal(outcomeForFetchError(null), "network");
});

const allOk: TitanDiagnostics = { observations: "ok", evidence: "ok", verify: "ok" };
const failing = (d: Partial<TitanDiagnostics>, evidenceOk: boolean | null = null) => ({
  ok: false,
  evidenceOk,
  diagnostics: { ...allOk, ...d },
});

test("healthy verified telemetry produces no problem", () => {
  assert.equal(
    describeTitanProblem({ status: "online", reason: "ok" }, { ok: true, evidenceOk: true, diagnostics: allOk }),
    null,
  );
});

test("unconfigured endpoint is not retryable", () => {
  const p = describeTitanProblem({ status: "unconfigured", reason: "unconfigured" }, failing({}));
  assert.equal(p?.kind, "unconfigured");
  assert.equal(p?.retryable, false);
});

test("cold-start timeout is reported as waking and retryable, not unreachable", () => {
  const t = { observations: "timeout", evidence: "timeout", verify: "timeout" } as const;
  for (const reason of ["timeout", "network"] as const) {
    const p = describeTitanProblem({ status: "unreachable", reason }, failing(t));
    assert.equal(p?.kind, "waking");
    assert.equal(p?.retryable, true);
  }
});

test("token mismatch is surfaced as a credentials problem", () => {
  const p = describeTitanProblem(
    { status: "online", reason: "ok" },
    failing({ observations: "unauthorized", evidence: "unauthorized", verify: "unauthorized" }),
  );
  assert.equal(p?.kind, "unauthorized");
  assert.equal(p?.retryable, false);
  assert.match(p!.message, /CELL_TITAN_API_TOKEN/);
});

test("missing observation route identifies an outdated Titan build", () => {
  const p = describeTitanProblem({ status: "online", reason: "ok" }, failing({ observations: "not_found" }, true));
  assert.equal(p?.kind, "outdated_service");
  assert.match(p!.message, /0\.1\.3/);
});

test("credentials take precedence over the outdated-build diagnosis", () => {
  const p = describeTitanProblem(
    { status: "online", reason: "ok" },
    failing({ observations: "not_found", evidence: "unauthorized" }),
  );
  assert.equal(p?.kind, "unauthorized");
});

test("evidence verification failure is not masked as a connectivity problem", () => {
  const p = describeTitanProblem({ status: "online", reason: "ok" }, failing({}, false));
  assert.equal(p?.kind, "unverified");
  assert.equal(p?.retryable, false);
});

test("health ok but telemetry timing out is still retryable", () => {
  const p = describeTitanProblem({ status: "online", reason: "ok" }, failing({ evidence: "timeout" }));
  assert.equal(p?.kind, "waking");
  assert.equal(p?.retryable, true);
});

test("verified evidence without the observation contract is not healthy", () => {
  const result = summarizeTitanTelemetry({
    recent: null,
    evidence: { records: [] },
    verify: { ok: true },
    observation: null,
  });
  assert.equal(result.evidenceOk, true);
  assert.equal(result.ok, false);
});
