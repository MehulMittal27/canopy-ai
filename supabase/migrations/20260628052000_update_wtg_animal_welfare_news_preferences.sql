update public.orgs
set
  news_countries = array[
    'Kenya',
    'Malawi',
    'South Africa',
    'Tanzania',
    'Uganda',
    'Ethiopia',
    'Nigeria',
    'Namibia',
    'Botswana',
    'Zambia',
    'Zimbabwe',
    'Rwanda',
    'Democratic Republic of the Congo'
  ],
  news_topics = array[
    'animal-welfare',
    'wildlife-trade',
    'donkey-hide-trade',
    'rabies',
    'stray-dogs',
    'livestock-welfare',
    'social-media-animal-cruelty',
    'veterinary-care',
    'animal-rescue',
    'law-policy'
  ],
  news_languages = array['en', 'de'],
  trusted_news_domains = array[
    'welttierschutz.org',
    'worldanimalprotection.org',
    'four-paws.org',
    'ifaw.org',
    'woah.org',
    'traffic.org',
    'theguardian.com',
    'dw.com'
  ]
where slug = 'wtg';
