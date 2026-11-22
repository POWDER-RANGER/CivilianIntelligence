import test from "node:test";
import assert from "node:assert/strict";
import { createUsgsSnapshotService, normalizeUsgsFeed, USGS_FEED_URL } from "./usgs-live";

const when = new Date("2026-11-21T12:00:00Z");
function feature(id: string, props: Record<string, unknown> = {}, coord: unknown = [-91.4, 40.4]) {
  return {
    id,
    geometry: { coordinates: coord },
    properties: {
      time: when.valueOf() - 30_000,
      place: "Keokuk test fixture",
      mag: 4.8,
      status: "reviewed",
      url: "https://earthquake.usgs.gov/earthquakes/eventpage/example",
      ...props,
    },
  };
}
const feed = (features: unknown[]) => ({ type: "FeatureCollection", features });

test("normalizes official observation and never infers event jurisdiction from publisher", () => {
  const [event] = normalizeUsgsFeed(feed([feature("eq-1")]), when);
  assert.equal(event.id, "usgs:eq-1");
  assert.equal(event.publisher.government_level, "federal");
  assert.equal(event.event_jurisdiction.level, "unresolved");
  assert.deepEqual(event.geography.coordinates, { latitude: 40.4, longitude: -91.4 });
  assert.equal(event.freshness, "live");
  assert.equal(event.review_status, "reviewed");
  assert.equal(event.importance, 2);
});

test("deduplicates ids and prefers reviewed observations at equal timestamps", () => {
  const result = normalizeUsgsFeed(
    feed([
      feature("eq-1", { status: "automatic" }),
      feature("eq-1", { status: "reviewed" }),
      feature("eq-2", { time: when.valueOf() - 100_000, mag: 6.1 }),
    ]),
    when,
  );
  assert.equal(result.length, 2);
  assert.equal(result[0].id, "usgs:eq-2");
  assert.equal(result[1].review_status, "reviewed");
});

test("rejects malformed feed and all-invalid observations, accepts legitimate empty feed", () => {
  assert.deepEqual(normalizeUsgsFeed(feed([]), when), []);
  assert.throws(() => normalizeUsgsFeed({ features: [] }, when));
  assert.throws(() => normalizeUsgsFeed(feed([feature("x", { time: "nonsense" })]), when));
  assert.deepEqual(
    normalizeUsgsFeed(
      feed([feature("x", { time: when.valueOf() + 16 * 60_000 }), feature("y")]),
      when,
    ).map((x) => x.id),
    ["usgs:y"],
  );
});

test("rejects unsafe evidence URLs and invalid coordinates without discarding observation", () => {
  const [event] = normalizeUsgsFeed(
    feed([feature("x", { url: "https://evil.example/", place: "Earthquake" }, [181, 91])]),
    when,
  );
  assert.equal(event.source_url, null);
  assert.equal(event.geography.coordinates, null);
});

test("never marks old observations live", () => {
  const [event] = normalizeUsgsFeed(
    feed([feature("x", { time: when.valueOf() - 36 * 60 * 60_000 })]),
    when,
  );
  assert.equal(event.freshness, "historical");
});

test("retains last-good observations after fetch error, then expires stale cache", async () => {
  let clock = when.valueOf();
  let calls = 0;
  const service = createUsgsSnapshotService(
    async (url, init) => {
      assert.equal(url, USGS_FEED_URL);
      assert.equal(init.redirect, "error");
      calls += 1;
      if (calls === 1)
        return new Response(JSON.stringify(feed([feature("eq-1")])), { status: 200 });
      throw new Error("upstream-down");
    },
    () => clock,
  );
  const initial = await service();
  assert.equal(initial.state, "available");
  assert.equal(initial.events.length, 1);
  clock += 65_000;
  const fallback = await service();
  assert.equal(fallback.state, "stale");
  assert.equal(fallback.events.length, 1);
  assert.equal(calls, 2);
  clock += 7 * 60 * 60_000;
  const unavailable = await service();
  assert.equal(unavailable.state, "unavailable");
  assert.equal(unavailable.events.length, 0);
});

test("a failed initial upstream fetch is an explicit unavailable state", async () => {
  const service = createUsgsSnapshotService(
    async () => new Response("bad", { status: 502 }),
    () => when.valueOf(),
  );
  const snapshot = await service();
  assert.equal(snapshot.state, "unavailable");
  assert.equal(snapshot.last_success_at, null);
  assert.deepEqual(snapshot.events, []);
});

test("concurrent initial requests await the same upstream response without inventing availability", async () => {
  let finish!: (response: Response) => void;
  let calls = 0;
  const service = createUsgsSnapshotService(
    async () => {
      calls += 1;
      return new Promise<Response>((resolve) => {
        finish = resolve;
      });
    },
    () => when.valueOf(),
  );
  const first = service();
  const second = service();
  assert.equal(calls, 1);
  finish(new Response(JSON.stringify(feed([])), { status: 200 }));
  const [one, two] = await Promise.all([first, second]);
  assert.equal(one.state, "available");
  assert.deepEqual(one, two);
  assert.equal(one.events.length, 0);
});
test("cached responses retain the timestamp of the actual upstream check", async () => {
  let clock = when.valueOf();
  const service = createUsgsSnapshotService(
    async () => new Response(JSON.stringify(feed([])), { status: 200 }),
    () => clock,
  );
  const first = await service();
  clock += 10_000;
  const cached = await service();
  assert.equal(first.checked_at, cached.checked_at);
});
