export type FundingSourceType = "curated" | "bmz-rss" | "eu-bulk";
export type FundingEligibility = "yes" | "check" | "no";
export type FundingPriority = "red" | "amber" | "green";

export type CuratedFundingSeed = {
  orgSlug: "burundi-kids" | "wtg";
  externalId: string;
  sourceType: FundingSourceType;
  sourceUrl: string;
  funder: string;
  title: string;
  titleOriginal: string;
  language: "de" | "en" | "fr";
  publishedDate: string | null;
  deadline: string | null;
  amountMin: number | null;
  amountMax: number | null;
  amountCurrency: string | null;
  topics: string[];
  funders: string[];
  eligibility: FundingEligibility;
  eligibilityReason: string;
  matchScore: number;
  priority: FundingPriority;
  summaryDe: string;
  rawText: string;
  ownContributionRequired: boolean | null;
  nrwRequired: boolean | null;
  appliesFromBurundiOk: boolean | null;
};

export const FUNDING_SOURCE_URLS = {
  euBulkJson:
    "https://ec.europa.eu/info/funding-tenders/opportunities/data/referenceData/grantsTenders.json",
  bmzRss: "https://www.bmz.de/de/feed.rss",
  foerderdatenbank: "https://www.foerderdatenbank.de/FDB/DE/Home/home.html",
  bengo: "https://bengo.engagement-global.de/",
  sezProjectFunding: "https://sez.de/themen/projektfoerderung/",
  brotFuerDieWelt: "https://www.brot-fuer-die-welt.de/",
  misereor: "https://www.misereor.de/",
  hausDesStiftens: "https://www.foerderprogramme.org/",
  deutscherEngagementpreis: "https://www.deutscher-engagementpreis.de/",
  euBurundiDelegation: "https://www.eeas.europa.eu/delegations/burundi",
} as const;

export const CURATED_FUNDING_SEEDS: CuratedFundingSeed[] = [
  {
    orgSlug: "burundi-kids",
    externalId: "curated:europeaid-185435-dd-act-bi",
    sourceType: "curated",
    sourceUrl: FUNDING_SOURCE_URLS.euBurundiDelegation,
    funder: "EU Delegation to Burundi",
    title: "Renforcement des organisations de la société civile au Burundi",
    titleOriginal: "Renforcement des organisations de la société civile au Burundi",
    language: "fr",
    publishedDate: "2025-12-12",
    deadline: "2026-03-24",
    amountMin: 1_000_000,
    amountMax: 1_500_000,
    amountCurrency: "EUR",
    topics: ["civil society", "burundi", "local partner", "governance"],
    funders: ["European Union", "EU Delegation to Burundi"],
    eligibility: "check",
    eligibilityReason:
      "Grundsätzlich passend durch den lokalen Partner Fondation Stamm, aber zweistufiges EU-Verfahren, PADOR/Registrierung und sehr große Mindestfördersumme müssen geprüft werden.",
    matchScore: 72,
    priority: "amber",
    summaryDe:
      "Die EU-Delegation in Burundi fördert die Stärkung zivilgesellschaftlicher Organisationen. Der Aufruf ist für Burundi fachlich sehr relevant, verlangt aber ein formal starkes Antragsverfahren und lokale Partnerschaften. Für Burundi Kids ist dies eher eine Konsortiums- oder Partnerchance als ein einfacher Direktantrag.",
    rawText:
      "EU Delegation to Burundi call EuropeAid/185435/DD/ACT/BI: Renforcement des organisations de la société civile au Burundi. Appel à propositions restreint, publié le 12 décembre 2025, date limite 24/03/2026 à 12.00 heure de Bruxelles. Documents in French. Grants reported around EUR 1,000,000 to EUR 1,500,000 and projects 36-48 months. Requires an INGO in partnership with at least one Burundian CSO.",
    ownContributionRequired: null,
    nrwRequired: false,
    appliesFromBurundiOk: true,
  },
  {
    orgSlug: "burundi-kids",
    externalId: "curated:bengo-private-traeger-burundi",
    sourceType: "curated",
    sourceUrl: FUNDING_SOURCE_URLS.bengo,
    funder: "Engagement Global bengo",
    title: "BMZ-Förderung für private Träger in der Entwicklungszusammenarbeit",
    titleOriginal: "Förderung privater Träger in der Entwicklungszusammenarbeit",
    language: "de",
    publishedDate: null,
    deadline: "2026-09-30",
    amountMin: 50_000,
    amountMax: 250_000,
    amountCurrency: "EUR",
    topics: ["education", "development cooperation", "burundi", "local partner"],
    funders: ["BMZ", "Engagement Global", "bengo"],
    eligibility: "yes",
    eligibilityReason:
      "Burundi Kids ist ein deutscher gemeinnütziger Verein mit langjährigem lokalen Partner in Burundi; Eigenanteil und aktuelle Trägeranforderungen müssen im Antrag eingeplant werden.",
    matchScore: 90,
    priority: "amber",
    summaryDe:
      "bengo unterstützt deutsche gemeinnützige Träger bei entwicklungspolitischen Projekten mit Partnerorganisationen im Globalen Süden. Für Burundi Kids passt dies gut zu Bildungs-, Schutz- und Gesundheitsprojekten in Burundi. Wichtig sind eine solide Wirkungslogik, Eigenanteil und die Abstimmung mit Fondation Stamm.",
    rawText:
      "Engagement Global bengo / BMZ private Träger: German non-profit organizations can apply for development cooperation project funding with partner organizations in the Global South. Typical requirements include charitable status, local partner, own contribution and project experience. Burundi Kids works in Burundi via Fondation Stamm and has education, vocational training, child protection, health and girls' rights themes.",
    ownContributionRequired: true,
    nrwRequired: false,
    appliesFromBurundiOk: false,
  },
  {
    orgSlug: "burundi-kids",
    externalId: "curated:sez-bwirkt-burundi",
    sourceType: "curated",
    sourceUrl: FUNDING_SOURCE_URLS.sezProjectFunding,
    funder: "SEZ Baden-Württemberg",
    title: "bwirkt! Burundi Projektförderung",
    titleOriginal: "bwirkt! Burundi Projektförderung",
    language: "de",
    publishedDate: null,
    deadline: "2026-07-20",
    amountMin: 5_000,
    amountMax: 20_000,
    amountCurrency: "EUR",
    topics: ["burundi", "education", "partnership", "small grants"],
    funders: ["SEZ Baden-Württemberg"],
    eligibility: "check",
    eligibilityReason:
      "Inhaltlich sehr passend für Burundi-Projekte; zu prüfen ist, ob Burundi Kids selbst oder ein Partner die formalen Baden-Württemberg-Anforderungen erfüllt.",
    matchScore: 78,
    priority: "amber",
    summaryDe:
      "Die SEZ Baden-Württemberg bündelt Projektförderung für entwicklungspolitische Partnerschaften, darunter Burundi-Bezüge. Für Burundi Kids ist dies als kleine bis mittlere Projektförderung interessant. Formale Landes- und Partnerschaftsanforderungen sollten vorab geprüft werden.",
    rawText:
      "SEZ Baden-Württemberg project funding page covering development project funding and Burundi-related support lines including bwirkt! Burundi. Relevant for small project funding, partnerships and civil society initiatives. Check Baden-Württemberg eligibility and partner requirements.",
    ownContributionRequired: null,
    nrwRequired: false,
    appliesFromBurundiOk: true,
  },
  {
    orgSlug: "burundi-kids",
    externalId: "curated:brot-fuer-die-welt-partner-funding",
    sourceType: "curated",
    sourceUrl: FUNDING_SOURCE_URLS.brotFuerDieWelt,
    funder: "Brot für die Welt",
    title: "Partnerorientierte Projektförderung Bildung und Kinderrechte",
    titleOriginal: "Partnerorientierte Projektförderung Bildung und Kinderrechte",
    language: "de",
    publishedDate: null,
    deadline: null,
    amountMin: null,
    amountMax: null,
    amountCurrency: "EUR",
    topics: ["education", "children", "partner funding", "civil society"],
    funders: ["Brot für die Welt"],
    eligibility: "check",
    eligibilityReason:
      "Themen passen gut, aber Brot für die Welt arbeitet stark partner- und beziehungsbasiert; ein konkreter offener Call oder Zugangskanal muss geprüft werden.",
    matchScore: 66,
    priority: "green",
    summaryDe:
      "Brot für die Welt ist thematisch relevant für Bildung, Kinderrechte und zivilgesellschaftliche Arbeit. Für Burundi Kids kann dies als Beobachtungsquelle und möglicher Partnerkontakt sinnvoll sein. Ohne konkreten offenen Aufruf bleibt es eine Monitoring-Chance.",
    rawText:
      "Brot für die Welt works internationally on development cooperation, education, children's rights, civil society and justice themes. Public calls for proposals are not consistently exposed as RSS/API; treat as curated monitoring source and relationship-based funding lead.",
    ownContributionRequired: null,
    nrwRequired: false,
    appliesFromBurundiOk: null,
  },
  {
    orgSlug: "burundi-kids",
    externalId: "curated:misereor-education-empowerment",
    sourceType: "curated",
    sourceUrl: FUNDING_SOURCE_URLS.misereor,
    funder: "Misereor",
    title: "Projektförderung für Bildung, Gesundheit und Empowerment",
    titleOriginal: "Projektförderung für Bildung, Gesundheit und Empowerment",
    language: "de",
    publishedDate: null,
    deadline: null,
    amountMin: null,
    amountMax: null,
    amountCurrency: "EUR",
    topics: ["education", "health", "empowerment", "africa"],
    funders: ["Misereor"],
    eligibility: "check",
    eligibilityReason:
      "Themen und Region können passen, aber konkrete Förderfenster, konfessionelle/partnerbezogene Anforderungen und Antragstellerkreis müssen geprüft werden.",
    matchScore: 64,
    priority: "green",
    summaryDe:
      "Misereor ist eine relevante Quelle für internationale Projektförderung in Bereichen wie Bildung, Gesundheit und Empowerment. Für Burundi Kids ist dies vor allem ein Monitoring- und Kontaktkanal. Eine konkrete Bewerbung hängt von aktuellen Programmen und Partneranforderungen ab.",
    rawText:
      "Misereor supports international development cooperation with themes including education, health, empowerment and civil society. No stable calls-for-proposals API or RSS for open NGO grant windows was identified; keep as curated source for monitoring.",
    ownContributionRequired: null,
    nrwRequired: false,
    appliesFromBurundiOk: null,
  },
  {
    orgSlug: "burundi-kids",
    externalId: "curated:deutscher-engagementpreis",
    sourceType: "curated",
    sourceUrl: FUNDING_SOURCE_URLS.deutscherEngagementpreis,
    funder: "Deutscher Engagementpreis",
    title: "Deutscher Engagementpreis",
    titleOriginal: "Deutscher Engagementpreis",
    language: "de",
    publishedDate: null,
    deadline: "2026-06-30",
    amountMin: null,
    amountMax: null,
    amountCurrency: "EUR",
    topics: ["award", "recognition", "nomination"],
    funders: ["Deutscher Engagementpreis"],
    eligibility: "no",
    eligibilityReason:
      "Keine reguläre Projektförderung und keine freie Eigenbewerbung; relevant höchstens als Öffentlichkeits- oder Nominierungschance.",
    matchScore: 12,
    priority: "green",
    summaryDe:
      "Der Deutsche Engagementpreis ist ein Anerkennungspreis und keine klassische Projektförderung. Für Burundi Kids ist er für Fundraising-Fristen weniger relevant. Eine Teilnahme setzt üblicherweise eine Nominierung voraus.",
    rawText:
      "Deutscher Engagementpreis is an award/recognition programme. It is nomination-based and not a normal open project funding call. No self-application for standard project grants.",
    ownContributionRequired: false,
    nrwRequired: false,
    appliesFromBurundiOk: false,
  },
  {
    orgSlug: "wtg",
    externalId: "curated:eu-life-animal-welfare",
    sourceType: "curated",
    sourceUrl: FUNDING_SOURCE_URLS.euBulkJson,
    funder: "EU LIFE Programme",
    title: "Animal Welfare and Sustainable Agriculture",
    titleOriginal: "Animal Welfare and Sustainable Agriculture",
    language: "en",
    publishedDate: null,
    deadline: "2026-09-12",
    amountMin: 200_000,
    amountMax: 600_000,
    amountCurrency: "EUR",
    topics: ["animal welfare", "agriculture", "policy", "consortium"],
    funders: ["European Union", "LIFE Programme"],
    eligibility: "check",
    eligibilityReason:
      "Inhaltlich relevant für WTG, aber LIFE-Projekte sind groß, konsortial und formal aufwendig; Partnerstruktur und Eigenmittel prüfen.",
    matchScore: 78,
    priority: "amber",
    summaryDe:
      "Ein EU-LIFE-Förderfenster kann für Tierschutz in Landwirtschaft und Politikpiloten relevant sein. Für WTG wäre dies eher ein Konsortiumsprojekt mit langer Vorbereitung. Budget- und Partneranforderungen müssen geprüft werden.",
    rawText:
      "EU LIFE Programme funding related to animal welfare and sustainable agriculture. Large grants, policy pilots and consortium projects. Relevant to WTG animal welfare work but requires formal EU application capacity.",
    ownContributionRequired: true,
    nrwRequired: false,
    appliesFromBurundiOk: false,
  },
  {
    orgSlug: "wtg",
    externalId: "curated:stray-animal-cofunding",
    sourceType: "curated",
    sourceUrl: "https://www.vier-pfoten.org/",
    funder: "Vier Pfoten Foundation",
    title: "Stray Animal Welfare Co-funding",
    titleOriginal: "Stray Animal Welfare Co-funding",
    language: "en",
    publishedDate: null,
    deadline: "2026-07-18",
    amountMin: 30_000,
    amountMax: 90_000,
    amountCurrency: "EUR",
    topics: ["stray animals", "spay neuter", "shelter capacity"],
    funders: ["Vier Pfoten Foundation"],
    eligibility: "yes",
    eligibilityReason:
      "Direkter Themenfit für WTG-Programme zu Streunertieren; konkrete Ausschreibungsbedingungen und Kofinanzierung prüfen.",
    matchScore: 90,
    priority: "amber",
    summaryDe:
      "Die Förderung passt zu Streunertierarbeit, Kastrationsprogrammen und Shelter-Kapazität. WTG hat hierfür einen starken fachlichen Fit. Die formalen Förderbedingungen müssen vor Antragstellung geprüft werden.",
    rawText:
      "Co-funding for spay/neuter programs, shelter capacity and responsible ownership in developing countries. Relevant to WTG flagship stray dog work.",
    ownContributionRequired: null,
    nrwRequired: false,
    appliesFromBurundiOk: false,
  },
];
