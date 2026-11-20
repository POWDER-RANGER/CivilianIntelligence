import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const js = readFileSync(new URL("./desktop/shell/native.js", import.meta.url), "utf8");
const html = readFileSync(new URL("./desktop/shell/index.html", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/routes/api/civint/sources.ts", import.meta.url), "utf8");

test("local directory remains available independently of live health checks", () => {
  assert.match(js, /fetch\("\.\/source-catalog\.json"/);
  assert.match(js, /if \(health\) \{/);
  assert.match(js, /healthBySource = next/);
  assert.match(js, /The bundled source directory remains accessible/);
  assert.match(html, /id="source-refresh"/);
  assert.match(html, /id="source-health-status"/);
});
test("public source health requests omit credentials and remain read-only", () => {
  const functionBody = js.slice(js.indexOf("async function refreshSourceHealth"));
  assert.match(functionBody, /method: "GET"/);
  assert.match(functionBody, /credentials: "omit"/);
  assert.match(functionBody, /signal: controller\.signal/);
  assert.match(functionBody, /data\.sources\.length > 200/);
  assert.match(api, /"Access-Control-Allow-Origin": "\*"/);
  assert.doesNotMatch(functionBody, /Authorization|localStorage|sessionStorage/);
});
