alter table public.news_items
add column if not exists external_id text,
add column if not exists source_url text,
add column if not exists published_at timestamptz,
add column if not exists snippet text,
add column if not exists raw_source text;

create unique index if not exists news_items_org_raw_external_id_idx
on public.news_items (org_id, raw_source, external_id)
where external_id is not null;

create unique index if not exists news_items_org_source_url_idx
on public.news_items (org_id, source_url)
where source_url is not null;
