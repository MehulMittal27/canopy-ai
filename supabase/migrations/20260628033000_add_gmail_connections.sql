create table public.org_gmail_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  google_email text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scope text,
  status text not null default 'active' check (status in ('active', 'disabled', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id)
);

create table public.gmail_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state text not null unique,
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.inbox_items
add column if not exists provider text,
add column if not exists provider_message_id text,
add column if not exists provider_thread_id text,
add column if not exists provider_grant_id text;

create unique index if not exists inbox_items_provider_message_id_idx
on public.inbox_items (provider, provider_message_id)
where provider_message_id is not null;

create table public.gmail_ingest_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  gmail_message_id text not null,
  gmail_thread_id text,
  gmail_connection_id uuid references public.org_gmail_connections(id) on delete set null,
  inbox_item_id uuid references public.inbox_items(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, gmail_message_id)
);

create trigger org_gmail_connections_touch_updated_at
before update on public.org_gmail_connections
for each row
execute function public.touch_updated_at();

alter table public.org_gmail_connections enable row level security;
alter table public.gmail_oauth_states enable row level security;
alter table public.gmail_ingest_events enable row level security;

grant all on public.org_gmail_connections to service_role;
grant all on public.gmail_oauth_states to service_role;
grant all on public.gmail_ingest_events to service_role;
