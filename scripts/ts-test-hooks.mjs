// Resolve hook for `node --experimental-strip-types --test` on src/**/*.test.ts.
// App code uses extensionless relative imports and the `@/` alias (Vite resolves
// both); plain Node does not. This maps them to real .ts/.tsx files so unit
// tests exercise the same modules the app ships.
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";
const SRC = resolvePath(process.cwd(), "src");
const EXT = [".ts", ".tsx", "/index.ts", "/index.tsx"];
function tryFile(base) {
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const ext of EXT) if (existsSync(base + ext)) return base + ext;
  return null;
}
export async function resolve(specifier, context, next) {
  let base = null;
  if (specifier.startsWith("@/")) base = resolvePath(SRC, specifier.slice(2));
  else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:"))
    base = resolvePath(fileURLToPath(new URL(".", context.parentURL)), specifier);
  if (base) {
    const hit = tryFile(base);
    if (hit) return next(pathToFileURL(hit).href, context);
  }
  return next(specifier, context);
}
`),
);
