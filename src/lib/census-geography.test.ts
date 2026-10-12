// Regression for live audit 2026-10-11 P0-3: location context returned
// city/county/state = null for every coordinate. Fixtures are real Census
// Geocoder responses (trimmed to the fields the parser reads), captured
// 2026-10-11 for the three coordinates the audit tested plus an open-ocean point.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveGeography } from "./census-geography";

const fixture = (name: string) =>
  JSON.parse(readFileSync(new URL(`./__fixtures__/census-${name}.json`, import.meta.url), "utf8"));

test("Chicago-area coordinate resolves place, county, state, districts", () => {
  const g = resolveGeography(fixture("chicago-area"));
  assert.equal(g.city, "Palos Hills");
  assert.equal(g.county, "Cook County");
  assert.equal(g.state, "Illinois");
  assert.equal(g.stateAbbr, "IL");
  assert.match(g.congressionalDistrict ?? "", /Congressional District/);
});

test("Austin coordinate resolves", () => {
  const g = resolveGeography(fixture("austin"));
  assert.equal(g.city, "Austin");
  assert.equal(g.county, "Travis County");
  assert.equal(g.state, "Texas");
});

test("NYC coordinate resolves", () => {
  const g = resolveGeography(fixture("nyc"));
  assert.equal(g.city, "New York");
  assert.equal(g.county, "New York County");
  assert.equal(g.state, "New York");
});

test("a point outside U.S. geography resolves to honest nulls", () => {
  const g = resolveGeography(fixture("ocean"));
  assert.equal(g.city, null);
  assert.equal(g.county, null);
  assert.equal(g.state, null);
});

test("malformed payloads never throw", () => {
  for (const payload of [null, undefined, {}, { result: null }, { result: { geographies: { States: "x" } } }]) {
    assert.equal(resolveGeography(payload).state, null);
  }
});
