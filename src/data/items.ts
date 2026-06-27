import type { NgoId } from "@/lib/ngo-store";

export type Urgency = "red" | "yellow" | "green";
export type Category = "news" | "funding" | "report";
export type EligibilityVerdict = "yes" | "check" | "no";
export type Confidence = "high" | "medium" | "low";

export interface Item {
  id: string;
  ngo_id: NgoId;
  urgency: Urgency;
  category: Category;
  source: string;
  source_language: "fr" | "en" | "de";
  source_url: string;
  published_at: string; // ISO
  original_title: string;
  original_text: string;
  translated_title: string;
  summary: string;
  full_summary: string;
  why_relevant: string;
  next_steps: string[];
  topic_tags: string[];
  funding_deadline: string | null;
  funding_amount_min: number | null;
  funding_amount_max: number | null;
  funding_funder: string | null;
  eligibility_verdict: EligibilityVerdict | null;
  eligibility_reason: string | null;
  confidence: Confidence;
  model: string;
  created_at: string;
}

const MODEL = "claude-sonnet-4";
const now = "2026-06-27T07:00:00Z";

const d = (offsetDays: number, hour = 8): string => {
  const base = new Date("2026-06-27T00:00:00Z");
  base.setUTCDate(base.getUTCDate() + offsetDays);
  base.setUTCHours(hour, 0, 0, 0);
  return base.toISOString();
};

export const items: Item[] = [
  // ---------- BURUNDI KIDS (15) ----------
  {
    id: "bk-01",
    ngo_id: "bk",
    urgency: "red",
    category: "news",
    source: "Iwacu",
    source_language: "fr",
    source_url: "https://www.iwacu-burundi.org/",
    published_at: d(-1, 9),
    original_title: "Affrontements signalés à la frontière entre le Burundi et la RDC",
    original_text:
      "Des tirs ont été entendus dans la nuit près de la frontière entre la province de Cibitoke et le Sud-Kivu.",
    translated_title: "Clashes reported on the Burundi–DRC border",
    summary:
      "Gunfire was heard overnight near the border between Cibitoke province and South Kivu. Local authorities are urging caution. Cross-border movement has been restricted.",
    full_summary:
      "Residents of the border area between Cibitoke and South Kivu report nighttime gunfire along the Burundi–DRC border. The Burundian army has deployed additional units to the region. Several families have fled to neighbouring villages. Authorities advise against non-essential travel near the border. Aid organisations on the ground are monitoring the situation. No civilian casualties have been reported so far. The situation remains tense.",
    why_relevant:
      "Directly affects the safety of staff and partner schools in Gateri, plus travel routes between Bujumbura and Gitega.",
    next_steps: [
      "Check security situation with partners in Cibitoke",
      "Suspend travel near the border this week",
      "Activate emergency contacts in Gateri",
    ],
    topic_tags: ["Security", "Humanitarian"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "bk-02",
    ngo_id: "bk",
    urgency: "red",
    category: "funding",
    source: "BMZ",
    source_language: "de",
    source_url: "https://www.bmz.de/",
    published_at: d(-2, 10),
    original_title: "BMZ-Förderaufruf: Bildung und Gleichstellung in Subsahara-Afrika",
    original_text:
      "Das BMZ ruft kleine und mittlere Trägerorganisationen zur Einreichung von Projektskizzen auf.",
    translated_title: "BMZ call: Education and gender equality in Sub-Saharan Africa",
    summary:
      "Germany's BMZ is opening funding for projects on girls' education and gender equality in Sub-Saharan Africa. Small German organisations are explicitly invited to apply. Submissions go through the BMZ portal.",
    full_summary:
      "BMZ is opening a new funding call for projects strengthening access to education for girls in Sub-Saharan Africa. Eligible projects run 24–36 months with a 10% own contribution. Applicants must be German-registered non-profits with documented project experience in the region. Concept notes are limited to eight pages and must describe the theory of change. Evaluation criteria include impact logic, sustainability, and local anchoring.",
    why_relevant:
      "Direct match for ongoing girls' education work in Gitega and for GBV prevention at partner schools.",
    next_steps: [
      "Prepare concept note for girls' education project in Gitega",
      "Clarify own contribution with the board",
      "Contact local partners for letters of support",
    ],
    topic_tags: ["Funding", "Education", "GBV"],
    funding_deadline: d(5),
    funding_amount_min: 150000,
    funding_amount_max: 400000,
    funding_funder: "BMZ",
    eligibility_verdict: "yes",
    eligibility_reason:
      "Burundi Kids is a registered non-profit in NRW with long-standing project experience in Burundi and already works on girls' education in Gitega.",
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "bk-03",
    ngo_id: "bk",
    urgency: "red",
    category: "report",
    source: "ReliefWeb",
    source_language: "en",
    source_url: "https://reliefweb.int/",
    published_at: d(-1, 14),
    original_title: "Burundi: Heavy rainfall displaces hundreds in Bujumbura",
    original_text:
      "Heavy rains over the past week have caused flooding in several neighborhoods of Bujumbura.",
    translated_title: "Burundi: Heavy rainfall displaces hundreds in Bujumbura",
    summary:
      "Persistent heavy rain has flooded several Bujumbura neighbourhoods. More than 600 people are displaced. Local authorities are setting up emergency shelters.",
    full_summary:
      "Days of heavy rain have caused flooding in the Buterere and Kinama neighbourhoods. Houses have collapsed and wells are contaminated. More than 600 people, many of them children, have been displaced. Municipal authorities, working with OCHA and Caritas, are setting up temporary shelters. There is an elevated cholera risk. Schools in the affected neighbourhoods remain closed.",
    why_relevant:
      "Buterere is near the catchment of a partner school; affected children will need school supplies and short-term support.",
    next_steps: [
      "Contact the school leadership in Buterere",
      "Review emergency budget for school supplies",
    ],
    topic_tags: ["Humanitarian", "Education", "Health"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "bk-04",
    ngo_id: "bk",
    urgency: "yellow",
    category: "news",
    source: "RFI Afrique",
    source_language: "fr",
    source_url: "https://www.rfi.fr/fr/afrique/",
    published_at: d(-3, 11),
    original_title: "Burundi : nouvelle stratégie nationale pour l'éducation des filles",
    original_text:
      "Le ministère de l'Éducation a présenté une nouvelle stratégie quinquennale.",
    translated_title: "Burundi: New national strategy for girls' education",
    summary:
      "Burundi's Ministry of Education has presented a five-year strategy to reduce school dropout among girls. Focus is on rural provinces. NGOs are explicitly invited to participate.",
    full_summary:
      "The strategy provides for scholarships, school meals, and WASH infrastructure at girls' schools. Provinces with high dropout rates — including Gitega and Cibitoke — are prioritised. The ministry plans civil society consultations in the coming months. First pilot programmes start in 2027.",
    why_relevant:
      "Aligns with the ongoing education programme in Gitega; possible entry point into the consultation process.",
    next_steps: [
      "Request a consultation slot in Gitega",
      "Share the strategy paper with the programme team",
    ],
    topic_tags: ["Education", "GBV"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "medium",
    model: MODEL,
    created_at: now,
  },
  {
    id: "bk-05",
    ngo_id: "bk",
    urgency: "yellow",
    category: "funding",
    source: "Engagement Global",
    source_language: "de",
    source_url: "https://www.engagement-global.de/",
    published_at: d(-4, 9),
    original_title: "bengo: Förderung kleiner privater Träger in der EZ",
    original_text: "Engagement Global ruft kleine Trägerorganisationen zur Antragstellung auf.",
    translated_title: "bengo: Funding for small private organisations in development cooperation",
    summary:
      "Engagement Global (bengo) is opening the next application round for small private organisations. Eligible projects are in German development cooperation partner countries, including Burundi.",
    full_summary:
      "bengo funding targets small German NGOs with partner organisations in the Global South. Up to EUR 250,000 per project. Own contribution of at least 25%, partly provable through donations. Applications are accepted on a rolling basis; the next selection round closes in September.",
    why_relevant:
      "Burundi Kids meets the small-organisation criteria and has established partners in Gitega and Gateri.",
    next_steps: [
      "Check sources for own contribution",
      "Align concept paper with the partner in Gateri",
    ],
    topic_tags: ["Funding", "Education"],
    funding_deadline: d(60),
    funding_amount_min: 50000,
    funding_amount_max: 250000,
    funding_funder: "Engagement Global (bengo)",
    eligibility_verdict: "yes",
    eligibility_reason:
      "Burundi Kids is a small German non-profit with long-standing partner structures in Burundi.",
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "bk-06",
    ngo_id: "bk",
    urgency: "yellow",
    category: "news",
    source: "BBC Afrique",
    source_language: "fr",
    source_url: "https://www.bbc.com/afrique",
    published_at: d(-2, 16),
    original_title: "Région des Grands Lacs : nouvelle initiative régionale contre les VBG",
    original_text: "Une initiative régionale de lutte contre les VBG a été lancée à Bujumbura.",
    translated_title: "Great Lakes: new regional initiative against GBV",
    summary:
      "A regional initiative to combat gender-based violence has been launched in Bujumbura. Burundi, Rwanda, Uganda and the DRC are participating.",
    full_summary:
      "The initiative is coordinated by the East African Community and aims to create cross-border protection mechanisms for survivors of sexual violence. Local NGOs are foreseen as implementation partners. First pilot projects start in Bujumbura and Bukavu.",
    why_relevant:
      "Direct hook into the GBV prevention programme and partner work in the Great Lakes region.",
    next_steps: ["Discuss the initiative with the GBV lead on the programme team"],
    topic_tags: ["GBV", "Humanitarian"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "medium",
    model: MODEL,
    created_at: now,
  },
  {
    id: "bk-07",
    ngo_id: "bk",
    urgency: "yellow",
    category: "report",
    source: "UNICEF",
    source_language: "en",
    source_url: "https://www.unicef.org/burundi/",
    published_at: d(-3, 13),
    original_title: "Burundi child protection situation update Q2 2026",
    original_text: "UNICEF reports rising school dropout rates among girls aged 12–16.",
    translated_title: "UNICEF: Burundi child protection situation update Q2 2026",
    summary:
      "UNICEF reports rising dropout rates among girls aged 12–16 in rural Burundi. Early marriage and poverty are cited as the main drivers.",
    full_summary:
      "The quarterly report shows an 8% increase in dropout rates for girls in Cibitoke and Ruyigi versus the previous quarter. Early marriage, unplanned pregnancies, and economic pressure on families are the key factors. UNICEF recommends stronger awareness campaigns and conditional cash transfers to affected households.",
    why_relevant:
      "Data basis for arguments in funding proposals for girls' education in Gitega and Cibitoke.",
    next_steps: ["Reuse data points for the BMZ proposal"],
    topic_tags: ["Education", "GBV", "Health"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "bk-08",
    ngo_id: "bk",
    urgency: "yellow",
    category: "news",
    source: "Yaga",
    source_language: "fr",
    source_url: "https://www.yaga-burundi.com/",
    published_at: d(-4, 12),
    original_title: "Bujumbura : pénurie de médicaments dans plusieurs centres de santé",
    original_text: "Plusieurs centres de santé de Bujumbura signalent une pénurie.",
    translated_title: "Bujumbura: Medicine shortages in several health centres",
    summary:
      "Several Bujumbura health centres have reported shortages of basic medicines for the past two weeks. Antibiotics and antimalarials are particularly affected.",
    full_summary:
      "Local pharmacies cannot meet demand; the Ministry of Health points to supply problems. NGOs fear effects on children and pregnant women. First donation drives by local diaspora groups are getting under way.",
    why_relevant:
      "Affects health care near the partner school in Bujumbura; pupils with chronic conditions are particularly at risk.",
    next_steps: ["Get a status update from the health partner in Bujumbura"],
    topic_tags: ["Health", "Humanitarian"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "medium",
    model: MODEL,
    created_at: now,
  },
  {
    id: "bk-09",
    ngo_id: "bk",
    urgency: "green",
    category: "funding",
    source: "Misereor",
    source_language: "de",
    source_url: "https://www.misereor.de/",
    published_at: d(-5, 10),
    original_title: "Misereor: Themenförderung Bildung und Empowerment",
    original_text: "Misereor informiert über die kommende Themenförderung.",
    translated_title: "Misereor: Thematic funding for education and empowerment",
    summary:
      "Misereor is announcing thematic funding for education and empowerment in Africa. The application window opens in autumn.",
    full_summary:
      "Misereor plans an open call in Q4 on education and empowerment. Long-term partner projects are eligible. Concrete application terms will be published in September. Own contribution is expected to be 25%.",
    why_relevant:
      "Lead time for strategic planning of a follow-up application to the ongoing education project in Gitega.",
    next_steps: ["Inform the programme team about Q4 planning"],
    topic_tags: ["Funding", "Education"],
    funding_deadline: d(120),
    funding_amount_min: 100000,
    funding_amount_max: 300000,
    funding_funder: "Misereor",
    eligibility_verdict: "check",
    eligibility_reason:
      "Burundi Kids generally meets the criteria; detailed terms are not published until September.",
    confidence: "medium",
    model: MODEL,
    created_at: now,
  },
  {
    id: "bk-10",
    ngo_id: "bk",
    urgency: "green",
    category: "news",
    source: "Iwacu",
    source_language: "fr",
    source_url: "https://www.iwacu-burundi.org/",
    published_at: d(-5, 8),
    original_title: "Gitega : inauguration d'une nouvelle bibliothèque scolaire",
    original_text: "Une bibliothèque scolaire financée par une ONG locale a été inaugurée.",
    translated_title: "Gitega: New school library inaugurated",
    summary:
      "A new school library has been inaugurated in Gitega. The project was funded by a local NGO and is designed to serve 400 pupils.",
    full_summary:
      "The library holds 1,200 books in French and Kirundi and is part of a larger education project. The opening took place in the presence of local authorities. Further libraries in surrounding communities are planned.",
    why_relevant:
      "Possible cooperation partner for reading sponsorships in Gitega; complements the existing education work.",
    next_steps: [],
    topic_tags: ["Education"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "bk-11",
    ngo_id: "bk",
    urgency: "green",
    category: "report",
    source: "VENRO",
    source_language: "de",
    source_url: "https://venro.org/",
    published_at: d(-6, 11),
    original_title: "VENRO-Bericht: Lage kleiner Träger in der EZ 2026",
    original_text: "Der Dachverband VENRO veröffentlicht seinen Jahresbericht.",
    translated_title: "VENRO report: State of small organisations in German development cooperation 2026",
    summary:
      "The VENRO report covers the funding situation, staffing trends, and political conditions for small German NGOs in development cooperation.",
    full_summary:
      "The report shows growing competition for BMZ funding and rising demands on impact measurement. Small organisations are seeing private donations decline. VENRO recommends stronger cooperation and joint fundraising strategies.",
    why_relevant:
      "Background reading for board meetings and strategic planning for small NRW-based organisations like Burundi Kids.",
    next_steps: [],
    topic_tags: ["Funding"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "bk-12",
    ngo_id: "bk",
    urgency: "green",
    category: "news",
    source: "RFI Afrique",
    source_language: "fr",
    source_url: "https://www.rfi.fr/fr/afrique/",
    published_at: d(-6, 9),
    original_title: "Burundi : amélioration de la couverture vaccinale infantile",
    original_text: "Le ministère de la Santé rapporte une amélioration significative.",
    translated_title: "Burundi: Improved childhood vaccination coverage",
    summary:
      "The Ministry of Health reports significant progress in vaccination rates for children under five. Several provinces are meeting WHO targets for the first time.",
    full_summary:
      "Nationwide coverage for standard vaccinations is now 87%. Rural regions such as Cibitoke saw the largest gains. International donors, including Gavi, co-financed the logistics.",
    why_relevant:
      "Positive context for the health component of partner school programmes; usable in reports to donors.",
    next_steps: [],
    topic_tags: ["Health"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "bk-13",
    ngo_id: "bk",
    urgency: "green",
    category: "funding",
    source: "Bread for the World",
    source_language: "de",
    source_url: "https://www.brot-fuer-die-welt.de/",
    published_at: d(-6, 14),
    original_title: "Brot für die Welt: Vorinformation neue Projektförderung",
    original_text: "Brot für die Welt informiert über eine kommende Projektförderung.",
    translated_title: "Bread for the World: Heads-up on new project funding",
    summary:
      "Bread for the World is planning project funding on educational equity in Sub-Saharan Africa. Details and the application window will be published in autumn.",
    full_summary:
      "The planned funding line focuses on girls' education and inclusive schooling. Concrete amounts and own contributions are not yet set. It is recommended to join the distribution list.",
    why_relevant:
      "Possible co-financing source alongside BMZ for ongoing education work in Gitega.",
    next_steps: ["Check distribution-list signup"],
    topic_tags: ["Funding", "Education"],
    funding_deadline: d(150),
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: "Bread for the World",
    eligibility_verdict: "check",
    eligibility_reason:
      "Burundi Kids is in principle eligible as a small organisation; concrete criteria are still pending.",
    confidence: "medium",
    model: MODEL,
    created_at: now,
  },
  {
    id: "bk-14",
    ngo_id: "bk",
    urgency: "green",
    category: "report",
    source: "ReliefWeb",
    source_language: "en",
    source_url: "https://reliefweb.int/",
    published_at: d(-4, 7),
    original_title: "Great Lakes Region humanitarian overview June 2026",
    original_text: "OCHA's monthly humanitarian overview for the Great Lakes Region.",
    translated_title: "OCHA: Great Lakes humanitarian overview June 2026",
    summary:
      "OCHA's monthly report shows continued displacement and food insecurity in the Great Lakes region. Burundi continues to receive refugees from the DRC.",
    full_summary:
      "More than 90,000 Congolese refugees currently live in Burundian reception facilities, with a significant share being children and adolescents. Education and psychosocial support are underfunded. OCHA calls for stronger international donor engagement.",
    why_relevant:
      "Provides context and numbers for Burundi Kids' work with refugee children near the DRC border.",
    next_steps: [],
    topic_tags: ["Humanitarian", "Education"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "bk-15",
    ngo_id: "bk",
    urgency: "green",
    category: "news",
    source: "Yaga",
    source_language: "fr",
    source_url: "https://www.yaga-burundi.com/",
    published_at: d(-3, 17),
    original_title: "Bujumbura : nouvelle formation professionnelle pour jeunes filles",
    original_text: "Une ONG locale lance un programme de formation professionnelle.",
    translated_title: "Bujumbura: New vocational training for young women",
    summary:
      "A local NGO is launching a vocational training programme for young women in Bujumbura. Focus areas are tailoring and basic digital skills.",
    full_summary:
      "The programme targets girls who have dropped out of school and offers a six-month training cycle followed by placement in local businesses. The first cohort includes 40 participants.",
    why_relevant:
      "Possible local partner for the planned vocational training component in Gateri.",
    next_steps: ["Reach out to the local NGO"],
    topic_tags: ["Education", "GBV"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "medium",
    model: MODEL,
    created_at: now,
  },

  // ---------- WTG (10) ----------
  {
    id: "wtg-01",
    ngo_id: "wtg",
    urgency: "red",
    category: "news",
    source: "World Animal Protection",
    source_language: "en",
    source_url: "https://www.worldanimalprotection.org/",
    published_at: d(-1, 10),
    original_title: "Investigation reveals scale of donkey hide trade in West Africa",
    original_text: "A new investigation documents the rapid growth of the donkey hide trade.",
    translated_title: "Investigation reveals scale of donkey hide trade in West Africa",
    summary:
      "A new investigation documents rapid growth of the donkey hide trade across West Africa. Several countries are considering export bans. Animal welfare organisations are calling for international action.",
    full_summary:
      "The investigation shows a rise in illegal slaughter and cross-border trade. The main buyer is the ejiao industry in China. Local donkey populations are collapsing, with knock-on effects on rural households. Several West African states are reviewing or have already enacted export bans. International animal welfare organisations are calling for coordinated action and consumer awareness work.",
    why_relevant:
      "Direct hit for WTG's donkey hide trade focus; relevant for advocacy and social media work.",
    next_steps: [
      "Review the report in the advocacy team",
      "Coordinate a social media post with the press office",
    ],
    topic_tags: ["International", "Social Media"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "wtg-02",
    ngo_id: "wtg",
    urgency: "red",
    category: "funding",
    source: "BMZ",
    source_language: "de",
    source_url: "https://www.bmz.de/",
    published_at: d(-2, 11),
    original_title: "BMZ-Förderung: Tierschutz in der Entwicklungszusammenarbeit",
    original_text: "Das BMZ schreibt erstmals eine eigene Förderlinie für Tierschutz aus.",
    translated_title: "BMZ funding: Animal welfare in development cooperation",
    summary:
      "BMZ is for the first time opening a dedicated funding line for animal welfare in development cooperation. Eligible projects are in partner countries, focused on livestock and working animals.",
    full_summary:
      "The funding line covers projects of 18–36 months with grants of EUR 100,000 to 500,000. Own contribution 15%. German organisations with documented project experience in animal welfare and development cooperation are eligible. Applications go through the BMZ portal. Evaluation considers impact logic, local anchoring, and contribution to the SDGs.",
    why_relevant:
      "First-ever BMZ call that exactly addresses WTG's core focus on animal welfare in developing countries.",
    next_steps: [
      "Prepare concept note for a project in a WTG partner country",
      "Clarify own contribution with management",
    ],
    topic_tags: ["International", "Agriculture"],
    funding_deadline: d(6),
    funding_amount_min: 100000,
    funding_amount_max: 500000,
    funding_funder: "BMZ",
    eligibility_verdict: "yes",
    eligibility_reason:
      "WTG has more than 20 years of project experience in animal welfare in developing countries and already operates in many German development cooperation partner countries.",
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "wtg-03",
    ngo_id: "wtg",
    urgency: "red",
    category: "report",
    source: "Deutscher Tierschutzbund",
    source_language: "de",
    source_url: "https://www.tierschutzbund.de/",
    published_at: d(-1, 13),
    original_title: "Recherche deckt illegalen Welpenhandel an deutscher Ostgrenze auf",
    original_text: "Eine gemeinsame Recherche dokumentiert systematischen Welpenhandel.",
    translated_title: "Investigation exposes illegal puppy trade at Germany's eastern border",
    summary:
      "A new investigation documents systematic puppy trafficking across Germany's eastern border. Hundreds of puppies are transported each month under conditions that violate animal welfare law.",
    full_summary:
      "The investigation reveals organised networks with sales platforms inside Germany. Animals are separated from their mothers too early, often sick, and without valid papers. Authorities in several federal states are announcing stricter controls. Animal welfare organisations are calling for tighter rules on online sales of animals.",
    why_relevant:
      "Core WTG topic on the puppy trade and German animal welfare; immediate media moment for press work.",
    next_steps: [
      "Draft press release referencing the investigation",
      "Amplify social media campaign on the puppy trade",
    ],
    topic_tags: ["Animal Welfare DE", "Social Media", "Other NGOs"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "wtg-04",
    ngo_id: "wtg",
    urgency: "yellow",
    category: "news",
    source: "Deutscher Tierschutzbund",
    source_language: "de",
    source_url: "https://www.tierschutzbund.de/",
    published_at: d(-3, 12),
    original_title: "Bundesregierung plant Novelle des Tierschutzgesetzes",
    original_text: "Die Bundesregierung kündigt eine Novelle des Tierschutzgesetzes an.",
    translated_title: "Federal government plans reform of the Animal Welfare Act",
    summary:
      "The federal government is announcing a reform of the Animal Welfare Act. The focus will be on the pet trade, livestock farming, and penalties.",
    full_summary:
      "The ministerial draft is expected in Q4. Associations will be invited to submit statements. Stricter rules are expected on online sales of animals and tougher requirements for livestock farming. The opposition is criticising the pace of the reform.",
    why_relevant:
      "Direct hit for WTG's focus on German animal welfare legislation; a statement is recommended.",
    next_steps: [
      "Prepare a position in the advocacy team",
      "Coordinate with coalition partners in the association network",
    ],
    topic_tags: ["Animal Welfare DE"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "wtg-05",
    ngo_id: "wtg",
    urgency: "yellow",
    category: "funding",
    source: "Engagement Global",
    source_language: "de",
    source_url: "https://www.engagement-global.de/",
    published_at: d(-4, 10),
    original_title: "bengo: Förderlinie für tierschutzbezogene EZ-Projekte",
    original_text: "Engagement Global hat eine Förderlinie für tierschutzbezogene Projekte veröffentlicht.",
    translated_title: "bengo: Funding line for animal-welfare projects in development cooperation",
    summary:
      "Engagement Global is opening a new funding line for animal-welfare-related development cooperation projects. Small and medium-sized German organisations are eligible.",
    full_summary:
      "The funding line specifically covers projects on livestock husbandry, animal health, and sustainable agriculture in partner countries. Grants up to EUR 200,000, with 25% own contribution. The application window runs for three months.",
    why_relevant:
      "Fits several ongoing WTG projects in the international livestock welfare programme.",
    next_steps: [
      "Align project idea with the International programme team",
      "Approach partners for local implementation",
    ],
    topic_tags: ["International", "Agriculture", "Funding"],
    funding_deadline: d(45),
    funding_amount_min: 50000,
    funding_amount_max: 200000,
    funding_funder: "Engagement Global (bengo)",
    eligibility_verdict: "yes",
    eligibility_reason:
      "WTG is eligible as a small German organisation with animal-welfare project experience in more than 20 countries.",
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "wtg-06",
    ngo_id: "wtg",
    urgency: "yellow",
    category: "news",
    source: "World Animal Protection",
    source_language: "en",
    source_url: "https://www.worldanimalprotection.org/",
    published_at: d(-2, 15),
    original_title: "EU consults on stricter rules for online pet sales",
    original_text: "The European Commission opens a public consultation.",
    translated_title: "EU consults on stricter rules for online pet sales",
    summary:
      "The European Commission has launched a public consultation on stricter rules for online sales of companion animals. Animal welfare organisations are explicitly invited to take part.",
    full_summary:
      "The consultation runs for eight weeks and covers identification requirements, seller verification, and sanctions. Outcomes are expected to feed into proposals for an EU-wide regulation. Animal welfare organisations see it as a key opportunity to curb the illegal puppy trade.",
    why_relevant:
      "Direct hook for WTG's work on the puppy trade and for social media mobilisation.",
    next_steps: [
      "Coordinate consultation response in the advocacy team",
      "Inform members about the consultation",
    ],
    topic_tags: ["International", "Animal Welfare DE", "Social Media"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "wtg-07",
    ngo_id: "wtg",
    urgency: "yellow",
    category: "report",
    source: "World Animal Protection",
    source_language: "en",
    source_url: "https://www.worldanimalprotection.org/",
    published_at: d(-3, 9),
    original_title: "Global review of working equine welfare 2026",
    original_text: "World Animal Protection publishes its global review of working equine welfare.",
    translated_title: "Global review of working equine welfare 2026",
    summary:
      "World Animal Protection has published a global review of the welfare of working horses and donkeys. The report analyses 15 countries.",
    full_summary:
      "The report shows significant regional differences in veterinary care and protection from overwork. It recommends local training programmes for owners and political measures against the donkey hide trade. NGOs are named as key implementation partners.",
    why_relevant:
      "Background study for WTG projects on working donkeys in several partner countries.",
    next_steps: ["Forward the study to the International programme team"],
    topic_tags: ["International", "Agriculture"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "wtg-08",
    ngo_id: "wtg",
    urgency: "green",
    category: "news",
    source: "Deutscher Tierschutzbund",
    source_language: "de",
    source_url: "https://www.tierschutzbund.de/",
    published_at: d(-5, 11),
    original_title: "Verbraucherumfrage zu Haltungskennzeichnung veröffentlicht",
    original_text: "Eine neue Verbraucherumfrage zeigt hohes Vertrauen in die Haltungskennzeichnung.",
    translated_title: "Consumer survey on animal husbandry labelling published",
    summary:
      "A new consumer survey shows rising trust in Germany's state animal husbandry labelling on animal products.",
    full_summary:
      "More than 60% of respondents pay attention to the husbandry label when shopping. Younger consumer groups are particularly aware. Associations see this as grounds for stronger consumer communication.",
    why_relevant:
      "Data basis for WTG's work on consumer and agriculture topics in Germany.",
    next_steps: [],
    topic_tags: ["Animal Welfare DE", "Agriculture"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
  {
    id: "wtg-09",
    ngo_id: "wtg",
    urgency: "green",
    category: "funding",
    source: "BMZ",
    source_language: "de",
    source_url: "https://www.bmz.de/",
    published_at: d(-6, 10),
    original_title: "BMZ: Vorinformation zur Förderung nachhaltiger Landwirtschaft",
    original_text: "Das BMZ informiert über eine kommende Förderlinie zur nachhaltigen Landwirtschaft.",
    translated_title: "BMZ: Heads-up on funding for sustainable agriculture",
    summary:
      "BMZ is announcing a funding line for sustainable agriculture with an animal welfare component. Concrete terms will follow in autumn.",
    full_summary:
      "The funding line will support projects that combine organic agriculture with better livestock husbandry. German organisations with partner structures in development cooperation countries will likely be eligible. Expected grants are EUR 200,000 to 600,000.",
    why_relevant:
      "Possible larger funding source for integrated WTG projects in agricultural regions.",
    next_steps: [],
    topic_tags: ["Funding", "Agriculture", "International"],
    funding_deadline: d(100),
    funding_amount_min: 200000,
    funding_amount_max: 600000,
    funding_funder: "BMZ",
    eligibility_verdict: "check",
    eligibility_reason:
      "WTG generally meets the criteria; concrete application terms will not be published until autumn.",
    confidence: "medium",
    model: MODEL,
    created_at: now,
  },
  {
    id: "wtg-10",
    ngo_id: "wtg",
    urgency: "green",
    category: "report",
    source: "Deutscher Tierschutzbund",
    source_language: "de",
    source_url: "https://www.tierschutzbund.de/",
    published_at: d(-4, 14),
    original_title: "Jahresbericht zur Lage des Tierschutzes in Deutschland 2026",
    original_text: "Der Deutsche Tierschutzbund veröffentlicht seinen Jahresbericht.",
    translated_title: "Annual report on the state of animal welfare in Germany 2026",
    summary:
      "The Deutscher Tierschutzbund has published its annual report. Focus areas are the pet trade, livestock farming, and laboratory animals.",
    full_summary:
      "The report documents progress in exposing the illegal puppy trade and persistent shortcomings in livestock farming and laboratory animal numbers. It recommends legislative reforms and stronger inspections. Associations are called on to do joint lobbying work.",
    why_relevant:
      "Cross-cutting reference text for WTG position papers and communication on the state of animal welfare in Germany.",
    next_steps: [],
    topic_tags: ["Animal Welfare DE", "Other NGOs"],
    funding_deadline: null,
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: null,
    eligibility_verdict: null,
    eligibility_reason: null,
    confidence: "high",
    model: MODEL,
    created_at: now,
  },
];
