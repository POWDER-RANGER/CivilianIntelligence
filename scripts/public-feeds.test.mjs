// public/civint/*.json are fetched by the desks with a fail-soft loader, so a
// syntax error silently hides a whole section (live audit: atlas_surveillance.json
// had a trailing comma). Keep every bundled feed parseable.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const dir = new URL("../public/civint/", import.meta.url);

test("every bundled CIVINT feed is valid JSON", () => {
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  assert.ok(files.length > 0);
  for (const file of files) {
    assert.doesNotThrow(() => JSON.parse(readFileSync(new URL(file, dir), "utf8")), file);
  }
});
