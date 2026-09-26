-- Add only the Solar demo parent row required by lead/call foreign keys.
insert into public.project (id,name,developer,location,status)
values ('solar','Solar Lead Qualification','BetterCallz','Residential & commercial solar','active')
on conflict (id) do nothing;
