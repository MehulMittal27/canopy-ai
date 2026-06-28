alter table public.orgs
add column if not exists news_countries text[] not null default '{}',
add column if not exists news_topics text[] not null default '{}',
add column if not exists news_languages text[] not null default '{}',
add column if not exists trusted_news_domains text[] not null default '{}';

update public.orgs
set
  news_countries = array['Burundi'],
  news_topics = array[
    'education',
    'children',
    'gbv',
    'health',
    'floods',
    'humanitarian',
    'law-policy'
  ],
  news_languages = array['fr', 'rn', 'en'],
  trusted_news_domains = array[
    'iwacu-burundi.org',
    'rfi.fr',
    'reliefweb.int',
    'unwomen.org'
  ]
where slug = 'burundi-kids'
  and cardinality(news_countries) = 0
  and cardinality(news_topics) = 0
  and cardinality(news_languages) = 0
  and cardinality(trusted_news_domains) = 0;

update public.orgs
set
  news_countries = array['Germany', 'European Union', 'International'],
  news_topics = array[
    'animal-welfare',
    'wildlife-trade',
    'donkey-hide-trade',
    'puppy-trade',
    'field-ops',
    'law-policy'
  ],
  news_languages = array['de', 'en'],
  trusted_news_domains = array[
    'tagesschau.de',
    'dw.com',
    'theguardian.com',
    'reuters.com',
    'spiegel.de'
  ]
where slug = 'wtg'
  and cardinality(news_countries) = 0
  and cardinality(news_topics) = 0
  and cardinality(news_languages) = 0
  and cardinality(trusted_news_domains) = 0;
