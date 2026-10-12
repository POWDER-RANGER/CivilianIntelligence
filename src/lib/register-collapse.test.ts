import test from "node:test";
import assert from "node:assert/strict";
import { collapseRegisterDuplicates } from "./register-collapse";

const doc = (title: string, url: string, date = "2026-10-13", type = "Rule") => ({
  title, html_url: url, publication_date: date, type, agencies: [{ name: "Coast Guard" }],
});

test("same-day identical titles collapse with a visible count (P1-15)", () => {
  const out = collapseRegisterDuplicates([
    doc("Safety Zone; Brandon Road Lock", "a"),
    doc("Safety Zone; Brandon Road Lock", "b"),
    doc("Safety Zone; Brandon Road Lock", "c"),
    doc("Columbus Day, 2026", "d", "2026-10-13", "Presidential Document"),
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].duplicateCount, 3);
  assert.equal(out[0].html_url, "a");
  assert.equal(out[1].duplicateCount, undefined);
});

test("different dates or types are not collapsed", () => {
  const out = collapseRegisterDuplicates([doc("X", "a", "2026-10-12"), doc("X", "b", "2026-10-13"), doc("X", "c", "2026-10-13", "Notice")]);
  assert.equal(out.length, 3);
});
