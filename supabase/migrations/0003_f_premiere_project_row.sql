-- Seeds the project row for the current active demo project (F Premiere) so
-- the lead/call foreign keys resolve. The app itself never reads from this
-- table for project facts (src/data/demoProject.ts is the source of truth —
-- see lib/knowledge/service.ts), but lead.project_id and call.project_id
-- both have a foreign key against project.id (see 0001_init.sql), so a
-- matching row must exist here before any lead/call can be inserted for
-- this project. Run this after 0001_init.sql.

insert into project (id, name, developer, location, status)
values (
  'f-premiere',
  'F Premiere',
  'Home & Soul Infratech',
  'GH B-3, Sector 25, Jaypee Greens Sports City, Yamuna Expressway, Greater Noida, Uttar Pradesh 201308',
  'active'
)
on conflict (id) do update set
  name = excluded.name,
  developer = excluded.developer,
  location = excluded.location,
  status = excluded.status,
  updated_at = now();
