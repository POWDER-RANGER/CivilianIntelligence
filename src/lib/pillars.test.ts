import assert from "node:assert/strict";
import test from "node:test";
import { getPillarHealthStatus, summarizeTitanTelemetry } from "./pillars.ts";

test("reachable healthy pillar reports online", () => {
  assert.equal(getPillarHealthStatus({ status: "ok" }), "online");
  assert.equal(getPillarHealthStatus({ status: "online" }), "online");
});

test("reachable non-healthy pillar reports degraded", () => {
  assert.equal(getPillarHealthStatus({ status: "degraded" }), "degraded");
  assert.equal(getPillarHealthStatus({ status: "error" }), "degraded");
  assert.equal(getPillarHealthStatus({}), "degraded");
});

test("unreachable pillar reports degraded", () => {
  assert.equal(getPillarHealthStatus(null), "degraded");
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
