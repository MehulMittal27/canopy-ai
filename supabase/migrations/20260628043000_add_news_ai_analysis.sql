alter table public.news_items
add column if not exists ai_summary text,
add column if not exists ai_why_relevant text,
add column if not exists ai_next_steps text[] not null default '{}',
add column if not exists ai_priority text check (ai_priority in ('red', 'amber', 'green')),
add column if not exists ai_processed_at timestamptz,
add column if not exists ai_model text;

create index if not exists news_items_org_ai_processed_idx
on public.news_items (org_id, ai_processed_at);
