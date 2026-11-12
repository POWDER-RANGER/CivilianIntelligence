/**
 * HTTP hardening shared by the Nitro middleware (`server/middleware/00-security.ts`)
 * and its unit tests. Roadmap items P1-1 (security headers), P1-2 (API method
 * contract) and P1-5 (rate and size limits).
 *
 * Pure functions only: no Nitro/h3 imports, so `node --test` can exercise them.
 */

/**
 * Every first-party API route and the methods its server handler implements.
 * `api-routes.test.ts` fails if this drifts from `src/routes/api/**`.
 */
export const API_ROUTE_METHODS: Readonly<Record<string, readonly string[]>> = {
  "/api/health": ["GET"],
  "/api/civint/alpr/data": ["GET"],
  "/api/civint/place/dossier": ["GET"],
  "/api/civint/records/search": ["GET", "POST"],
  "/api/civint/records/$id": ["GET"],
  "/api/civint/finance/federal": ["POST"],
  "/api/civint/finance/sec": ["GET"],
  "/api/civint/location/context": ["POST"],
  "/api/civint/github/repository": ["GET"],
  "/api/civint/oversight/foia": ["GET"],
  "/api/civint/legislation/congress": ["GET"],
  "/api/civint/sources": ["GET"],
};

/** Routes whose handlers call a third-party API on every request. */
export const UPSTREAM_ROUTES: ReadonlySet<string> = new Set([
  "/api/civint/alpr/data",
  "/api/civint/place/dossier",
  "/api/civint/finance/federal",
  "/api/civint/finance/sec",
  "/api/civint/location/context",
  "/api/civint/github/repository",
  "/api/civint/oversight/foia",
  "/api/civint/legislation/congress",
]);

/** Paths owned by other handlers (Better Auth) that this layer must not reinterpret. */
const PASSTHROUGH_PREFIXES = ["/api/auth/"];

/** Maximum accepted request body for any API write, in bytes. */
export const MAX_API_BODY_BYTES = 32 * 1024;

function routePattern(pattern: string): RegExp {
  const escaped = pattern
    .split("/")
    .map((segment) => (segment.startsWith("$") ? "[^/]+" : segment.replace(/[.*+?^{}()|[\]\\]/g, "\\$&")))
    .join("/");
  return new RegExp(`^${escaped}/?$`);
}

const COMPILED_ROUTES = Object.entries(API_ROUTE_METHODS).map(
  ([pattern, methods]) => ({ pattern, re: routePattern(pattern), methods }),
);

/** The declared route pattern for a concrete path, or null when none matches. */
export function matchApiRoute(pathname: string): { pattern: string; methods: readonly string[] } | null {
  for (const route of COMPILED_ROUTES) {
    if (route.re.test(pathname)) return { pattern: route.pattern, methods: route.methods };
  }
  return null;
}

export function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export function isPassthroughApiPath(pathname: string): boolean {
  return PASSTHROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Pre-handler check for an API request. Returns a JSON error response when the
 * path is unknown or the method is unsupported, so a mistaken request never
 * falls through to the SPA document (which answers 200 with HTML).
 */
export function apiContractResponse(pathname: string, method: string): Response | null {
  if (!isApiPath(pathname) || isPassthroughApiPath(pathname)) return null;
  const upper = method.toUpperCase();
  const route = matchApiRoute(pathname);
  if (!route) {
    return Response.json(
      { state: "not-found", error: `No API route at ${pathname}.` },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  const allowed = new Set(route.methods);
  if (allowed.has("GET")) allowed.add("HEAD");
  allowed.add("OPTIONS");
  if (upper === "OPTIONS") {
    return new Response(null, { status: 204, headers: { Allow: [...allowed].join(", ") } });
  }
  if (!allowed.has(upper)) {
    return Response.json(
      { state: "method-not-allowed", error: `${upper} is not supported on ${route.pattern}.` },
      { status: 405, headers: { Allow: [...allowed].join(", "), "Cache-Control": "no-store" } },
    );
  }
  return null;
}

/**
 * Content-Security-Policy for documents. Origins come from the app's real
 * outbound calls: Google Fonts (`__root.tsx`), OpenStreetMap raster tiles and
 * the DeFlock vector tiles (`alpr-atlas.tsx`, `alpr-providers.ts`). MapLibre
 * runs its worker from a blob URL. TanStack Start emits inline hydration
 * scripts, so `script-src` keeps 'unsafe-inline' until nonce support lands.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://avatars.githubusercontent.com",
  "connect-src 'self' https://tiles.dontgetflocked.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

/** Headers applied to every response. HSTS only when the request arrived over HTTPS. */
export function securityHeaders(options: { https: boolean; cspReportOnly?: boolean }): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
    "Cross-Origin-Opener-Policy": "same-origin",
  };
  headers[options.cspReportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy"] =
    CONTENT_SECURITY_POLICY;
  if (options.https) headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  return headers;
}

/** Copy `headers` onto a response, rebuilding it when its headers are immutable. */
export function withHeaders(response: Response, headers: Record<string, string>): Response {
  try {
    for (const [key, value] of Object.entries(headers)) {
      if (!response.headers.has(key)) response.headers.set(key, value);
    }
    return response;
  } catch {
    const merged = new Headers(response.headers);
    for (const [key, value] of Object.entries(headers)) {
      if (!merged.has(key)) merged.set(key, value);
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: merged });
  }
}

const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // 100.64.0.0/10 carrier-grade NAT
];

/** Loopback, link-local, private and unique-local addresses are proxy hops, never the client. */
export function isInternalAddress(address: string): boolean {
  const a = address.trim().toLowerCase().replace(/^::ffff:/, "");
  if (!a) return true;
  if (PRIVATE_V4.some((re) => re.test(a))) return true;
  return a === "::1" || a.startsWith("fe80:") || a.startsWith("fc") || a.startsWith("fd");
}

/**
 * Rate-limit key for a request.
 *
 * Render appends to `X-Forwarded-For` instead of replacing it, so the LEFTMOST
 * entries are whatever the client sent and must never be trusted (PR #91
 * verification, finding 1). Proxies append on the right, so walk from the right:
 * skip internal proxy hops, then skip `trustedPublicHops` further public proxies
 * (e.g. 1 when a CDN sits in front of Render), and take the next entry.
 *
 * `TRUSTED_PROXY_HOPS` must be confirmed against a real production request.
 */
export function clientKey(headers: Headers, trustedPublicHops = 0): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((h) => h.trim()).filter(Boolean);
    let skipPublic = Math.max(0, trustedPublicHops);
    for (let i = hops.length - 1; i >= 0; i--) {
      const hop = hops.at(i)!;
      if (isInternalAddress(hop)) continue;
      if (skipPublic > 0) {
        skipPublic -= 1;
        continue;
      }
      return hop;
    }
    // Every entry was internal or a trusted proxy: fall back to the rightmost.
    if (hops.length) return hops.at(-1)!;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

/** Per-request rule: upstream-calling routes and writes are tighter than reads. */
export function rateLimitRule(pathname: string, method: string): RateLimitRule | null {
  if (!isApiPath(pathname) || isPassthroughApiPath(pathname)) return null;
  const route = matchApiRoute(pathname);
  const upper = method.toUpperCase();
  if (route && UPSTREAM_ROUTES.has(route.pattern)) return { limit: 30, windowMs: 60_000 };
  if (upper !== "GET" && upper !== "HEAD") return { limit: 30, windowMs: 60_000 };
  return { limit: 120, windowMs: 60_000 };
}

/**
 * Fixed-window counter held in process memory. The hub runs as one Render
 * instance; a multi-instance deployment needs a shared store (Redis) instead.
 */
export class FixedWindowLimiter {
  private readonly buckets = new Map<string, { started: number; count: number }>();
  private readonly maxKeys: number;

  constructor(maxKeys = 10_000) {
    this.maxKeys = maxKeys;
  }

  /** Returns seconds to wait when the request is over the limit, else 0. */
  hit(key: string, rule: RateLimitRule, now = Date.now()): number {
    const bucket = this.buckets.get(key);
    if (!bucket || now - bucket.started >= rule.windowMs) {
      if (bucket) this.buckets.delete(key);
      if (this.buckets.size >= this.maxKeys) this.prune(now, rule.windowMs);
      // Insertion order = window start order, so the oldest bucket is first.
      this.buckets.set(key, { started: now, count: 1 });
      return 0;
    }
    bucket.count += 1;
    if (bucket.count > rule.limit) return Math.max(1, Math.ceil((bucket.started + rule.windowMs - now) / 1000));
    return 0;
  }

  /**
   * Drop expired buckets; if still full, evict the oldest windows one by one.
   * Never clears every bucket, so flooding new keys cannot reset other
   * clients' counters (PR #91 verification, finding 2).
   */
  private prune(now: number, windowMs: number): void {
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.started >= windowMs) this.buckets.delete(key);
    }
    while (this.buckets.size >= this.maxKeys) {
      const oldest = this.buckets.keys().next();
      if (oldest.done) break;
      this.buckets.delete(oldest.value);
    }
  }
}

export function tooManyRequests(retryAfterSeconds: number): Response {
  return Response.json(
    { state: "rate-limited", error: "Too many requests. Try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds), "Cache-Control": "no-store" } },
  );
}

export function payloadTooLarge(): Response {
  return Response.json(
    { state: "invalid-request", error: `Request body exceeds ${MAX_API_BODY_BYTES} bytes.` },
    { status: 413, headers: { "Cache-Control": "no-store" } },
  );
}
