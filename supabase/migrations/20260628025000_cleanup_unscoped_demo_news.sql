delete from public.news_items
using public.orgs
where news_items.org_id = orgs.id
  and orgs.slug in ('burundi-kids', 'wtg')
  and news_items.raw_source = 'gdelt'
  and not exists (
    select 1
    from unnest(orgs.news_countries) as country
    where lower(
      coalesce(news_items.headline, '') || ' ' ||
      coalesce(news_items.snippet, '') || ' ' ||
      coalesce(news_items.source, '')
    ) like '%' || lower(country) || '%'
  );
