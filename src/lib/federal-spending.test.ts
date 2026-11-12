import test from "node:test";
import assert from "node:assert/strict";
import { FEDERAL_MAX_PAGE, FEDERAL_PAGE_SIZE, FEDERAL_VIEWS, buildUpstreamBody, parseFederalRequest } from "./federal-spending";
import { parseRecordSearchFilters } from "./record-index";

test("accepts each named view with an optional page", () => {
  assert.deepEqual(parseFederalRequest({ view: "surveillance" }), { ok: true, view: "surveillance", page: 1 });
  assert.deepEqual(parseFederalRequest({ view: "largest", page: 3 }), { ok: true, view: "largest", page: 3 });
});

test("rejects arbitrary upstream bodies (the old pass-through shape)", () => {
  const legacy = parseFederalRequest({
    filters: { keywords: ["anything"] },
    fields: ["Award ID"],
    page: 1,
    limit: 100,
  });
  assert.equal(legacy.ok, false);
});

test("rejects unknown views, bad pages and non-objects", () => {
  for (const body of [
    null,
    [],
    "surveillance",
    { view: "toString" },
    { view: "__proto__" },
    { view: "unknown" },
    { view: "largest", page: 0 },
    { view: "largest", page: FEDERAL_MAX_PAGE + 1 },
    { view: "largest", page: 1.5 },
    { view: "largest", page: "2" },
    { view: "largest", extra: true },
  ]) assert.equal(parseFederalRequest(body).ok, false, JSON.stringify(body));
});

test("the upstream body is built only from server-owned filters", () => {
  const body = buildUpstreamBody("surveillance", 2);
  assert.deepEqual(body.filters, FEDERAL_VIEWS.surveillance.filters);
  assert.equal(body.page, 2);
  assert.equal(body.limit, FEDERAL_PAGE_SIZE);
});

test("record search bodies are validated before reaching the database", () => {
  assert.deepEqual(parseRecordSearchFilters({ query: "Flock", limit: 10 }), { ok: true, filters: { query: "Flock", limit: 10 } });
  for (const body of [
    null,
    [],
    { query: 5 },
    { query: "x".repeat(301) },
    { limit: 0 },
    { limit: 101 },
    { limit: "10" },
    { drop: "table" },
  ]) assert.equal(parseRecordSearchFilters(body).ok, false, JSON.stringify(body));
});
