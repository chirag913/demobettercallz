-- Reuse the established lead/call foreign keys and JSON intelligence column.
insert into public.project (id, name, developer, location, status)
values ('bettercallz-live', 'BetterCallz live demo', 'BetterCallz', '', 'active')
on conflict (id) do nothing;
