/**
 * Outermost Nitro middleware (the `00-` prefix sorts it before `grok-pwa.ts`).
 *
 * - P1-2: unknown `/api/*` paths and unsupported methods answer JSON 404/405
 *   instead of falling through to the SPA document with a 200.
 * - P1-5: per-client rate limits and a request-body size cap on the API.
 * - P1-1: security headers on every response, including HSTS behind HTTPS.
 *
 * The rules live in `src/lib/http-security.ts`, where they are unit tested.
 */
import {
  FixedWindowLimiter,
  MAX_API_BODY_BYTES,
  apiContractResponse,
  clientKey,
  isApiPath,
  payloadTooLarge,
  rateLimitRule,
  securityHeaders,
  tooManyRequests,
  withHeaders,
} from "../../src/lib/http-security";

interface SecurityEvent {
  url: URL;
  req: { method: string; headers: Headers };
}

const limiter = new FixedWindowLimiter();

export default async function securityMiddleware(
  event: SecurityEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const proto = event.req.headers.get("x-forwarded-proto") ?? event.url.protocol.replace(":", "");
  const headers = securityHeaders({ https: proto === "https" });
  const path = event.url.pathname;
  const method = (event.req.method ?? "GET").toUpperCase();

  if (isApiPath(path)) {
    const contract = apiContractResponse(path, method);
    if (contract) return withHeaders(contract, headers);

    const rule = rateLimitRule(path, method);
    if (rule) {
      const wait = limiter.hit(`${clientKey(event.req.headers)}|${rule.limit}`, rule);
      if (wait > 0) return withHeaders(tooManyRequests(wait), headers);
    }

    const declared = Number(event.req.headers.get("content-length") ?? "0");
    if (Number.isFinite(declared) && declared > MAX_API_BODY_BYTES) {
      return withHeaders(payloadTooLarge(), headers);
    }
  }

  const result = await next();
  if (result instanceof Response) return withHeaders(result, headers);
  return result;
}
