insert into public.orgs (name, slug, country, languages, topics)
values
  (
    'Burundi Kids',
    'burundi-kids',
    'Burundi',
    array['fr', 'rn', 'en'],
    array['education', 'gbv', 'children', 'health']
  ),
  (
    'Welttierschutzgesellschaft / WTG',
    'wtg',
    'Germany',
    array['en', 'de'],
    array['animal-welfare', 'wildlife', 'field-ops']
  )
on conflict (slug) do update set
  name = excluded.name,
  country = excluded.country,
  languages = excluded.languages,
  topics = excluded.topics;

insert into public.inbox_items (
  org_id,
  title,
  source,
  summary,
  why_relevant,
  full_summary,
  next_steps,
  priority,
  tags,
  item_date,
  is_saved
)
values
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'Flooding disrupts schools in Bujumbura neighborhoods',
    'ReliefWeb',
    'Heavy rainfall has damaged homes and contaminated wells in low-lying Bujumbura neighborhoods, with several schools temporarily closed.',
    'Burundi Kids may need to coordinate short-term school supply support and check whether partner schools are affected.',
    'Local authorities and humanitarian partners report flooding after several days of heavy rain. Families with children have moved into temporary shelters, and water contamination is raising health concerns. School attendance is disrupted in the affected districts.',
    array['Call partner school directors in Bujumbura', 'Check emergency education supply budget', 'Monitor cholera risk updates'],
    'red',
    array['health', 'children', 'education'],
    '2026-06-26',
    true
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'BMZ announces education and gender equality funding window',
    'BMZ',
    'A new German funding call prioritizes girls education, safeguarding, and gender equality projects in Sub-Saharan Africa.',
    'The call matches Burundi Kids programming in Gitega and could fund a follow-up phase for girls education.',
    'The programme invites German non-profits with local partners to submit concept notes for education and gender equality projects. Strong applications should show safeguarding standards, local ownership, and measurable school retention outcomes.',
    array['Draft concept note outline', 'Confirm co-financing requirements', 'Request updated partner budget'],
    'red',
    array['funding', 'education', 'gbv'],
    '2026-06-25',
    false
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'Regional GBV prevention report highlights school-based interventions',
    'UN Women',
    'A regional report identifies school clubs and referral pathways as promising GBV prevention models for adolescent girls.',
    'The recommendations can strengthen Burundi Kids programme design and donor reporting.',
    'The report compares GBV prevention interventions across East and Central Africa. It emphasizes trusted reporting channels, teacher training, and integration with health referral services.',
    array['Share report with programme lead', 'Map current referral partners', 'Add findings to next donor update'],
    'amber',
    array['gbv', 'children', 'education'],
    '2026-06-24',
    true
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'Education ministry plans consultations on rural dropout rates',
    'Iwacu',
    'Burundi education officials are preparing consultations on rural dropout, with girls retention listed as a priority.',
    'This creates an opening for Burundi Kids to share field evidence from partner schools.',
    'The ministry is expected to invite civil society and school leaders to discuss retention barriers, including transport, school materials, early marriage, and household income pressure.',
    array['Ask local partner about consultation calendar', 'Prepare one-page evidence brief', 'Identify student retention examples'],
    'amber',
    array['education', 'children'],
    '2026-06-23',
    false
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'Health partners warn of malaria rise after seasonal rains',
    'WHO Burundi',
    'Health partners are monitoring increased malaria cases in several provinces after heavy rains.',
    'Malaria spikes can affect attendance and child wellbeing in Burundi Kids partner communities.',
    'The update notes pressure on community health workers and recommends prevention messaging, mosquito net distribution, and rapid referral for children with fever.',
    array['Ask schools about absenteeism', 'Coordinate prevention message with partners', 'Track local clinic capacity'],
    'amber',
    array['health', 'children'],
    '2026-06-22',
    false
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'Local library project expands French and Kirundi materials',
    'Le Renouveau',
    'A community education initiative is expanding access to French and Kirundi reading materials for primary school children.',
    'This is relevant for literacy activities and potential partner learning exchanges.',
    'The project adds age-appropriate books and reading clubs in rural communities. Organizers plan to publish a low-cost implementation guide later this year.',
    array['Save for literacy planning', 'Contact organizers for materials list', 'Compare with current book needs'],
    'green',
    array['education', 'children'],
    '2026-06-20',
    false
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'Donkey hide trade resurfaces through West African ports',
    'The Guardian',
    'Investigators report renewed donkey hide trafficking routes and pressure on working animal populations.',
    'WTG may need to brief advocacy partners and assess whether field programmes are seeing related welfare impacts.',
    'The investigation describes cross-border sourcing networks, weak enforcement, and rising prices for hides. Animal welfare groups warn of theft, transport cruelty, and livelihood harm for communities that depend on donkeys.',
    array['Alert international advocacy team', 'Check field partner observations', 'Prepare short issue brief'],
    'red',
    array['animal-welfare', 'field-ops'],
    '2026-06-26',
    true
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'Bundestag debates revised animal welfare law',
    'Tagesschau',
    'German lawmakers are debating updates to animal welfare rules covering transport, breeding, and enforcement.',
    'The debate affects WTG advocacy priorities and German supporter communications.',
    'The proposal includes tighter rules for certain breeding practices and improved inspection powers. NGOs are calling for stronger implementation timelines and penalties.',
    array['Review proposed amendments', 'Prepare German advocacy update', 'Coordinate statement with coalition partners'],
    'amber',
    array['animal-welfare', 'advocacy'],
    '2026-06-25',
    false
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'Investigation links puppy trade networks to online marketplaces',
    'Der Spiegel',
    'A new investigation traces illegal puppy sales through online ads, forged documents, and cross-border transport.',
    'This supports WTG campaign work on companion animal welfare and enforcement gaps.',
    'Reporters documented breeders and brokers moving puppies through several countries with minimal veterinary checks. Welfare groups warn that buyers often discover serious health issues after purchase.',
    array['Save evidence for campaign team', 'Check if named routes overlap WTG focus countries', 'Draft supporter explainer'],
    'red',
    array['animal-welfare', 'field-ops'],
    '2026-06-24',
    true
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'EU panel reviews live animal transport time limits',
    'Reuters',
    'An EU advisory panel is reviewing evidence on live animal transport duration and heat stress safeguards.',
    'WTG can use the evidence window to reinforce policy asks on transport welfare.',
    'The panel is considering veterinary evidence, enforcement feasibility, and climate-related heat risk. Final recommendations are expected later this year.',
    array['Share consultation timeline internally', 'Compile field evidence on transport welfare', 'Track final recommendation date'],
    'amber',
    array['animal-welfare', 'advocacy'],
    '2026-06-23',
    false
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'Shelters report rising intake after summer abandonment',
    'DW',
    'German shelters are reporting higher animal intake linked to seasonal abandonment and rising care costs.',
    'This may be relevant for WTG communications around responsible ownership and shelter pressure.',
    'Shelter associations describe full facilities, higher veterinary costs, and longer adoption timelines. They are asking municipalities for more predictable support.',
    array['Consider supporter newsletter angle', 'Check shelter partner needs', 'Monitor municipal funding debate'],
    'green',
    array['animal-welfare'],
    '2026-06-21',
    false
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'Wildlife rescue partners request guidance after regional fires',
    'Field Partner Update',
    'A field partner reports increased wildlife rescue pressure after fires damaged habitat near project communities.',
    'WTG may need to review emergency response guidance and partner support needs.',
    'The partner update describes displaced small mammals and birds, limited temporary holding capacity, and a need for triage guidance. No immediate funding gap has been confirmed.',
    array['Ask partner for caseload numbers', 'Share rescue triage checklist', 'Assess emergency microgrant need'],
    'amber',
    array['wildlife', 'field-ops'],
    '2026-06-20',
    false
  );

insert into public.funding_opportunities (
  org_id,
  funder,
  title,
  amount_min,
  amount_max,
  deadline,
  match_score,
  description,
  url
)
values
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'BMZ',
    'Girls Education and Protection in Sub-Saharan Africa',
    150000,
    400000,
    '2026-07-15',
    94,
    'Supports education access, safeguarding, and gender equality projects with local partners.',
    'https://www.bmz.de/'
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'Engagement Global bengo',
    'Small NGO Development Cooperation Projects',
    50000,
    250000,
    '2026-09-30',
    88,
    'Co-financing for German NGOs with established partner organizations in the Global South.',
    'https://www.engagement-global.de/bengo'
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'UN Women',
    'Community GBV Prevention Innovation Fund',
    40000,
    120000,
    '2026-08-20',
    81,
    'Funds community-based prevention pilots, referral pathways, and adolescent girls programming.',
    'https://www.unwomen.org/'
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'Robert Bosch Stiftung',
    'Youth Resilience in East Africa',
    50000,
    180000,
    '2026-10-10',
    73,
    'Two-year grants for youth wellbeing, education continuity, and resilience programming.',
    'https://www.bosch-stiftung.de/'
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'Vier Pfoten Foundation',
    'Stray Animal Welfare Co-funding',
    30000,
    90000,
    '2026-07-18',
    91,
    'Co-funding for spay/neuter, shelter capacity, and responsible ownership programmes.',
    'https://www.vier-pfoten.org/'
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'World Animal Net',
    'Donkey Trade Monitoring Grant',
    25000,
    75000,
    '2026-08-05',
    86,
    'Supports monitoring, evidence collection, and advocacy on the cross-border donkey hide trade.',
    'https://worldanimal.net/'
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'EU LIFE Programme',
    'Animal Welfare in Agriculture',
    200000,
    600000,
    '2026-09-12',
    78,
    'Large grants for farm animal welfare improvements, policy pilots, and consortium projects.',
    'https://cinea.ec.europa.eu/programmes/life_en'
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'Brigitte Bardot Foundation',
    'International Rescue Operations',
    15000,
    50000,
    '2026-10-01',
    68,
    'Small grants for urgent rescue, rehabilitation, and emergency animal care projects.',
    'https://www.fondationbrigittebardot.fr/'
  );

insert into public.news_items (
  org_id,
  source,
  country_flag,
  headline,
  topic,
  time_ago,
  priority,
  is_urgent,
  is_saved
)
values
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'Iwacu',
    '🇧🇮',
    'Bujumbura flood response focuses on displaced children',
    'health',
    '2h ago',
    'red',
    true,
    true
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'RFI Afrique',
    '🇫🇷',
    'Burundi prepares consultations on girls school retention',
    'education',
    '6h ago',
    'amber',
    false,
    false
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'ReliefWeb',
    '🌍',
    'Humanitarian partners warn of waterborne disease risk after rains',
    'health',
    '10h ago',
    'red',
    true,
    false
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'UN Women',
    '🌍',
    'Regional GBV prevention guidance highlights school referral models',
    'gbv',
    '1d ago',
    'amber',
    false,
    true
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'Le Renouveau',
    '🇧🇮',
    'Community reading clubs expand Kirundi materials for children',
    'education',
    '2d ago',
    'green',
    false,
    false
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'The Guardian',
    '🇬🇧',
    'Donkey hide trade routes resurface in West African ports',
    'animal-welfare',
    '1h ago',
    'red',
    true,
    true
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'Tagesschau',
    '🇩🇪',
    'Bundestag debates stricter animal welfare enforcement',
    'animal-welfare',
    '4h ago',
    'amber',
    false,
    true
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'Der Spiegel',
    '🇩🇪',
    'Puppy trade investigation traces forged documents and online ads',
    'field-ops',
    '8h ago',
    'red',
    true,
    false
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'Reuters',
    '🌍',
    'EU panel reviews evidence on live animal transport limits',
    'animal-welfare',
    '1d ago',
    'amber',
    false,
    false
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'DW',
    '🇩🇪',
    'Shelters report higher animal intake and rising care costs',
    'animal-welfare',
    '2d ago',
    'green',
    false,
    false
  );

insert into public.documents (
  org_id,
  title,
  file_type,
  category,
  source,
  doc_date
)
values
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'Gitega Girls Education Programme Q2 Field Report',
    'PDF',
    'Field',
    'Burundi Kids field team',
    '2026-06-18'
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'BMZ Concept Note Draft - Education and Safeguarding',
    'DOCX',
    'Donor',
    'Programme team',
    '2026-06-24'
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'School Attendance Tracking June',
    'XLSX',
    'Field',
    'Partner schools',
    '2026-06-25'
  ),
  (
    (select id from public.orgs where slug = 'burundi-kids'),
    'GBV Referral Pathway Brief',
    'PDF',
    'Advocacy',
    'Programme team',
    '2026-06-20'
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'Donkey Hide Trade Monitoring Brief',
    'PDF',
    'Advocacy',
    'International advocacy team',
    '2026-06-24'
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'German Animal Welfare Law Position Paper',
    'DOCX',
    'Advocacy',
    'Policy team',
    '2026-06-23'
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'Puppy Trade Investigation Evidence Log',
    'XLSX',
    'Field',
    'Research partners',
    '2026-06-22'
  ),
  (
    (select id from public.orgs where slug = 'wtg'),
    'Shelter Support Newsletter Draft',
    'DOCX',
    'Communications',
    'Communications team',
    '2026-06-21'
  );
