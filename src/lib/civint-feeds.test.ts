import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatUsd,
  getCivintAlpr,
  getCivintAlprSnapshot,
  isRecipientMatch,
  normalizeAwards,
  snapshotAgeDays,
  summarizeAlpr,
  topRecipients,
  totalAwardAmount,
  usaspendingAwardUrl,
  type CivintAlprNode,
} from "./civint-feeds.ts";

test("normalizeAwards collapses legacy per-term rows into one award, sorted by amount", () => {
  const out = normalizeAwards([
    { award_id: "A1", term: "Flock Safety", matched_by: "keywords", recipient: "R", amount: 10 },
    { award_id: "A1", term: "Flock Group", matched_by: "recipient_search_text", recipient: "R", amount: 12 },
    { award_id: "B2", term: "license plate reader", recipient: "S", amount: 99 },
  ]);
  assert.deepEqual(out.map((a) => a.award_id), ["B2", "A1"]);
  assert.deepEqual(out[1].terms, ["Flock Group", "Flock Safety"]);
  assert.equal(out[1].amount, 12);
});

test("normalizeAwards keeps current-shape rows and tolerates junk", () => {
  const out = normalizeAwards([
    { internal_id: "x", award_id: "A", terms: ["t"], matched_by: ["keywords"], amount: 5 },
    null,
    "str",
    { amount: 7 },
    { internal_id: "y", amount: "nope" },
  ]);
  assert.deepEqual(out.map((a) => a.internal_id), ["x", "y"]);
  assert.equal(out[1].amount, 0);
  assert.deepEqual(normalizeAwards({ not: "an array" }), []);
});

test("formatUsd", () => {
  assert.equal(formatUsd(2_500_000), "$2.5M");
  assert.equal(formatUsd(12_000), "$12K");
  assert.equal(formatUsd(42), "$42");
});

const node = (id: number, tags: Record<string, string>): CivintAlprNode => ({ type: "node", id, lat: 0, lon: 0, tags });

test("summarizeAlpr groups operators case-insensitively and counts direction tags", () => {
  const s = summarizeAlpr([
    node(1, { operator: "Flock Safety", direction: "90" }),
    node(2, { operator: "flock safety" }),
    node(3, { brand: "Vigilant", "camera:direction": "180" }),
    node(4, {}),
    node(5, { operator: "  " }),
  ]);
  assert.equal(s.total, 5);
  assert.equal(s.withOperator, 3);
  assert.equal(s.withDirection, 2);
  assert.deepEqual(s.operators, [
    { name: "Flock Safety", count: 2 },
    { name: "Vigilant", count: 1 },
  ]);
  assert.deepEqual(summarizeAlpr([]), { total: 0, withOperator: 0, withDirection: 0, operators: [] });
});

test("snapshotAgeDays handles null, junk, clock skew and normal ages", () => {
  const now = Date.parse("2026-10-03T00:00:00Z");
  assert.equal(snapshotAgeDays(null, now), null);
  assert.equal(snapshotAgeDays("not a date", now), null);
  assert.equal(snapshotAgeDays("2026-09-30T20:21:22Z", now), 2);
  assert.equal(snapshotAgeDays("2026-10-09T00:00:00Z", now), 0);
});

test("award helpers: totals, recipient ranking, match strength, record URL", () => {
  const awards = normalizeAwards([
    { internal_id: "a", award_id: "A", recipient: "Flock Group Inc", amount: 100, terms: ["Flock Safety"], matched_by: ["recipient_search_text"] },
    { internal_id: "b", award_id: "B", recipient: "flock group inc", amount: 50, terms: ["license plate reader"], matched_by: ["keywords"] },
    { internal_id: "c", award_id: "C", recipient: "Other LLC", amount: 500, terms: ["license plate reader"], matched_by: ["keywords"] },
  ]);
  assert.equal(totalAwardAmount(awards), 650);
  assert.deepEqual(topRecipients(awards, 2), [
    { recipient: "Other LLC", total: 500, count: 1 },
    { recipient: "Flock Group Inc", total: 150, count: 2 },
  ]);
  assert.deepEqual(awards.map(isRecipientMatch).sort(), [false, false, true]);
  assert.equal(usaspendingAwardUrl("CONT_AWD_X/1"), "https://www.usaspending.gov/award/CONT_AWD_X%2F1");
});

test("ALPR loaders read the ingest file shape and fail soft", async () => {
  const real = globalThis.fetch;
  try {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          generator: "civint_ingest",
          osm3s: { timestamp_osm_base: "2026-09-30T20:21:22Z" },
          elements: [{ type: "node", id: 1, lat: 41.6, lon: -91.5, tags: { operator: "Flock Safety" } }],
        }),
      )) as typeof fetch;
    const snap = await getCivintAlprSnapshot();
    assert.equal(snap.asOf, "2026-09-30T20:21:22Z");
    assert.equal(snap.generator, "civint_ingest");
    assert.equal(snap.nodes.length, 1);
    assert.equal((await getCivintAlpr()).length, 1);

    globalThis.fetch = (async () => new Response("nope", { status: 404 })) as typeof fetch;
    assert.deepEqual(await getCivintAlprSnapshot(), { nodes: [], asOf: null, generator: null });

    globalThis.fetch = (async () => {
      throw new Error("offline");
    }) as typeof fetch;
    assert.deepEqual(await getCivintAlprSnapshot(), { nodes: [], asOf: null, generator: null });
  } finally {
    globalThis.fetch = real;
  }
});
