update public.orgs
set
  news_countries = array['Kenya', 'Tanzania', 'South Africa', 'Namibia', 'Botswana'],
  news_topics = array[
    'animal-welfare',
    'wildlife-trade',
    'donkey-hide-trade',
    'puppy-trade',
    'field-ops',
    'law-policy'
  ],
  news_languages = array['en'],
  trusted_news_domains = array[
    'theguardian.com',
    'dw.com',
    'unep.org',
    'traffic.org',
    'worldanimalprotection.org'
  ]
where slug = 'wtg'
  and news_countries && array['Germany', 'European Union', 'International'];
