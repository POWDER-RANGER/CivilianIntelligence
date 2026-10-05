import test from "node:test";
import assert from "node:assert/strict";
import { canonicalRecordId, normalizeIdentifiers, sha256Content } from "./record-index";

test("canonical record IDs are stable and source-scoped", () => {
  assert.equal(
    canonicalRecordId("usaspending", "ABC-123"),
    canonicalRecordId("usaspending", "ABC-123"),
  );
  assert.notEqual(
    canonicalRecordId("usaspending", "ABC-123"),
    canonicalRecordId("sec-edgar", "ABC-123"),
  );
});

test("identifier normalization de-duplicates case-insensitively", () => {
  assert.deepEqual(
    normalizeIdentifiers(["  HR-1 ", "hr-1", "", "S. 2"]),
    ["HR-1", "S. 2"],
  );
});

test("SHA-256 records the supplied bytes deterministically", () => {
  assert.equal(
    sha256Content("CIVINT record"),
    "ed7bc3850c296401176d540dea0a244458c8079ddbc714a84e12015d5b17cf11",
  );
});
