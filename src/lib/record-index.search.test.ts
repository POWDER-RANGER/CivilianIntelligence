// Regression: GET /api/civint/records/search?q=flock returned
// `syntax error at or near "order"` in production (live audit 2026-10-11, P0-2).
// Root cause: the full-text clause never closed `websearch_to_tsquery(`, so the
// group's parentheses were unbalanced and Postgres failed at ORDER BY.
// This runs the real query against an in-memory PGlite with the real migrations.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "./db";

// db.ts eagerly boots PGLite via Vite-only import.meta.glob when imported in
// Node; mark the boot as done so the test owns its own in-memory database.
(globalThis as { __pgBootstrapPromise__?: Promise<void> }).__pgBootstrapPromise__ = Promise.resolve();
const { searchIndexedRecords } = await import("./record-index");

async function migratedDb(): Promise<Sql> {
  const pg = new PGlite();
  for (const file of ["0002_public_evidence.sql", "0003_record_index.sql"]) {
    await pg.exec(readFileSync(new URL(`../../migrations/${file}`, import.meta.url), "utf8"));
  }
  const query = async <T,>(text: string, params: unknown[] = []) =>
    (await pg.query(text, params)).rows as T[];
  return Object.assign(
    async () => {
      throw new Error("tagged template not used in this test");
    },
    { query },
  ) as unknown as Sql;
}

test("free-text record search produces valid SQL (P0-2)", async () => {
  const db = await migratedDb();
  const rows = await searchIndexedRecords({ query: "flock" }, db);
  assert.deepEqual(rows, []);
});

test("free-text plus identifier and filters produce valid SQL", async () => {
  const db = await migratedDb();
  const rows = await searchIndexedRecords(
    { query: "license plate", identifier: "HT940216C0001", agency: "police", from: "2020-01-01", limit: 5 },
    db,
  );
  assert.deepEqual(rows, []);
});
