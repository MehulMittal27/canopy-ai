create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  country text,
  languages text[],
  topics text[],
  created_at timestamptz default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.orgs(id),
  full_name text,
  role text default 'member',
  created_at timestamptz default now()
);

create table public.dashboard_layouts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  template text,
  layout_json jsonb,
  updated_at timestamptz default now()
);

create table public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) not null,
  title text not null,
  source text,
  summary text,
  why_relevant text,
  full_summary text,
  next_steps text[],
  priority text check (priority in ('red', 'amber', 'green')),
  tags text[],
  item_date date,
  is_read boolean default false,
  is_saved boolean default false,
  created_at timestamptz default now()
);

create table public.funding_opportunities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) not null,
  funder text not null,
  title text,
  amount_min int,
  amount_max int,
  deadline date,
  match_score int,
  description text,
  url text,
  created_at timestamptz default now()
);

create table public.news_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) not null,
  source text,
  country_flag text,
  headline text,
  topic text,
  time_ago text,
  priority text check (priority in ('red', 'amber', 'green')),
  is_urgent boolean default false,
  is_saved boolean default false,
  created_at timestamptz default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) not null,
  title text,
  file_type text check (file_type in ('PDF', 'DOCX', 'XLSX')),
  category text check (category in ('Field', 'Donor', 'Advocacy', 'Communications')),
  source text,
  doc_date date,
  created_at timestamptz default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger dashboard_layouts_touch_updated_at
before update on public.dashboard_layouts
for each row
execute function public.touch_updated_at();

alter table public.orgs enable row level security;
alter table public.profiles enable row level security;
alter table public.dashboard_layouts enable row level security;
alter table public.inbox_items enable row level security;
alter table public.funding_opportunities enable row level security;
alter table public.news_items enable row level security;
alter table public.documents enable row level security;

grant usage on schema public to authenticated;

grant select on public.orgs to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select, insert, update on public.dashboard_layouts to authenticated;
grant select on public.inbox_items to authenticated;
grant update (is_read, is_saved) on public.inbox_items to authenticated;
grant select on public.funding_opportunities to authenticated;
grant select on public.news_items to authenticated;
grant select on public.documents to authenticated;

grant all on public.orgs to service_role;
grant all on public.profiles to service_role;
grant all on public.dashboard_layouts to service_role;
grant all on public.inbox_items to service_role;
grant all on public.funding_opportunities to service_role;
grant all on public.news_items to service_role;
grant all on public.documents to service_role;

create policy "Authenticated users can read orgs"
on public.orgs
for select
to authenticated
using (true);

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can read their own dashboard layout"
on public.dashboard_layouts
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own dashboard layout"
on public.dashboard_layouts
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own dashboard layout"
on public.dashboard_layouts
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can read inbox items for their org"
on public.inbox_items
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.org_id = inbox_items.org_id
  )
);

create policy "Users can update inbox saved/read flags for their org"
on public.inbox_items
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.org_id = inbox_items.org_id
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.org_id = inbox_items.org_id
  )
);

create policy "Users can read funding opportunities for their org"
on public.funding_opportunities
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.org_id = funding_opportunities.org_id
  )
);

create policy "Users can read news items for their org"
on public.news_items
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.org_id = news_items.org_id
  )
);

create policy "Users can read documents for their org"
on public.documents
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.org_id = documents.org_id
  )
);
