import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(root, "../../src/lib/sources.ts"), "utf8");
const fields = ["id", "name", "category", "endpoint", "license", "attribution", "cadence", "nativeSurface"];
const blocks = source.match(/export const SOURCES:[\s\S]*?= \[([\s\S]*?)\n\];/);
if (!blocks) throw new Error("Source registry not found");
const entries = [];
for (const block of blocks[1].matchAll(/\{([^{}]+)\}/g)) {
  const entry = {};
  for (const field of fields) {
    const match = block[1].match(new RegExp("^\\s*" + field + ":\\s*(\"(?:[^\"\\\\]|\\\\.)*\")\\s*,?", "m"));
    if (!match) throw new Error("Missing or nonliteral source field " + field);
    entry[field] = JSON.parse(match[1]);
  }
  const url = new URL(entry.endpoint);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Unsafe source endpoint");
  entries.push(entry);
}
if (entries.length < 5 || new Set(entries.map(s => s.id)).size !== entries.length) throw new Error("Invalid source catalog");
const target = resolve(root, "shell/source-catalog.json");
writeFileSync(target, JSON.stringify({schema: 1, sources: entries}, null, 2) + "\n");
console.log("Bundled " + entries.length + " public source definitions");
