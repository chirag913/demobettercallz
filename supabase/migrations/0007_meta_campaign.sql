-- Separate campaign records; reuse existing lead, call, transcript and delivery storage.
insert into public.project (id,name,developer,location,status)
values ('bettercallz-meta','BetterCallz Meta campaign','BetterCallz','','active') on conflict do nothing;
alter table public.lead add column if not exists source text;
alter table public.call add column if not exists source text;
update public.lead set source='website_demo' where project_id='bettercallz-live' and source is null;
update public.call set source='website_demo' where project_id='bettercallz-live' and source is null;

create table public.meta_lead_request (
  meta_lead_id text primary key,
  source text not null default 'meta_lead_campaign' check(source='meta_lead_campaign'),
  call_id uuid not null unique references public.call(id),
  payload jsonb not null,
  call_triggered boolean not null default false,
  dispatch_state text not null default 'reserved' check(dispatch_state in ('reserved','dispatching','accepted','review')),
  call_status text not null default 'created',
  called_at timestamptz,
  call_completed_at timestamptz,
  created_at timestamptz not null default now(),
  sheet_row bigint generated always as identity (start with 2) unique,
  sheet_payload jsonb,
  sheet_delivered_at timestamptz,
  next_delivery_attempt_at timestamptz not null default now(),
  last_error text
);
alter table public.meta_lead_request enable row level security;
revoke all on public.meta_lead_request from anon,authenticated;
grant select,insert,update on public.meta_lead_request to service_role;

-- Serialize the same Meta lead ID, create both records atomically, retain first payload.
create function public.reserve_meta_lead(p_id text, p_payload jsonb) returns public.meta_lead_request
language plpgsql security definer set search_path=public as $$
declare existing public.meta_lead_request; lead_uuid uuid; call_uuid uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_id,0));
  select * into existing from public.meta_lead_request where meta_lead_id=p_id;
  if found then return existing; end if;
  insert into public.lead(project_id,phone,name,source) values('bettercallz-meta',p_payload->>'phone',nullif(p_payload->>'name',''),'meta_lead_campaign') returning id into lead_uuid;
  insert into public.call(lead_id,project_id,provider,mode,status,source) values(lead_uuid,'bettercallz-meta','sarvam','real','created','meta_lead_campaign') returning id into call_uuid;
  insert into public.meta_lead_request(meta_lead_id,call_id,payload) values(p_id,call_uuid,p_payload) returning * into existing;
  return existing;
end $$;
revoke all on function public.reserve_meta_lead(text,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_meta_lead(text,jsonb) to service_role;

-- Call status propagation shares the original webhook's call update, including early callbacks.
create function public.sync_meta_call_status() returns trigger language plpgsql security definer set search_path=public as $$
begin
  update public.meta_lead_request set call_status=new.status,
    call_completed_at=new.ended_at, call_triggered=(call_triggered or new.provider_call_id is not null)
    where call_id=new.id;
  return new;
end $$;
create trigger meta_call_status after update on public.call for each row
when (new.project_id='bettercallz-meta') execute function public.sync_meta_call_status();

revoke all on function public.sync_meta_call_status() from public,anon,authenticated;

-- Independent email retries continue even after the Sheet has been acknowledged.
create view public.meta_lead_pending_delivery with (security_invoker=true) as
select m.call_id,m.next_delivery_attempt_at from public.meta_lead_request m
left join public.demo_lead_delivery d on d.call_id=m.call_id
where m.call_triggered and m.call_status in ('completed','failed')
  and (d.call_id is null or d.status in ('pending','failed','processing'));
revoke all on public.meta_lead_pending_delivery from anon,authenticated;
grant select on public.meta_lead_pending_delivery to service_role;
