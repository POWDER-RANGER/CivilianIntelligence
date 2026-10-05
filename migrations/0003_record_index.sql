-- CIVINT Record Index: provenance-first records, immutable observations, and typed relationships.
-- The source registry remains the canonical source table for existing adapters.

create extension if not exists vector;

alter table source_registry
  add column if not exists native_surface text,
  add column if not exists health_state text not null default 'unconfigured',
  add column if not exists last_verified_at timestamptz,
  add column if not exists last_error text;

create index if not exists source_registry_health_idx
  on source_registry (health_state);

create table if not exists records (
  id text primary key,
  source_record_id text not null,
  kind text not null,
  title text not null,
  agency text,
  identifiers jsonb not null default '[]'::jsonb
    check (jsonb_typeof(identifiers) = 'array'),
  entities jsonb not null default '[]'::jsonb
    check (jsonb_typeof(entities) = 'array'),
  published_at timestamptz,
  updated_at timestamptz,
  source_id text not null references source_registry(id),
  source_url text not null,
  retrieved_at timestamptz not null default now(),
  retrieval_method text not null,
  content_hash text not null,
  hash_basis text not null default 'observation'
    check (hash_basis in ('document', 'observation')),
  adapter_version text not null,
  body_ref text,
  tsv tsvector not null default ''::tsvector,
  embedding vector,
  created_at timestamptz not null default now(),
  record_updated_at timestamptz not null default now(),
  unique (source_id, source_record_id)
);

create index if not exists records_source_idx on records (source_id, retrieved_at desc);
create index if not exists records_kind_idx on records (kind, updated_at desc nulls last);
create index if not exists records_agency_idx on records (agency, updated_at desc nulls last);
create index if not exists records_published_idx on records (published_at desc nulls last);
create index if not exists records_identifiers_gin_idx on records using gin (identifiers);
create index if not exists records_entities_gin_idx on records using gin (entities);
create index if not exists records_tsv_idx on records using gin (tsv);

create table if not exists record_versions (
  record_id text not null references records(id) on delete cascade,
  content_hash text not null,
  hash_basis text not null check (hash_basis in ('document', 'observation')),
  retrieved_at timestamptz not null,
  retrieval_method text not null,
  adapter_version text not null,
  body_ref text,
  created_at timestamptz not null default now(),
  primary key (record_id, content_hash)
);

create index if not exists record_versions_record_idx on record_versions (record_id, retrieved_at desc);

create table if not exists record_edges (
  from_record_id text not null references records(id) on delete cascade,
  to_record_id text not null references records(id) on delete cascade,
  edge_type text not null,
  basis text not null,
  tier text not null check (tier in ('hard', 'strong', 'agency/topic', 'historical')),
  created_by text not null,
  created_at timestamptz not null default now(),
  primary key (from_record_id, to_record_id, edge_type)
);

create index if not exists record_edges_from_idx on record_edges (from_record_id, tier);
create index if not exists record_edges_to_idx on record_edges (to_record_id, tier);

update source_registry
set health_state = coalesce(nullif(health_state, ''), 'unconfigured')
where health_state is null or health_state = '';
