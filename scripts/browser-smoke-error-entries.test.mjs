import test from "node:test";
import assert from "node:assert/strict";
import { compareToBaseline, exitCodeFor } from "./browser-smoke-verdict.mjs";

const viewport = () => ({ status: 200, title: "Page", hasCanvas: false, horizontalOverflow: false, bodyTextLen: 100, bodyTextHash: "same", consoleErrors: [], pageErrors: [] });

test("malformed browser error entries fail smoke exit validation", () => {
  for (const field of ["consoleErrors", "pageErrors"]) {
    for (const entry of [null, 0, false, {}, ["error"]]) {
      assert.equal(exitCodeFor({ desktop: { ...viewport(), [field]: [entry] } }), 1);
    }
  }
});

test("malformed browser error entries fail baseline comparison on either side", () => {
  for (const field of ["consoleErrors", "pageErrors"]) {
    for (const side of ["current", "baseline"]) {
      const current = { viewports: { desktop: viewport() } };
      const baseline = { viewports: { desktop: viewport() } };
      (side === "current" ? current : baseline).viewports.desktop[field] = [null];
      const result = compareToBaseline(current, baseline);
      assert.equal(result.divergesFromBaseline, true);
      assert.match(result.reasons.join(";"), new RegExp(`malformed ${side} ${field} collection`));
    }
  }
});
