import test from "node:test";
import assert from "node:assert/strict";
import { allowedAuthority, makeServer } from "./emulator_https_proxy.mjs";

test("only expected public HTTPS origins are permitted", () => {
  assert.equal(allowedAuthority("civintelligence.onrender.com:443"), "civintelligence.onrender.com");
  assert.equal(allowedAuthority("fonts.gstatic.com:443"), "fonts.gstatic.com");
  assert.equal(allowedAuthority("a.tile.openstreetmap.org:443"), "a.tile.openstreetmap.org");
  for (const value of ["localhost:443", "127.0.0.1:443", "evil.com:443",
                       "civintelligence.onrender.com:80", "civintelligence.onrender.com.evil:443",
                       "user@civintelligence.onrender.com:443", "[::1]:443", ""]) {
    assert.equal(allowedAuthority(value), null, value);
  }
});

test("health endpoint is local and non-CONNECT requests are denied", async () => {
  const server = makeServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const healthy = await fetch(base + "/healthz");
    assert.equal(healthy.status, 200);
    const forbidden = await fetch(base + "/elsewhere");
    assert.equal(forbidden.status, 405);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
