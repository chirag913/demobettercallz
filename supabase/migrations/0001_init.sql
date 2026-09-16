-- BetterCallz AI — MVP schema
-- Run this in the Supabase SQL editor for a fresh project, or via `supabase db push`.

create extension if not exists "pgcrypto";

create table if not exists project (
  id text primary key,
  name text not null,
  developer text not null,
  location text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_knowledge (
  id text primary key,
  project_id text not null references project (id) on delete cascade,
  category text not null check (category in ('project', 'pricing', 'amenities', 'inventory')),
  field text not null,
  value text not null,
  source text,
  source_type text,
  verification_status text not null check (verification_status in ('verified', 'unverified', 'restricted')),
  confidence numeric not null default 0,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_knowledge_project_id_idx on project_knowledge (project_id);

create table if not exists lead (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references project (id) on delete cascade,
  name text,
  phone text not null,
  created_at timestamptz not null default now()
);
create index if not exists lead_project_id_idx on lead (project_id);

create table if not exists call (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references lead (id) on delete cascade,
  project_id text not null references project (id) on delete cascade,
  provider text not null default 'sarvam',
  mode text not null default 'demo' check (mode in ('demo', 'real')),
  provider_call_id text,
  interaction_id text,
  status text not null default 'created',
  duration_seconds integer,
  transcript jsonb,
  recording_url text,
  language text,
  failure_reason text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists call_lead_id_idx on call (lead_id);
create index if not exists call_project_id_idx on call (project_id);
create unique index if not exists call_provider_call_id_idx on call (provider_call_id) where provider_call_id is not null;

-- Seed the demo project so foreign keys resolve even before the app's own
-- seed script runs. Knowledge facts themselves stay in code
-- (src/data/demoKnowledge.ts) as the canonical source for the MVP.
insert into project (id, name, developer, location, status)
values ('godrej-arden', 'Godrej Arden', 'Godrej Properties', 'Sector 106, Dwarka Expressway, Gurugram', 'active')
on conflict (id) do nothing;
