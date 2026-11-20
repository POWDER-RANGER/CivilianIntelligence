import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
test("native source catalog is generated from the canonical public registry", () => {
  const catalog = resolve(root, "shell/source-catalog.json");
  const before = readFileSync(catalog, "utf8");
  execFileSync(process.execPath, [resolve(root, "build-source-catalog.mjs")]);
  assert.equal(readFileSync(catalog, "utf8"), before);
  const parsed = JSON.parse(before);
  assert.equal(parsed.schema, 1);
  assert.ok(parsed.sources.length >= 10);
  assert.equal(new Set(parsed.sources.map(s => s.id)).size, parsed.sources.length);
  for (const source of parsed.sources) {
    assert.ok(source.name && source.attribution && source.license);
    const url = new URL(source.endpoint);
    assert.equal(url.protocol, "https:");
    assert.equal(url.username, "");
    assert.equal(url.password, "");
  }
});
test("local navigation renders the bundled directory without remote data or HTML injection", () => {
  const js = readFileSync(resolve(root, "shell/native.js"), "utf8");
  const html = readFileSync(resolve(root, "shell/index.html"), "utf8");
  assert.match(js, /fetch\("\.\/source-catalog\.json"/);
  assert.match(js, /createElement\("article"\)/);
  assert.match(js, /textContent = source\.name/);
  assert.doesNotMatch(js, /innerHTML/);
  assert.match(html, /id="sources-panel"/);
  assert.match(html, /id="source-search"/);
});
