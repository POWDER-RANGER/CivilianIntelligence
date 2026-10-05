import { createHash } from "node:crypto";
import { SOURCES, type SourceDefinition } from "./sources";
import { getSql, type Sql } from "./db";

export type RecordRetrievalMethod = "api" | "feed" | "official-index" | "manual" | "archive";
export type HashBasis = "document" | "observation";
export type RecordEdgeTier = "hard" | "strong" | "agency/topic" | "historical";

export type RecordInput = {
  sourceId: string;
  sourceRecordId: string;
  kind: string;
  title: string;
  agency?: string | null;
  identifiers?: string[];
  entities?: string[];
  publishedAt?: string | null;
  updatedAt?: string | null;
  sourceUrl: string;
  retrievedAt?: string;
  retrievalMethod: RecordRetrievalMethod;
  adapterVersion: string;
  rawContent?: string | Uint8Array;
  contentHash?: string;
  hashBasis?: HashBasis;
  bodyRef?: string | null;
};

export type IndexedRecord = {
  id: string;
  sourceRecordId: string;
  kind: string;
  title: string;
  agency: string | null;
  identifiers: string[];
  entities: string[];
  publishedAt: string | null;
  updatedAt: string | null;
  source: { id: string; name: string; originalUrl: string };
  sourceUrl: string;
  retrievedAt: string;
  retrievalMethod: RecordRetrievalMethod;
  contentHash: string;
  hashBasis: HashBasis;
  adapterVersion: string;
  bodyRef: string | null;
};

export type RecordSearchFilters = {
  query?: string;
  identifier?: string;
  kind?: string;
  agency?: string;
  sourceId?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export type RecordSearchResult = IndexedRecord & {
  matchReason: "Exact identifier match" | "Full-text match" | "Filtered index result";
};

export type RecordEdge = {
  fromRecordId: string;
  toRecordId: string;
  edgeType: string;
  basis: string;
  tier: RecordEdgeTier;
  createdBy: string;
  createdAt: string;
};

export type RecordDossier = {
  record: IndexedRecord;
  edges: RecordEdge[];
  versions: Array<{
    contentHash: string;
    hashBasis: HashBasis;
    retrievedAt: string;
    retrievalMethod: RecordRetrievalMethod;
    adapterVersion: string;
    bodyRef: string | null;
  }>;
};

export const RECORD_ID_PREFIX = "rec_";

export function normalizeIdentifiers(values: string[] = []): string[] {
  return [...new Map(
    values
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => [value.toLowerCase(), value] as const),
  ).values()].sort((a, b) => a.localeCompare(b));
}

export function normalizeEntities(values: string[] = []): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function canonicalRecordId(sourceId: string, sourceRecordId: string): string {
  return RECORD_ID_PREFIX + createHash("sha256")
    .update(sourceId)
    .update("\0")
    .update(sourceRecordId.trim())
    .digest("hex")
    .slice(0, 40);
}

export function sha256Content(content: string | Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

function mapRecord(row: Record<string, unknown>): IndexedRecord {
  return {
    id: String(row.id),
    sourceRecordId: String(row.source_record_id),
    kind: String(row.kind),
    title: String(row.title),
    agency: row.agency == null ? null : String(row.agency),
    identifiers: Array.isArray(row.identifiers) ? row.identifiers.map(String) : [],
    entities: Array.isArray(row.entities) ? row.entities.map(String) : [],
    publishedAt: row.published_at == null ? null : String(row.published_at),
    updatedAt: row.updated_at == null ? null : String(row.updated_at),
    source: {
      id: String(row.source_id),
      name: String(row.source_name),
      originalUrl: String(row.source_url),
    },
    sourceUrl: String(row.source_url),
    retrievedAt: String(row.retrieved_at),
    retrievalMethod: String(row.retrieval_method) as RecordRetrievalMethod,
    contentHash: String(row.content_hash),
    hashBasis: String(row.hash_basis) as HashBasis,
    adapterVersion: String(row.adapter_version),
    bodyRef: row.body_ref == null ? null : String(row.body_ref),
  };
}

export async function syncSourceRegistry(sql: Sql = await getSql()): Promise<void> {
  for (const source of SOURCES) {
    await sql.query(
      [
        "insert into source_registry",
        "(id, name, category, access_method, endpoint, license, attribution, cadence, native_surface, active, updated_at)",
        "values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,now())",
        "on conflict (id) do update set",
        "name=excluded.name, category=excluded.category, access_method=excluded.access_method,",
        "endpoint=excluded.endpoint, license=excluded.license, attribution=excluded.attribution,",
        "cadence=excluded.cadence, native_surface=excluded.native_surface, active=true, updated_at=now()",
      ].join(" "),
      [
        source.id, source.name, source.category, source.accessMethod, source.endpoint,
        source.license, source.attribution, source.cadence, source.nativeSurface,
      ],
    );
  }
}

export async function upsertIndexedRecord(input: RecordInput, sql: Sql = await getSql()): Promise<IndexedRecord> {
  await syncSourceRegistry(sql);

  const identifiers = normalizeIdentifiers(input.identifiers);
  const entities = normalizeEntities(input.entities);
  const retrievedAt = input.retrievedAt ?? new Date().toISOString();
  const hashBasis = input.hashBasis ?? (input.rawContent ? "document" : "observation");
  const contentHash = input.contentHash ?? (input.rawContent ? sha256Content(input.rawContent) : "");

  if (!contentHash) {
    throw new Error("Record ingestion requires contentHash or rawContent; CIVINT will not invent a hash.");
  }

  const id = canonicalRecordId(input.sourceId, input.sourceRecordId);

  const sqlText = [
    "with upserted as (",
    "insert into records",
    "(id, source_record_id, kind, title, agency, identifiers, entities, published_at,",
    "updated_at, source_id, source_url, retrieved_at, retrieval_method, content_hash,",
    "hash_basis, adapter_version, body_ref, tsv, record_updated_at)",
    "values",
    "($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,",
    "to_tsvector('english', concat_ws(' ', $4, $5, $6::jsonb::text, $7::jsonb::text)), now())",
    "on conflict (source_id, source_record_id) do update set",
    "kind=excluded.kind, title=excluded.title, agency=excluded.agency,",
    "identifiers=excluded.identifiers, entities=excluded.entities,",
    "published_at=excluded.published_at, updated_at=excluded.updated_at,",
    "source_url=excluded.source_url, retrieved_at=excluded.retrieved_at,",
    "retrieval_method=excluded.retrieval_method, content_hash=excluded.content_hash,",
    "hash_basis=excluded.hash_basis, adapter_version=excluded.adapter_version,",
    "body_ref=excluded.body_ref, tsv=excluded.tsv, record_updated_at=now()",
    "returning *",
    "), versioned as (",
    "insert into record_versions",
    "(record_id, content_hash, hash_basis, retrieved_at, retrieval_method, adapter_version, body_ref)",
    "select id, content_hash, hash_basis, retrieved_at, retrieval_method, adapter_version, body_ref from upserted",
    "on conflict (record_id, content_hash) do nothing",
    ")",
    "select u.*, s.name as source_name from upserted u join source_registry s on s.id = u.source_id",
  ].join(" ");

  const rows = await sql.query<Record<string, unknown>>(sqlText, [
    id,
    input.sourceRecordId.trim(),
    input.kind,
    input.title.trim(),
    input.agency?.trim() || null,
    json(identifiers),
    json(entities),
    input.publishedAt ?? null,
    input.updatedAt ?? null,
    input.sourceId,
    input.sourceUrl,
    retrievedAt,
    input.retrievalMethod,
    contentHash,
    hashBasis,
    input.adapterVersion,
    input.bodyRef ?? null,
  ]);

  if (!rows[0]) throw new Error("Record upsert returned no row.");
  return mapRecord(rows[0]);
}

export async function searchIndexedRecords(
  filters: RecordSearchFilters,
  sql: Sql = await getSql(),
): Promise<RecordSearchResult[]> {
  await syncSourceRegistry(sql);

  const clauses: string[] = [];
  const params: unknown[] = [];
  let queryParam: number | null = null;

  if (filters.query?.trim()) {
    queryParam = params.push(filters.query.trim());
    clauses.push([
      "(",
      "r.tsv @@ websearch_to_tsquery('english', $" + queryParam,
      "or exists (select 1 from jsonb_array_elements_text(r.identifiers) value",
      "where lower(value) = lower($" + queryParam + "))",
      ")",
    ].join(" "));
  }

  if (filters.identifier?.trim()) {
    const p = params.push(filters.identifier.trim());
    clauses.push([
      "exists (select 1 from jsonb_array_elements_text(r.identifiers) value",
      "where lower(value) = lower($" + p + "))",
    ].join(" "));
  }

  if (filters.kind?.trim()) {
    const p = params.push(filters.kind.trim());
    clauses.push("r.kind = $" + p);
  }

  if (filters.agency?.trim()) {
    const p = params.push(filters.agency.trim());
    clauses.push("r.agency ilike '%' || $" + p + " || '%'");
  }

  if (filters.sourceId?.trim()) {
    const p = params.push(filters.sourceId.trim());
    clauses.push("r.source_id = $" + p);
  }

  if (filters.from) {
    const p = params.push(filters.from);
    clauses.push("coalesce(r.published_at, r.updated_at, r.retrieved_at) >= $" + p);
  }

  if (filters.to) {
    const p = params.push(filters.to);
    clauses.push("coalesce(r.published_at, r.updated_at, r.retrieved_at) <= $" + p);
  }

  const limit = Math.min(Math.max(filters.limit ?? 25, 1), 100);
  const limitParam = params.push(limit);

  const exactExpr = queryParam
    ? "exists (select 1 from jsonb_array_elements_text(r.identifiers) value where lower(value) = lower($" + queryParam + "))"
    : "false";
  const textExpr = queryParam
    ? "r.tsv @@ websearch_to_tsquery('english', $" + queryParam + ")"
    : "false";

  const sqlText = [
    "select r.*, s.name as source_name,",
    "case when " + exactExpr + " then 'Exact identifier match'",
    "when " + textExpr + " then 'Full-text match'",
    "else 'Filtered index result' end as match_reason,",
    "case when " + exactExpr + " then 0 when " + textExpr + " then 1 else 2 end as match_order",
    "from records r join source_registry s on s.id = r.source_id",
    clauses.length ? "where " + clauses.join(" and ") : "",
    "order by match_order, coalesce(r.published_at, r.updated_at, r.retrieved_at) desc",
    "limit $" + limitParam,
  ].filter(Boolean).join(" ");

  const rows = await sql.query<Record<string, unknown>>(sqlText, params);
  return rows.map((row) => ({
    ...mapRecord(row),
    matchReason: String(row.match_reason) as RecordSearchResult["matchReason"],
  }));
}

export async function getRecordDossier(
  id: string,
  sql: Sql = await getSql(),
): Promise<RecordDossier | null> {
  await syncSourceRegistry(sql);

  const records = await sql.query<Record<string, unknown>>(
    "select r.*, s.name as source_name from records r join source_registry s on s.id = r.source_id where r.id = $1",
    [id],
  );
  if (!records[0]) return null;

  const edges = await sql.query<Record<string, unknown>>(
    [
      "select from_record_id, to_record_id, edge_type, basis, tier, created_by, created_at",
      "from record_edges where from_record_id = $1 or to_record_id = $1",
      "order by case tier when 'hard' then 0 when 'strong' then 1 when 'agency/topic' then 2 else 3 end, created_at desc",
    ].join(" "),
    [id],
  );

  const versions = await sql.query<Record<string, unknown>>(
    "select content_hash, hash_basis, retrieved_at, retrieval_method, adapter_version, body_ref from record_versions where record_id = $1 order by retrieved_at desc",
    [id],
  );

  return {
    record: mapRecord(records[0]),
    edges: edges.map((row) => ({
      fromRecordId: String(row.from_record_id),
      toRecordId: String(row.to_record_id),
      edgeType: String(row.edge_type),
      basis: String(row.basis),
      tier: String(row.tier) as RecordEdgeTier,
      createdBy: String(row.created_by),
      createdAt: String(row.created_at),
    })),
    versions: versions.map((row) => ({
      contentHash: String(row.content_hash),
      hashBasis: String(row.hash_basis) as HashBasis,
      retrievedAt: String(row.retrieved_at),
      retrievalMethod: String(row.retrieval_method) as RecordRetrievalMethod,
      adapterVersion: String(row.adapter_version),
      bodyRef: row.body_ref == null ? null : String(row.body_ref),
    })),
  };
}


export async function upsertRecordEdge(
  edge: {
    fromRecordId: string;
    toRecordId: string;
    edgeType: string;
    basis: string;
    tier: RecordEdgeTier;
    createdBy: string;
  },
  sql: Sql = await getSql(),
): Promise<void> {
  if (edge.fromRecordId === edge.toRecordId) {
    throw new Error("A record edge cannot point to the same record.");
  }
  if (!edge.edgeType.trim() || !edge.basis.trim() || !edge.createdBy.trim()) {
    throw new Error("Record edges require type, basis, and creator.");
  }
  await sql.query(
    [
      "insert into record_edges",
      "(from_record_id, to_record_id, edge_type, basis, tier, created_by)",
      "values ($1,$2,$3,$4,$5,$6)",
      "on conflict (from_record_id, to_record_id, edge_type) do update set",
      "basis=excluded.basis, tier=excluded.tier, created_by=excluded.created_by",
    ].join(" "),
    [
      edge.fromRecordId,
      edge.toRecordId,
      edge.edgeType.trim(),
      edge.basis.trim(),
      edge.tier,
      edge.createdBy.trim(),
    ],
  );
}

export function sourceAsRecordContext(source: SourceDefinition): { id: string; name: string; originalUrl: string } {
  return { id: source.id, name: source.name, originalUrl: source.endpoint };
}
