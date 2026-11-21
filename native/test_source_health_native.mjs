import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const react = readFileSync(new URL("./desktop/react-workspace.tsx", import.meta.url), "utf8");
const html = readFileSync(new URL("./desktop/shell/index.html", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/routes/api/civint/sources.ts", import.meta.url), "utf8");

test("bundled React source directory survives source health failure", () => {
  assert.match(react, /fetch\("\.\/source-catalog\.json"/);
  assert.match(react, /setHealthStatus\("error"\)/);
  assert.match(react, /Local sources remain accessible|local sources remain accessible/);
  assert.match(react, /filtered\.map\(s=>/);
  assert.match(html, /id="react-workspace"/);
  assert.doesNotMatch(html, /id="sources-panel"/);
});
test("React source health uses bounded unauthenticated GET", () => {
  const health = react.slice(react.indexOf('transport(API+"/api/civint/sources"'), react.indexOf('const filtered=useMemo'));
  assert.match(health, /method:"GET"/);
  assert.match(health, /credentials:"omit"/);
  assert.match(health, /signal:abort\.signal/);
  assert.match(health, /data\.sources\.length>200/);
  assert.match(api, /"Access-Control-Allow-Origin": "\*"/);
  assert.doesNotMatch(health, /Authorization|localStorage|sessionStorage/);
});
