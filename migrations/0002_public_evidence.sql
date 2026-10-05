create table if not exists source_registry (
  id text primary key,
  name text not null,
  category text not null,
  access_method text not null,
  endpoint text not null,
  license text,
  attribution text,
  cadence text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists evidence_observations (
  id text primary key,
  source_id text not null references source_registry(id),
  source_record_id text not null,
  observed_at timestamptz,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  provenance text not null,
  confidence numeric(4,3),
  payload jsonb not null,
  unique (source_id, source_record_id)
);

create index if not exists evidence_observations_source_idx
  on evidence_observations (source_id, retrieved_at desc);

insert into source_registry
  (id, name, category, access_method, endpoint, license, attribution, cadence)
values
  ('alpr-flocklocations', 'Flock Locations', 'surveillance infrastructure', 'server-side GeoJSON', 'https://flocklocations.com/api/cameras/export?format=geojson', 'CC BY 4.0', 'Independent community-run dataset', 'published feed')
on conflict (id) do nothing;

insert into source_registry
  (id, name, category, access_method, endpoint, license, attribution, cadence)
values
  ('usaspending', 'USAspending', 'federal spending', 'server-side JSON API', 'https://api.usaspending.gov/api/v2/', 'public federal data', 'USAspending.gov', 'continuously maintained')
on conflict (id) do nothing;

insert into source_registry
  (id, name, category, access_method, endpoint, license, attribution, cadence)
values
  ('sec-edgar', 'SEC EDGAR', 'corporate filings', 'server-side JSON API', 'https://data.sec.gov/', 'public federal data', 'U.S. Securities and Exchange Commission', 'real-time filings')
on conflict (id) do nothing;
