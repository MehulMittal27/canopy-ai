alter table public.orgs
add column if not exists admin_user_id uuid unique references auth.users(id) on delete set null;

drop policy if exists "Users can read inbox items for their org" on public.inbox_items;
drop policy if exists "Users can update inbox saved/read flags for their org" on public.inbox_items;
drop policy if exists "Users can read funding opportunities for their org" on public.funding_opportunities;
drop policy if exists "Users can read news items for their org" on public.news_items;
drop policy if exists "Users can read documents for their org" on public.documents;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop table if exists public.profiles;

grant insert, update on public.orgs to authenticated;

create policy "Users can create their own org"
on public.orgs
for insert
to authenticated
with check (admin_user_id = auth.uid());

create policy "Admins can update their own org"
on public.orgs
for update
to authenticated
using (admin_user_id = auth.uid())
with check (admin_user_id = auth.uid());

create policy "Users can read inbox items for their org"
on public.inbox_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orgs
    where orgs.id = inbox_items.org_id
      and orgs.admin_user_id = auth.uid()
  )
);

create policy "Users can update inbox saved/read flags for their org"
on public.inbox_items
for update
to authenticated
using (
  exists (
    select 1
    from public.orgs
    where orgs.id = inbox_items.org_id
      and orgs.admin_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.orgs
    where orgs.id = inbox_items.org_id
      and orgs.admin_user_id = auth.uid()
  )
);

create policy "Users can read funding opportunities for their org"
on public.funding_opportunities
for select
to authenticated
using (
  exists (
    select 1
    from public.orgs
    where orgs.id = funding_opportunities.org_id
      and orgs.admin_user_id = auth.uid()
  )
);

create policy "Users can read news items for their org"
on public.news_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orgs
    where orgs.id = news_items.org_id
      and orgs.admin_user_id = auth.uid()
  )
);

create policy "Users can read documents for their org"
on public.documents
for select
to authenticated
using (
  exists (
    select 1
    from public.orgs
    where orgs.id = documents.org_id
      and orgs.admin_user_id = auth.uid()
  )
);
