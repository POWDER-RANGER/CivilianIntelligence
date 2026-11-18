import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/routes/api/civint/github/repository.ts", import.meta.url), "utf8");

test("public repository inspection refuses private or unverified visibility before contents fetch", () => {
  const guard = source.indexOf("if (root.private !== false)");
  const contents = source.indexOf('const raw = await gh(');
  assert.ok(guard > source.indexOf('const root = await gh('));
  assert.ok(contents > guard);
  assert.match(source.slice(guard, contents), /status: 404/);
});
