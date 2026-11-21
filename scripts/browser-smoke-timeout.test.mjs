import assert from "node:assert/strict";
import test from "node:test";
import { parseBrowserSmokeTimeout } from "./browser-smoke-verdict.mjs";
for (const invalid of ["0x10", "1e3", "+100", " 100", "100 ", "01", "0", "-1", "1.5", "Infinity", "9007199254740992"]) {
  test(`rejects malformed timeout ${JSON.stringify(invalid)}`, () => {
    assert.equal(parseBrowserSmokeTimeout(invalid), null);
  });
}
test("accepts positive decimal timeout", () => {
  assert.equal(parseBrowserSmokeTimeout("45000"), 45000);
  assert.equal(parseBrowserSmokeTimeout(undefined), 45000);
});
