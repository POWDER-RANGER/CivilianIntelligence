// Unit tests for the place dossier building blocks. Network-free: tile math,
// distance, tallies, coordinate parsing, Census address-match parsing, and
// USAspending row normalization.
import test from "node:test";
import assert from "node:assert/strict";
import { haversineMiles, lonLatToTile, tilesCovering, tally, summarize } from "./alpr-nearby";
import { parseCoordinates, readCensusAddressMatch } from "./place-geocode";
import { isRelevantAward, normalizeAward } from "./place-spending";

test("lonLatToTile matches the known z12 tile for downtown Chicago", () => {
  assert.deepEqual(lonLatToTile(-87.6298, 41.8781, 12), { x: 1050, y: 1522 });
});

test("haversine: one degree of latitude is ~69 miles", () => {
  const d = haversineMiles(40, -90, 41, -90);
  assert.ok(d > 68.9 && d < 69.2, `got ${d}`);
});

test("tilesCovering a 5-mile radius returns a small contiguous block", () => {
  const tiles = tilesCovering(41.8781, -87.6298, 5);
  assert.ok(tiles.length >= 4 && tiles.length <= 16, `got ${tiles.length}`);
  assert.ok(tiles.some((t) => t.x === 1050 && t.y === 1522));
});

test("tally groups unknowns and sorts by count", () => {
  assert.deepEqual(tally(["A", null, "B", "A", null, null], "Unknown"), [
    { name: "Unknown", count: 3 },
    { name: "A", count: 2 },
    { name: "B", count: 1 },
  ]);
});

test("summarize filters by radius, dedupes, and orders nearest first", () => {
  const cam = (id: string, lat: number, lon: number, operator: string | null) => ({
    id, latitude: lat, longitude: lon, operator, brand: null, direction: null, mountType: null, zone: null, osmUrl: null, lastEdited: null,
  });
  const s = summarize(41.8, -87.6, 2, [
    cam("a", 41.8, -87.6, "City PD"),
    cam("a", 41.8, -87.6, "City PD"),
    cam("b", 41.81, -87.6, null),
    cam("far", 42.5, -87.6, "Elsewhere PD"),
  ], 4, 0);
  assert.equal(s.total, 2);
  assert.equal(s.withinOneMile, 2);
  assert.equal(s.nearest[0].id, "a");
  assert.deepEqual(s.operators.map((o) => o.name), ["City PD", "Operator not recorded"]);
});

test("parseCoordinates accepts lat,lon and rejects out-of-range and text", () => {
  assert.deepEqual(parseCoordinates("41.70, -87.82"), { lat: 41.7, lon: -87.82 });
  assert.deepEqual(parseCoordinates("41.70 -87.82"), { lat: 41.7, lon: -87.82 });
  assert.equal(parseCoordinates("Austin, TX"), null);
  assert.equal(parseCoordinates("95, 10"), null);
});

test("readCensusAddressMatch extracts point and jurisdiction from a one-line match", () => {
  const hit = readCensusAddressMatch({
    result: {
      addressMatches: [{
        matchedAddress: "10400 S ROBERTS RD, PALOS HILLS, IL, 60465",
        coordinates: { x: -87.8173, y: 41.7021 },
        geographies: {
          States: [{ NAME: "Illinois", STUSAB: "IL", GEOID: "17" }],
          Counties: [{ NAME: "Cook County", GEOID: "17031" }],
          "Incorporated Places": [{ NAME: "Palos Hills city", BASENAME: "Palos Hills", GEOID: "1757368" }],
          "120th Congressional Districts": [{ NAME: "Congressional District 6" }],
        },
      }],
    },
  });
  assert.ok(hit);
  assert.equal(hit.lat, 41.7021);
  assert.equal(hit.geography.city, "Palos Hills");
  assert.equal(hit.geography.countyGeoid, "17031");
  assert.equal(hit.geography.congressionalDistrict, "Congressional District 6");
  assert.equal(readCensusAddressMatch({ result: { addressMatches: [] } }), null);
});

test("normalizeAward builds an award-page URL and tolerates missing fields", () => {
  const a = normalizeAward({ "Award ID": "X1", "Recipient Name": "ALSIP VILLAGE OF", "Award Amount": 372000, generated_internal_id: "ASST_NON_X1" }, "grant");
  assert.ok(a);
  assert.equal(a.url, "https://www.usaspending.gov/award/ASST_NON_X1");
  assert.equal(a.amount, 372000);
  assert.equal(normalizeAward({ "Award ID": "" }, "contract"), null);
});

test("isRelevantAward keeps surveillance-tech awards and drops loose keyword hits", () => {
  const base = { id: "1", kind: "grant" as const, amount: 1, agency: null, startDate: null, url: "" };
  assert.equal(isRelevantAward({ ...base, recipient: "ALSIP VILLAGE OF", description: "Purchase of license plate readers" }), true);
  assert.equal(isRelevantAward({ ...base, recipient: "SOUNDTHINKING, INC.", description: null }), true);
  assert.equal(isRelevantAward({ ...base, recipient: "TCA HEALTH, INC. NFP", description: "Expanded hours health center program" }), false);
});
