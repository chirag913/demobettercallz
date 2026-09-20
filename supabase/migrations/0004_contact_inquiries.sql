-- Contact inquiries are durable records, separate from demo calling leads.
create table if not exists public.contact_inquiry (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  company text not null,
  website text,
  lead_volume text not null,
  interest text not null check (interest in ('Instant Lead Calling', 'Lead Recovery', 'Both', 'Custom AI Sales Agent')),
  message text not null,
  source text not null default '/contact',
  created_at timestamptz not null default now()
);

alter table public.contact_inquiry enable row level security;
-- No public policies: only the server's service-role client may access inquiries.
revoke all on public.contact_inquiry from anon, authenticated;
grant select, insert on public.contact_inquiry to service_role;
