-- Canopy demo user linker.
--
-- Run this in the Supabase SQL Editor after creating these Auth users:
--   burundi-kids@canopy.demo / canopy123
--   wtg@canopy.demo / canopy123
--
-- This links each Auth user to its org row and preloads the saved dashboard
-- layout used by the demo buttons.

update public.orgs
set admin_user_id = users.id
from auth.users
where public.orgs.slug = 'burundi-kids'
  and users.email = 'burundi-kids@canopy.demo';

update public.orgs
set admin_user_id = users.id
from auth.users
where public.orgs.slug = 'wtg'
  and users.email = 'wtg@canopy.demo';

insert into public.dashboard_layouts (user_id, template, layout_json)
select
  users.id,
  'bk',
  jsonb_build_object(
    'version', 2,
    'cols', 16,
    'items', jsonb_build_array(
      jsonb_build_object('i', 'inbox', 'x', 0, 'y', 0, 'w', 7, 'h', 6),
      jsonb_build_object('i', 'translator', 'x', 7, 'y', 0, 'w', 4, 'h', 6),
      jsonb_build_object('i', 'news', 'x', 11, 'y', 0, 'w', 5, 'h', 6),
      jsonb_build_object('i', 'reports', 'x', 0, 'y', 6, 'w', 16, 'h', 5)
    )
  )
from auth.users
where users.email = 'burundi-kids@canopy.demo'
on conflict (user_id) do update set
  template = excluded.template,
  layout_json = excluded.layout_json;

insert into public.dashboard_layouts (user_id, template, layout_json)
select
  users.id,
  'wtg',
  jsonb_build_object(
    'version', 2,
    'cols', 16,
    'items', jsonb_build_array(
      jsonb_build_object('i', 'news', 'x', 0, 'y', 0, 'w', 7, 'h', 6),
      jsonb_build_object('i', 'funding', 'x', 7, 'y', 0, 'w', 4, 'h', 6),
      jsonb_build_object('i', 'inbox', 'x', 11, 'y', 0, 'w', 5, 'h', 6),
      jsonb_build_object('i', 'reports', 'x', 0, 'y', 6, 'w', 16, 'h', 5)
    )
  )
from auth.users
where users.email = 'wtg@canopy.demo'
on conflict (user_id) do update set
  template = excluded.template,
  layout_json = excluded.layout_json;

select
  orgs.name,
  orgs.slug,
  users.email,
  orgs.admin_user_id,
  dashboard_layouts.template,
  dashboard_layouts.layout_json ->> 'version' as layout_version,
  dashboard_layouts.layout_json ->> 'cols' as layout_cols
from public.orgs
left join auth.users on users.id = orgs.admin_user_id
left join public.dashboard_layouts on dashboard_layouts.user_id = users.id
where orgs.slug in ('burundi-kids', 'wtg')
order by orgs.slug;
