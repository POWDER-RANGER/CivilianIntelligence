import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "./db";
import { upsertIndexedRecord } from "./record-index";

// Regression: the upsert passed $4/$5 untyped into concat_ws(), which Postgres
// rejects ("could not determine data type of parameter $4"). Every adapter's
// index write failed silently in production and the record index stayed empty.
test("upsertIndexedRecord writes concurrently against the real schema", async () => {
  const pg = new PGlite();
  for (const file of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("migrations/" + file, "utf8"));
  }
  const sql = { query: async (text: string, params?: unknown[]) => (await pg.query(text, params)).rows } as unknown as Sql;

  const outcomes = await Promise.allSettled(["A-1", "A-2", "A-3"].map((id) =>
    upsertIndexedRecord({
      sourceId: "usaspending",
      sourceRecordId: id,
      kind: "federal-award",
      title: "USAspending award " + id,
      agency: "Department of Defense",
      identifiers: [id],
      entities: ["Example Recipient"],
      sourceUrl: "https://www.usaspending.gov/",
      retrievalMethod: "api",
      adapterVersion: "usaspending-award-v1",
      rawContent: JSON.stringify({ id }),
      hashBasis: "document",
    }, sql)));

  for (const outcome of outcomes) {
    assert.equal(outcome.status, "fulfilled", outcome.status === "rejected" ? String(outcome.reason) : "");
  }
  const rows = await sql.query<{ n: number }>("select count(*)::int as n from records where tsv @@ plainto_tsquery('english', 'defense')");
  assert.equal(rows[0].n, 3);
  await pg.close();
});
