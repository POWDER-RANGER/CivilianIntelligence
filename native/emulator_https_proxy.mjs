#!/usr/bin/env node
/** Loopback-only HTTPS CONNECT proxy for isolated Android emulator CI.
 *
 * The Android guest sometimes cannot resolve public DNS on hosted runners.
 * This proxy resolves a small set of public CIVWATCH hosts using the runner's
 * DNS and forwards TLS bytes unchanged. It never decrypts or logs content.
 * It is not bundled into native apps or started in production.
 */
import http from "node:http";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const PORT = 18443;
const HOSTS = new Set([
  "civintelligence.onrender.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "tile.openstreetmap.org",
  "tiles.dontgetflocked.com",
  "avatars.githubusercontent.com",
]);

export function allowedAuthority(authority) {
  if (typeof authority !== "string" || !/^[a-z0-9.-]+:443$/i.test(authority)) return null;
  const host = authority.slice(0, -4).toLowerCase();
  if (!HOSTS.has(host) && !/^[a-z0-9-]+\.tile\.openstreetmap\.org$/.test(host)) return null;
  return host;
}

export function makeServer() {
  const server = http.createServer((request, response) => {
    if (request.method === "GET" && request.url === "/healthz") {
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("ok");
      return;
    }
    response.writeHead(405);
    response.end();
  });
  server.on("connect", (request, client, head) => {
    const host = allowedAuthority(request.url);
    if (!host) {
      client.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
      return;
    }
    let connected = false;
    const upstream = net.createConnection({ host, port: 443 });
    upstream.setTimeout(20000);
    upstream.once("connect", () => {
      connected = true;
      client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      if (head.length) upstream.write(head);
      upstream.pipe(client);
      client.pipe(upstream);
    });
    upstream.on("timeout", () => upstream.destroy(new Error("CONNECT timeout")));
    upstream.on("error", () => {
      if (!connected) client.end("HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n");
      else client.destroy();
    });
    client.on("error", () => upstream.destroy());
    client.on("close", () => upstream.destroy());
  });
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  makeServer().listen(PORT, "127.0.0.1", () => {
    console.log(`CI TLS-forwarding proxy listening on 127.0.0.1:${PORT}`);
  });
}
