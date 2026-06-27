
# Migrate Canopy from Lovable Cloud to your own Supabase project

Goal: move auth users + the `organizations` and `dashboard_preferences` tables (schema, data, RLS, trigger) off Lovable Cloud onto a Supabase project you own, then point the app at it.

You'll do most of this yourself in the Supabase dashboard and a terminal; I'll handle the in-app rewiring once you're ready.

---

## 1. Create your Supabase project

1. Sign in at supabase.com → **New project**.
2. Pick a region close to your users; set a strong DB password (save it).
3. Wait until the project is `ACTIVE_HEALTHY`.
4. From **Project Settings → API**, copy:
   - Project URL
   - `anon` public key
   - `service_role` key (server-only; never paste into the repo)
5. From **Project Settings → Database → Connection string**, copy the `psql` URI (you'll need it for the data dump).

## 2. Recreate the schema

In the new project's **SQL Editor**, run the migration below. It mirrors what's in Lovable Cloud today (tables, grants, RLS, and the signup trigger).

```sql
-- organizations
create table public.organizations (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  organization_type text,
  country_focus text[] not null default '{}',
  source_languages text[] not null default '{}',
  focus_areas text[] not null default '{}',
  selected_template text not null default 'burundi-kids',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.organizations to authenticated;
grant all on public.organizations to service_role;
alter table public.organizations enable row level security;
create policy "Org reads own row"    on public.organizations for select to authenticated using (id = auth.uid());
create policy "Org inserts own row"  on public.organizations for insert to authenticated with check (id = auth.uid());
create policy "Org updates own row"  on public.organizations for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- dashboard_preferences
create table public.dashboard_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  selected_template text not null default 'burundi-kids',
  layout jsonb not null default '[]'::jsonb,
  hidden_widgets jsonb not null default '[]'::jsonb,
  visible_widgets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.dashboard_preferences to authenticated;
grant all on public.dashboard_preferences to service_role;
alter table public.dashboard_preferences enable row level security;
create policy "Org reads own prefs"   on public.dashboard_preferences for select to authenticated using (organization_id = auth.uid());
create policy "Org inserts own prefs" on public.dashboard_preferences for insert to authenticated with check (organization_id = auth.uid());
create policy "Org updates own prefs" on public.dashboard_preferences for update to authenticated using (organization_id = auth.uid()) with check (organization_id = auth.uid());

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger orgs_touch   before update on public.organizations         for each row execute function public.touch_updated_at();
create trigger prefs_touch  before update on public.dashboard_preferences for each row execute function public.touch_updated_at();

-- auto-create org + prefs on signup (mirrors current handle_new_organization)
create or replace function public.handle_new_organization()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  tpl  text  := coalesce(meta->>'selected_template', 'burundi-kids');
begin
  insert into public.organizations (id, name, email, organization_type, country_focus, source_languages, focus_areas, selected_template)
  values (
    new.id,
    coalesce(meta->>'name', split_part(new.email, '@', 1)),
    new.email,
    meta->>'organization_type',
    coalesce(array(select jsonb_array_elements_text(meta->'country_focus')), '{}'),
    coalesce(array(select jsonb_array_elements_text(meta->'source_languages')), '{}'),
    coalesce(array(select jsonb_array_elements_text(meta->'focus_areas')), '{}'),
    tpl
  ) on conflict (id) do nothing;
  insert into public.dashboard_preferences (organization_id, selected_template)
  values (new.id, tpl) on conflict (organization_id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_organization();
```

## 3. Move the data

There are two parts: auth users and public tables.

**3a. Public tables** — I'll export `organizations` and `dashboard_preferences` from Lovable Cloud as CSV (drop them into `/mnt/documents/`) so you can import via the new project's **Table Editor → Import data from CSV** for each table. Order matters: organizations first, preferences second.

**3b. Auth users** — `auth.users` rows can't be CSV-imported because passwords are hashed and IDs are referenced by `organizations.id`. Two options:

- **Recommended (preserves IDs and passwords):** ask Supabase support to run an auth schema migration from the old project to the new one, or use `pg_dump --schema=auth` from Lovable Cloud's DB URL and restore into the new project (needs the service-role DB URL; I can produce the dump file).
- **Pragmatic for a hackathon:** wipe and re-register. Have each NGO sign up again on the new project; the trigger recreates org + prefs rows. Demo accounts (`demo-bk@canopy.ngo`, `demo-wtg@canopy.ngo`) are re-created by the login page's "Continue as…" buttons.

Tell me which path you want and I'll prep the exact dump/import commands.

## 4. Configure auth in the new project

In **Authentication → Providers / Settings**:
- Enable Email provider.
- For the hackathon, turn **off** "Confirm email" so signup returns a session immediately (matches current behavior).
- Add `http://localhost:8080` and your deployed URL to **Site URL** and **Redirect URLs**.

## 5. Point the app at your Supabase

Replace the four envs in `.env` (and your hosting provider) with the new project's values:

```
VITE_SUPABASE_URL=<your new project URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<your new anon key>
SUPABASE_URL=<same URL>
SUPABASE_PUBLISHABLE_KEY=<same anon key>
```

Do **not** put `service_role` into any `VITE_*` variable.

Once you give me the green light, I'll:
- Swap `src/integrations/supabase/client.ts` to read these envs (already does).
- Remove the Lovable Cloud integration bits we no longer need.
- Update `supabase/config.toml` `project_id` to your new ref so future local migrations target the right project.

## 6. Smoke test

1. `bun dev`, sign up a fresh NGO → confirm a row appears in `organizations` and a default row in `dashboard_preferences`.
2. Move/resize a widget → row updates within ~1s.
3. Log out, log back in → layout restored.
4. Run **Database → Linter** in the new project and fix any flagged issues.

## 7. Cut over and clean up

- Update your published deployment's env vars to the new project.
- Once verified, you can disable Lovable Cloud for this project (Connectors → Lovable Cloud → Disable) so future writes don't fork between two backends.

---

### What I need from you to start

1. Which data-migration path: **full auth dump** (preserves users + passwords) or **re-register fresh** (simpler)?
2. Whether you want me to generate the CSV exports of `organizations` / `dashboard_preferences` now so they're ready to import.
3. New project URL + anon key when you're ready for step 5 (paste the anon key inline — it's public; never paste the service-role key).
