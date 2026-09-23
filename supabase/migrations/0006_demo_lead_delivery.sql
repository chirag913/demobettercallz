-- Private post-call outbox. Never exposed through the public call-result response.
create table if not exists public.demo_lead_delivery (
  call_id uuid primary key references public.call(id),
  status text not null default 'pending' check (status in ('pending','processing','failed','sent','review')),
  lead_data jsonb,
  email_payload jsonb,
  email_id text,
  first_send_at timestamptz,
  lock_token uuid,
  locked_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.demo_lead_delivery enable row level security;
revoke all on public.demo_lead_delivery from anon, authenticated;
grant select, insert, update on public.demo_lead_delivery to service_role;
