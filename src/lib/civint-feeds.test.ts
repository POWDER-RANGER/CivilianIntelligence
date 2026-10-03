import assert from "node:assert/strict";
import { test } from "node:test";
import { formatUsd, normalizeAwards } from "./civint-feeds.ts";

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
