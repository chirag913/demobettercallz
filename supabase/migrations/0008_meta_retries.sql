-- One campaign lead, existing call rows for attempt history. Old records are held.
alter table public.meta_lead_request
  add column attempt_count integer not null default 0 check (attempt_count between 0 and 3),
  add column last_attempt_at timestamptz,
  add column next_retry_at timestamptz,
  add column last_call_status text not null default 'PENDING',
  add column retry_reason text,
  add column retry_status text not null default 'CALL_SCHEDULED',
  add column sheet_revision integer not null default 1;
update public.meta_lead_request set attempt_count=case when dispatch_state='reserved' then 0 else 1 end,
  last_attempt_at=called_at, last_call_status=upper(call_status), retry_status='LEGACY_HOLD';
create index meta_lead_due_idx on public.meta_lead_request(next_retry_at)
  where retry_status in ('CALL_SCHEDULED','RETRY_SCHEDULED','PREPARED');

create function public.get_next_meta_call_time(p_attempt integer, p_now timestamptz default now()) returns timestamptz
language plpgsql immutable set search_path=public as $$
declare local_due timestamp;
begin
  if p_attempt not between 1 and 3 then raise exception 'Invalid attempt'; end if;
  local_due := (p_now + case p_attempt when 2 then interval '45 minutes' when 3 then interval '3 hours' else interval '0' end) at time zone 'Asia/Kolkata';
  if local_due::time >= time '21:00' then local_due:=date_trunc('day',local_due)+interval '1 day 10 hours';
  elsif local_due::time < time '08:00' then local_due:=date_trunc('day',local_due)+interval '10 hours'; end if;
  return local_due at time zone 'Asia/Kolkata';
end $$;

create or replace function public.reserve_meta_lead(p_id text,p_payload jsonb) returns public.meta_lead_request
language plpgsql security definer set search_path=public as $$
declare r public.meta_lead_request; l uuid; c uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_id,0));
  select * into r from public.meta_lead_request where meta_lead_id=p_id;
  if found then return r; end if;
  insert into public.lead(project_id,phone,name,source) values('bettercallz-meta',p_payload->>'phone',nullif(p_payload->>'name',''),'meta_lead_campaign') returning id into l;
  insert into public.call(lead_id,project_id,provider,mode,status,source) values(l,'bettercallz-meta','sarvam','real','created','meta_lead_campaign') returning id into c;
  insert into public.meta_lead_request(meta_lead_id,call_id,payload,next_retry_at)
    values(p_id,c,p_payload,public.get_next_meta_call_time(1)) returning * into r;
  return r;
end $$;

-- Atomic reservation is recoverable until begin_meta_dispatch is committed.
create function public.claim_meta_attempt(p_id text) returns public.meta_lead_request
language plpgsql security definer set search_path=public as $$
declare r public.meta_lead_request; c public.call; next_id uuid; local_time time;
begin
  select * into r from public.meta_lead_request where meta_lead_id=p_id for update;
  if not found or r.next_retry_at is null or r.next_retry_at>now() then return null; end if;
  if r.retry_status not in ('CALL_SCHEDULED','RETRY_SCHEDULED','PREPARED') then return null; end if;
  local_time:=(now() at time zone 'Asia/Kolkata')::time;
  if local_time>=time '21:00' or local_time<time '08:00' then
    update public.meta_lead_request set next_retry_at=public.get_next_meta_call_time(1) where meta_lead_id=p_id;
    return null;
  end if;
  if r.retry_status='PREPARED' then return r; end if;
  if r.attempt_count>=3 then return null; end if;
  select * into c from public.call where id=r.call_id;
  if r.attempt_count>0 then
    if r.dispatch_state<>'accepted' or c.status<>'failed' or c.ended_at is null or
      r.last_call_status not in ('BUSY','NO_ANSWER','CONFIRMED_CALL_FAILURE','PROVIDER_TIMEOUT') then return null; end if;
    -- A completed conversation in any previous attempt permanently stops retries.
    if exists(select 1 from public.call where lead_id=c.lead_id and (status='completed' or (id<>c.id and status in ('created','ringing','in_call')))) then return null; end if;
    insert into public.call(lead_id,project_id,provider,mode,status,source)
      values(c.lead_id,'bettercallz-meta','sarvam','real','created','meta_lead_campaign') returning id into next_id;
  else
    if c.status<>'created' or c.provider_call_id is not null then return null; end if;
    next_id:=c.id;
  end if;
  update public.meta_lead_request set call_id=next_id,attempt_count=attempt_count+1,
    retry_status='PREPARED',dispatch_state='reserved',call_status='created',call_triggered=false,
    called_at=null,call_completed_at=null,last_error=null,sheet_payload=null,sheet_delivered_at=null
    where meta_lead_id=p_id returning * into r;
  return r;
end $$;

create function public.begin_meta_dispatch(p_id text,p_call uuid) returns boolean
language plpgsql security definer set search_path=public as $$
declare r public.meta_lead_request; t time;
begin
  select * into r from public.meta_lead_request where meta_lead_id=p_id for update;
  if not found or r.call_id<>p_call or r.retry_status<>'PREPARED' or r.dispatch_state<>'reserved' then return false; end if;
  t:=(clock_timestamp() at time zone 'Asia/Kolkata')::time;
  if t>=time '21:00' or t<time '08:00' then
    update public.meta_lead_request set next_retry_at=public.get_next_meta_call_time(1,clock_timestamp()) where meta_lead_id=p_id;
    return false;
  end if;
  update public.meta_lead_request set retry_status='CALLING',dispatch_state='dispatching',
    next_retry_at=null,called_at=clock_timestamp(),last_attempt_at=clock_timestamp() where meta_lead_id=p_id;
  return true;
end $$;

-- Only the authenticated provider callback can finalize eligibility, never an HTTP error.
create function public.finish_meta_attempt(p_call uuid,p_outcome text) returns public.meta_lead_request
language plpgsql security definer set search_path=public as $$
declare r public.meta_lead_request; c public.call; eligible boolean;
begin
  select * into r from public.meta_lead_request where call_id=p_call for update;
  if not found then return null; end if;
  if r.retry_status not in ('CALLING','REVIEW') then return r; end if;
  select * into c from public.call where id=p_call;
  if c.provider_call_id is null or c.ended_at is null or c.status not in ('failed','completed') then return r; end if;
  if c.status='completed' then p_outcome:='COMPLETED'; end if;
  eligible:=p_outcome in ('BUSY','NO_ANSWER','CONFIRMED_CALL_FAILURE','PROVIDER_TIMEOUT');
  update public.meta_lead_request set last_call_status=p_outcome,retry_reason=p_outcome,
    retry_status=case when eligible and attempt_count<3 then 'RETRY_SCHEDULED' when eligible then 'RETRY_EXHAUSTED'
      when p_outcome in ('COMPLETED','CONNECTED','DO_NOT_CALL','WRONG_NUMBER') then p_outcome else 'REVIEW' end,
    next_retry_at=case when eligible and attempt_count<3 then public.get_next_meta_call_time(attempt_count+1) else null end,
    dispatch_state='accepted',call_triggered=true where call_id=p_call returning * into r;
  return r;
end $$;

-- Never send qualification emails for failed attempts, including historical pending outbox rows.
create or replace view public.meta_lead_pending_delivery with (security_invoker=true) as
select m.call_id,m.next_delivery_attempt_at from public.meta_lead_request m
left join public.demo_lead_delivery d on d.call_id=m.call_id
where m.call_triggered and m.call_status='completed'
  and (d.call_id is null or d.status in ('pending','failed','processing'));

-- Every state or intelligence change invalidates the Sheet acknowledgement.
create function public.version_meta_sheet() returns trigger language plpgsql set search_path=public as $$
begin
  -- Older application instances cannot bypass the new claim/quiet-hours gate during rollout.
  if new.dispatch_state='dispatching' and old.dispatch_state<>'dispatching' and
    (new.retry_status<>'CALLING' or new.attempt_count<1 or
     (clock_timestamp() at time zone 'Asia/Kolkata')::time>=time '21:00' or
     (clock_timestamp() at time zone 'Asia/Kolkata')::time<time '08:00') then
    raise exception 'Campaign dispatch requires an in-hours atomic attempt claim';
  end if;
  if row(new.call_id,new.attempt_count,new.last_call_status,new.retry_status,new.next_retry_at,new.last_attempt_at,new.sheet_payload)
    is distinct from row(old.call_id,old.attempt_count,old.last_call_status,old.retry_status,old.next_retry_at,old.last_attempt_at,old.sheet_payload) then
    new.sheet_revision:=old.sheet_revision+1; new.sheet_delivered_at:=null;
  end if;
  return new;
end $$;
create trigger meta_sheet_revision before update on public.meta_lead_request for each row execute function public.version_meta_sheet();

revoke all on function public.get_next_meta_call_time(integer,timestamptz),public.claim_meta_attempt(text),public.begin_meta_dispatch(text,uuid),public.finish_meta_attempt(uuid,text),public.version_meta_sheet() from public,anon,authenticated;
grant execute on function public.get_next_meta_call_time(integer,timestamptz),public.claim_meta_attempt(text),public.begin_meta_dispatch(text,uuid),public.finish_meta_attempt(uuid,text) to service_role;
