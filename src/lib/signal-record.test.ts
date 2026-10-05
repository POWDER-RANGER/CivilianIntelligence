import test from "node:test";
import assert from "node:assert/strict";
import { ABSENCE_DISCLAIMER, MATCH_THRESHOLDS, absenceLabel, visibleMatch } from "./signal-record.ts";

test("Signal vs Record absence language stays non-absolute", () => {
  assert.equal(absenceLabel(false), "No matching indexed public record found in this window.");
  assert.match(ABSENCE_DISCLAIMER, /does not establish that no record exists/);
});

test("match visibility uses explainable thresholds", () => {
  assert.equal(MATCH_THRESHOLDS.defaultMin, 0.4);
  assert.equal(visibleMatch(0.39), false);
  assert.equal(visibleMatch(0.4), true);
  assert.equal(visibleMatch(0.3), false);
  assert.equal(visibleMatch(0.3, true), true);
});
