alter table public.funding_opportunities
add column if not exists external_id text,
add column if not exists source_type text,
add column if not exists source_url text,
add column if not exists published_date date,
add column if not exists raw_text text,
add column if not exists title_original text,
add column if not exists title_de text,
add column if not exists lang_original text,
add column if not exists summary_de text,
add column if not exists topics text[] not null default '{}',
add column if not exists funders text[] not null default '{}',
add column if not exists eligibility text check (eligibility in ('yes', 'check', 'no')),
add column if not exists eligibility_reason text,
add column if not exists priority text check (priority in ('red', 'amber', 'green')),
add column if not exists classification_reason text,
add column if not exists ai_processed_at timestamptz,
add column if not exists ai_model text,
add column if not exists amount_currency text,
add column if not exists own_contribution_required boolean,
add column if not exists nrw_required boolean,
add column if not exists applies_from_burundi_ok boolean;

create unique index if not exists funding_opportunities_org_source_external_id_idx
on public.funding_opportunities (org_id, source_type, external_id)
where external_id is not null;

create index if not exists funding_opportunities_org_deadline_idx
on public.funding_opportunities (org_id, deadline);

create index if not exists funding_opportunities_org_priority_deadline_idx
on public.funding_opportunities (org_id, priority, deadline);

create index if not exists funding_opportunities_org_ai_processed_idx
on public.funding_opportunities (org_id, ai_processed_at);
