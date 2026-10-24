import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  API_ROUTE_METHODS,
  CONTENT_SECURITY_POLICY,
  FixedWindowLimiter,
  apiContractResponse,
  clientKey,
  matchApiRoute,
  rateLimitRule,
  securityHeaders,
  withHeaders,
} from "./http-security";

function apiRouteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? apiRouteFiles(full) : full.endsWith(".ts") ? [full] : [];
  });
}

test("API_ROUTE_METHODS matches every server handler under src/routes/api", () => {
  const discovered: Record<string, string[]> = {};
  for (const file of apiRouteFiles(join(process.cwd(), "src/routes/api"))) {
    const source = readFileSync(file, "utf8");
    const path = /createFileRoute\("([^"]+)"\)/.exec(source)?.[1];
    if (!path) continue;
    const handlers = /handlers:\s*\{([\s\S]*)/.exec(source)?.[1] ?? "";
    discovered[path] = ["GET", "POST", "PUT", "PATCH", "DELETE"].filter((m) =>
      new RegExp(`(^|[\\s{,])${m}\\s*:`).test(handlers),
    );
  }
  const declared = Object.fromEntries(Object.entries(API_ROUTE_METHODS).map(([k, v]) => [k, [...v]]));
  assert.deepEqual(declared, discovered);
});

test("unknown API paths answer JSON 404, never the SPA document", async () => {
  const res = apiContractResponse("/api/does-not-exist", "GET");
  assert.ok(res);
  assert.equal(res.status, 404);
  assert.equal((await res.json()).state, "not-found");
});

test("unsupported methods answer 405 with an Allow header", async () => {
  const res = apiContractResponse("/api/civint/finance/federal", "GET");
  assert.ok(res);
  assert.equal(res.status, 405);
  assert.equal(res.headers.get("allow"), "POST, OPTIONS");
  assert.equal((await res.json()).state, "method-not-allowed");
});

test("supported methods, HEAD on GET routes and dynamic segments pass through", () => {
  assert.equal(apiContractResponse("/api/health", "GET"), null);
  assert.equal(apiContractResponse("/api/health", "HEAD"), null);
  assert.equal(apiContractResponse("/api/civint/records/search", "POST"), null);
  assert.equal(apiContractResponse("/api/civint/records/abc-123", "GET"), null);
  assert.equal(matchApiRoute("/api/civint/records/abc-123")?.pattern, "/api/civint/records/$id");
});

test("OPTIONS answers 204 with the allowed methods", () => {
  const res = apiContractResponse("/api/civint/records/search", "OPTIONS");
  assert.equal(res?.status, 204);
  assert.equal(res?.headers.get("allow"), "GET, POST, HEAD, OPTIONS");
});

test("Better Auth and non-API paths are left alone", () => {
  assert.equal(apiContractResponse("/api/auth/get-session", "GET"), null);
  assert.equal(apiContractResponse("/records", "GET"), null);
  assert.equal(apiContractResponse("/apiary", "GET"), null);
  assert.equal(rateLimitRule("/records", "GET"), null);
});

test("security headers include CSP, framing, sniffing, referrer, permissions; HSTS only over HTTPS", () => {
  const https = securityHeaders({ https: true });
  for (const name of [
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Strict-Transport-Security",
  ]) assert.ok(https[name], name);
  assert.equal(securityHeaders({ https: false })["Strict-Transport-Security"], undefined);
  assert.ok(securityHeaders({ https: true, cspReportOnly: true })["Content-Security-Policy-Report-Only"]);
  assert.match(CONTENT_SECURITY_POLICY, /frame-ancestors 'none'/);
  assert.match(CONTENT_SECURITY_POLICY, /object-src 'none'/);
});

test("withHeaders keeps existing values and works on immutable responses", () => {
  const mutable = withHeaders(new Response("x", { headers: { "X-Frame-Options": "SAMEORIGIN" } }), {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
  });
  assert.equal(mutable.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.equal(mutable.headers.get("x-content-type-options"), "nosniff");
  const immutable = withHeaders(Response.redirect("https://example.org/", 302), { "X-Content-Type-Options": "nosniff" });
  assert.equal(immutable.headers.get("x-content-type-options"), "nosniff");
  assert.equal(immutable.status, 302);
});

test("upstream-calling routes and writes get the tighter rate limit", () => {
  assert.equal(rateLimitRule("/api/civint/finance/federal", "POST")?.limit, 30);
  assert.equal(rateLimitRule("/api/civint/records/search", "POST")?.limit, 30);
  assert.equal(rateLimitRule("/api/civint/records/search", "GET")?.limit, 120);
  assert.equal(rateLimitRule("/api/auth/sign-in", "POST"), null);
});

test("fixed-window limiter blocks past the limit and resets after the window", () => {
  const limiter = new FixedWindowLimiter();
  const rule = { limit: 3, windowMs: 1000 };
  assert.equal(limiter.hit("a", rule, 0), 0);
  assert.equal(limiter.hit("a", rule, 10), 0);
  assert.equal(limiter.hit("a", rule, 20), 0);
  assert.equal(limiter.hit("a", rule, 30), 1);
  assert.equal(limiter.hit("b", rule, 30), 0, "keys are independent");
  assert.equal(limiter.hit("a", rule, 1000), 0, "window resets");
});

test("limiter memory stays bounded", () => {
  const limiter = new FixedWindowLimiter(5);
  const rule = { limit: 1, windowMs: 60_000 };
  for (let i = 0; i < 50; i++) limiter.hit(`k${i}`, rule, 0);
  assert.ok((limiter as unknown as { buckets: Map<string, unknown> }).buckets.size <= 5);
});

test("client key uses the first forwarded hop", () => {
  assert.equal(clientKey(new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })), "203.0.113.9");
  assert.equal(clientKey(new Headers()), "unknown");
});
