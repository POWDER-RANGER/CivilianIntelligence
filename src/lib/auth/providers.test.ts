import assert from "node:assert/strict";
import { test } from "node:test";
import { GROK_PROVIDERS } from "./providers.ts";

test("broker-backed OAuth provider IDs are unique and distinct from upstream hints", () => {
  assert.ok(GROK_PROVIDERS.length > 0);
  const ids = GROK_PROVIDERS.map(({ providerId }) => providerId);
  assert.equal(new Set(ids).size, ids.length, "duplicate local OAuth provider ID");
  for (const { providerId, idp, label } of GROK_PROVIDERS) {
    assert.match(providerId, /^grok-[a-z0-9-]+$/);
    assert.ok(idp.trim(), `missing upstream broker hint for ${providerId}`);
    assert.ok(label.trim(), `missing sign-in label for ${providerId}`);
    assert.notEqual(providerId, idp, "broker-local provider ID must not be replaced by upstream social ID");
  }
});
