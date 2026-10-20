// Unit tests for CIVWATCH Globe link building. Network-free.
import test from "node:test";
import assert from "node:assert/strict";
import {
  GLOBE_BASE_URL,
  DEFAULT_GLOBE_CAMERA,
  buildGlobeEmbedUrl,
  coarsen,
  isToolsMode,
  isValidCamera,
} from "./globe-url";

test("globe points at the single canonical service", () => {
  assert.equal(GLOBE_BASE_URL, "https://civintelligence-gods-eye-view.onrender.com");
  assert.ok(buildGlobeEmbedUrl().includes("dm=OFF"));
  assert.ok(buildGlobeEmbedUrl().includes("l=e.f.j.y"));
  assert.ok(!buildGlobeEmbedUrl().includes("lo=f.e.1_k.o.n"));
});

test("default embed keeps the Austin camera and embed mode", () => {
  const url = buildGlobeEmbedUrl();
  assert.ok(url.startsWith(`${GLOBE_BASE_URL}/?embed=1#v=2&`));
  assert.equal(DEFAULT_GLOBE_CAMERA.alt, 600);
  assert.ok(url.includes("lat=30.267&lon=-97.743&alt=600&"));
});

test("location is carried only in the fragment, coarsened to 3 decimals", () => {
  const url = buildGlobeEmbedUrl({ lat: 40.416775123, lon: -91.38792456, alt: 1500 });
  const [beforeHash, fragment] = url.split("#");
  assert.ok(!beforeHash.includes("lat="), "coordinates must not be in the query string");
  assert.ok(fragment.includes("lat=40.417&lon=-91.388&alt=1500&"));
});

test("coarsen rounds to ~110 m", () => {
  assert.equal(coarsen(41.878123), 41.878);
  assert.equal(coarsen(-87.62989), -87.63);
});

test("invalid cameras fall back to the default", () => {
  assert.equal(isValidCamera({ lat: 91, lon: 0, alt: 10 }), false);
  assert.equal(isValidCamera({ lat: Number.NaN, lon: 0, alt: 10 }), false);
  assert.equal(buildGlobeEmbedUrl({ lat: 200, lon: 0, alt: 10 }), buildGlobeEmbedUrl());
});

test("tools mode controls the viewer HUD and panels via the fragment only", () => {
  const hidden = buildGlobeEmbedUrl(DEFAULT_GLOBE_CAMERA, "hidden");
  assert.ok(hidden.includes("&hv=0&"));
  const minimal = buildGlobeEmbedUrl();
  assert.ok(minimal.includes("&hud=minimal&hv=1&"));
  assert.ok(!minimal.includes("i.c.0"), "minimal collapses every panel");
  const full = buildGlobeEmbedUrl(DEFAULT_GLOBE_CAMERA, "full");
  assert.ok(full.includes("&hud=tactical&hv=1&") && full.includes("i.c.0"));
  for (const url of [hidden, minimal, full]) {
    assert.ok(!url.split("#")[0].includes("hud="), "state stays in the fragment");
  }
});

test("isToolsMode validates stored values", () => {
  assert.equal(isToolsMode("hidden"), true);
  assert.equal(isToolsMode("nope"), false);
  assert.equal(isToolsMode(null), false);
});

test("standalone link drops embed mode but keeps camera and tools state", () => {
  const url = buildGlobeEmbedUrl(DEFAULT_GLOBE_CAMERA, "hidden", { embed: false });
  assert.ok(url.startsWith(`${GLOBE_BASE_URL}/#v=2&lat=30.267`));
  assert.ok(url.includes("&hv=0&"));
});
