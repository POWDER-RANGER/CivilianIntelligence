import test from "node:test";
import assert from "node:assert/strict";
import { GUIDE_DISCLAIMER, GUIDE_DESTINATIONS, guideSuggestions } from "./navigator-guide.ts";

test("natural-language requests route to relevant evidence desks", () => {
  assert.equal(guideSuggestions("show me an ALPR camera map")[0]?.to, "/watchtower");
  assert.equal(guideSuggestions("Show me mapped cameras")[0]?.to, "/watchtower");
  assert.equal(guideSuggestions("Find federal contracts")[0]?.to, "/finance");
  assert.equal(guideSuggestions("where can I file a FOIA request?")[0]?.to, "/toolkit");
  assert.equal(guideSuggestions("who received federal spending contracts?")[0]?.to, "/finance");
  assert.equal(guideSuggestions("locate an address near me")[0]?.to, "/place");
});

test("does not invent routes for unknown questions or substring collisions", () => {
  assert.deepEqual(guideSuggestions(""), []);
  assert.deepEqual(guideSuggestions("camouflage"), []);
  assert.deepEqual(guideSuggestions("explain an unusual dream"), []);
  assert.ok(guideSuggestions("find a public record").length <= 3);
});

test("all suggested routes are registered once and assistant discloses limits", () => {
  assert.equal(new Set(GUIDE_DESTINATIONS.map((entry) => entry.to)).size, GUIDE_DESTINATIONS.length);
  assert.match(GUIDE_DISCLAIMER, /does not verify/);
});
