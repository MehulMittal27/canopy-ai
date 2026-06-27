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

// Helper: produce ISO date offset by N days from today (2026-06-27).
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
      "Des tirs ont été entendus dans la nuit près de la frontière entre la province de Cibitoke et le Sud-Kivu. Les autorités locales appellent à la prudence.",
    translated_title: "Zusammenstöße an der burundisch-kongolesischen Grenze gemeldet",
    summary:
      "In der Nacht wurden Schüsse nahe der Grenze zwischen der Provinz Cibitoke und Süd-Kivu gemeldet. Lokale Behörden rufen zur Vorsicht auf. Reisebewegungen über die Grenze sind eingeschränkt.",
    full_summary:
      "Bewohner der Grenzregion zwischen Cibitoke und Süd-Kivu berichten von nächtlichen Schüssen entlang der burundisch-kongolesischen Grenze. Die burundische Armee hat zusätzliche Einheiten in die Region verlegt. Mehrere Familien sind in benachbarte Dörfer geflohen. Die Behörden raten von nicht notwendigen Fahrten in die Grenzregion ab. Hilfsorganisationen vor Ort beobachten die Lage. Bisher gibt es keine Berichte über zivile Opfer. Die Lage bleibt angespannt.",
    why_relevant:
      "Betrifft direkt die Sicherheit der Mitarbeitenden und Partnerschulen in Gateri sowie Reisewege zwischen Bujumbura und Gitega.",
    next_steps: [
      "Sicherheitslage mit Partnern in Cibitoke abklären",
      "Reisen in Grenznähe diese Woche aussetzen",
      "Notfallkontakte in Gateri aktivieren",
    ],
    topic_tags: ["Sicherheit", "Humanitäre Hilfe"],
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
      "Das BMZ ruft kleine und mittlere Trägerorganisationen zur Einreichung von Projektskizzen auf. Schwerpunkt: Bildungszugang für Mädchen.",
    translated_title: "BMZ-Förderaufruf: Bildung und Gleichstellung in Subsahara-Afrika",
    summary:
      "Das BMZ schreibt Mittel für Projekte zu Mädchenbildung und Gleichstellung in Subsahara-Afrika aus. Kleine deutsche Trägerorganisationen sind ausdrücklich angesprochen. Einreichung über das BMZ-Portal.",
    full_summary:
      "Das BMZ öffnet einen neuen Förderaufruf für Projekte zur Stärkung des Bildungszugangs für Mädchen in Subsahara-Afrika. Förderfähig sind Projekte mit Laufzeit 24–36 Monate, Eigenanteil 10 Prozent. Antragsberechtigt sind in Deutschland eingetragene gemeinnützige Träger mit nachweisbarer Projekterfahrung in der Region. Die Skizze soll maximal acht Seiten umfassen und das Wirkungsmodell beschreiben. Bewertet wird unter anderem nach Wirkungslogik, Nachhaltigkeit und lokaler Verankerung.",
    next_steps: [
      "Skizze für Mädchenbildungs-Projekt in Gitega vorbereiten",
      "Eigenanteil mit Vorstand abklären",
      "Lokale Partner für Letter of Support kontaktieren",
    ],
    topic_tags: ["Förderung", "Bildung", "GBV"],
    funding_deadline: d(5),
    funding_amount_min: 150000,
    funding_amount_max: 400000,
    funding_funder: "BMZ",
    eligibility_verdict: "yes",
    eligibility_reason:
      "Burundi Kids ist in NRW als gemeinnützig eingetragen, hat langjährige Projekterfahrung in Burundi und arbeitet bereits zu Mädchenbildung in Gitega.",
    confidence: "high",
    model: MODEL,
    created_at: now,
    why_relevant:
      "Direkter Treffer für laufende Arbeit zu Mädchenbildung in Gitega und für GBV-Prävention an Partnerschulen.",
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
      "Heavy rains over the past week have caused flooding in several neighborhoods of Bujumbura. More than 600 people are reported displaced.",
    translated_title: "Burundi: Starkregen vertreibt Hunderte in Bujumbura",
    summary:
      "Anhaltender Starkregen hat in mehreren Vierteln Bujumburas zu Überschwemmungen geführt. Mehr als 600 Personen sind vertrieben. Lokale Behörden errichten Notunterkünfte.",
    full_summary:
      "Tagelanger Starkregen hat in den Vierteln Buterere und Kinama zu Überschwemmungen geführt. Häuser sind eingestürzt, Brunnen kontaminiert. Über 600 Personen, darunter viele Kinder, wurden vertrieben. Die kommunalen Behörden in Zusammenarbeit mit OCHA und Caritas errichten temporäre Notunterkünfte. Es besteht erhöhte Cholera-Gefahr. Schulen in den betroffenen Vierteln bleiben geschlossen.",
    why_relevant:
      "Buterere liegt nahe dem Einzugsgebiet einer Partnerschule; betroffene Kinder benötigen kurzfristig Schulmaterial und Unterstützung.",
    next_steps: [
      "Schulleitung in Buterere kontaktieren",
      "Soforthilfe-Budget für Schulmaterial prüfen",
    ],
    topic_tags: ["Humanitäre Hilfe", "Bildung", "Gesundheit"],
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
      "Le ministère de l'Éducation a présenté une nouvelle stratégie quinquennale visant à réduire l'abandon scolaire chez les filles.",
    translated_title: "Burundi: Neue nationale Strategie für Mädchenbildung",
    summary:
      "Das burundische Bildungsministerium hat eine Fünfjahresstrategie zur Reduzierung der Schulabbruchquote bei Mädchen vorgestellt. Schwerpunkt liegt auf ländlichen Provinzen. NGOs werden ausdrücklich zur Mitarbeit eingeladen.",
    full_summary:
      "Die Strategie sieht Stipendien, Schulmahlzeiten und WASH-Infrastruktur an Mädchenschulen vor. Provinzen mit hoher Abbruchquote — darunter Gitega und Cibitoke — werden priorisiert. Das Ministerium plant Konsultationen mit zivilgesellschaftlichen Akteuren in den kommenden Monaten. Erste Pilotprogramme starten 2027.",
    why_relevant:
      "Strategie deckt sich mit dem laufenden Bildungsprogramm in Gitega; Anschluss an Konsultationsprozess möglich.",
    next_steps: [
      "Konsultationstermin in Gitega anfragen",
      "Strategiepapier mit Programmteam teilen",
    ],
    topic_tags: ["Bildung", "GBV"],
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
    original_text:
      "Engagement Global ruft kleine Trägerorganisationen zur Antragstellung für Projekte mit Partnern in Subsahara-Afrika auf.",
    translated_title: "bengo: Förderung kleiner privater Träger in der EZ",
    summary:
      "Engagement Global (bengo) öffnet die nächste Antragsrunde für kleine private Träger. Förderfähig sind Projekte in Partnerländern der deutschen EZ, einschließlich Burundi.",
    full_summary:
      "Die bengo-Förderung richtet sich an kleine deutsche NGOs mit Partnerorganisationen im Globalen Süden. Förderhöhe bis 250.000 EUR pro Projekt. Eigenanteil mindestens 25 Prozent, davon ein Teil durch Spenden nachweisbar. Antragstellung läuft fortlaufend; die nächste Auswahlrunde schließt im September.",
    why_relevant:
      "Burundi Kids erfüllt die Kriterien für kleine Träger und hat etablierte Partner in Gitega und Gateri.",
    next_steps: [
      "Eigenanteilsquelle prüfen",
      "Konzeptpapier mit Partner in Gateri abstimmen",
    ],
    topic_tags: ["Förderung", "Bildung"],
    funding_deadline: d(60),
    funding_amount_min: 50000,
    funding_amount_max: 250000,
    funding_funder: "Engagement Global (bengo)",
    eligibility_verdict: "yes",
    eligibility_reason:
      "Burundi Kids ist ein kleiner gemeinnütziger Träger in Deutschland mit langjähriger Partnerstruktur in Burundi.",
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
    original_text:
      "Une initiative régionale de lutte contre les violences basées sur le genre a été lancée à Bujumbura.",
    translated_title: "Große Seen: Neue regionale Initiative gegen GBV",
    summary:
      "In Bujumbura wurde eine regionale Initiative zur Bekämpfung geschlechtsspezifischer Gewalt gestartet. Beteiligt sind Burundi, Ruanda, Uganda und die DRC.",
    full_summary:
      "Die Initiative wird von der Ostafrikanischen Gemeinschaft koordiniert und soll grenzüberschreitende Schutzmechanismen für Überlebende sexualisierter Gewalt schaffen. Lokale NGOs sind als Umsetzungspartner vorgesehen. Erste Pilotprojekte starten in Bujumbura und Bukavu.",
    why_relevant:
      "Direkter Anknüpfungspunkt für das GBV-Präventionsprogramm und Partnerarbeit in der Region der Großen Seen.",
    next_steps: ["Initiative mit GBV-Referentin im Programmteam besprechen"],
    topic_tags: ["GBV", "Humanitäre Hilfe"],
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
    original_text:
      "UNICEF reports rising school dropout rates among girls aged 12–16 in rural Burundi.",
    translated_title: "UNICEF: Kinderschutz-Lagebericht Burundi Q2 2026",
    summary:
      "UNICEF berichtet von steigenden Schulabbruchquoten bei Mädchen zwischen 12 und 16 Jahren im ländlichen Burundi. Frühe Heirat und Armut werden als Hauptursachen genannt.",
    full_summary:
      "Der Quartalsbericht zeigt eine Zunahme der Schulabbruchquote bei Mädchen in Cibitoke und Ruyigi um 8 Prozent gegenüber dem Vorquartal. Frühe Heirat, ungeplante Schwangerschaften und wirtschaftlicher Druck auf Familien sind die zentralen Faktoren. UNICEF empfiehlt verstärkte Aufklärung und konditionale Bargeldtransfers an betroffene Haushalte.",
    why_relevant:
      "Datenbasis zur Argumentation in Förderanträgen für Mädchenbildung in Gitega und Cibitoke.",
    next_steps: ["Datenpunkte für BMZ-Antrag übernehmen"],
    topic_tags: ["Bildung", "GBV", "Gesundheit"],
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
    original_text:
      "Plusieurs centres de santé de Bujumbura signalent une pénurie de médicaments essentiels depuis deux semaines.",
    translated_title: "Bujumbura: Medikamentenengpässe in mehreren Gesundheitszentren",
    summary:
      "Seit zwei Wochen melden mehrere Gesundheitszentren in Bujumbura einen Mangel an Basismedikamenten. Besonders betroffen sind Antibiotika und Malariamedikamente.",
    full_summary:
      "Lokale Apotheken können den Bedarf nicht decken; das Gesundheitsministerium verweist auf Lieferprobleme. NGOs befürchten Auswirkungen auf Kinder und Schwangere. Erste Spendenaktionen lokaler Diasporagruppen laufen an.",
    why_relevant:
      "Betrifft die Gesundheitsversorgung in der Nähe der Partnerschule in Bujumbura; Schüler:innen mit chronischen Erkrankungen besonders gefährdet.",
    next_steps: ["Lagebericht mit Gesundheitspartner in Bujumbura einholen"],
    topic_tags: ["Gesundheit", "Humanitäre Hilfe"],
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
    original_text:
      "Misereor informiert über die kommende Themenförderung Bildung und Empowerment in Afrika.",
    translated_title: "Misereor: Themenförderung Bildung und Empowerment",
    summary:
      "Misereor kündigt eine Themenförderung zu Bildung und Empowerment in Afrika an. Antragsfenster öffnet im Herbst.",
    full_summary:
      "Misereor plant für das vierte Quartal eine offene Ausschreibung im Bereich Bildung und Empowerment. Förderfähig sind langfristige Partnerprojekte. Konkrete Antragsmodalitäten werden im September veröffentlicht. Eigenanteil voraussichtlich 25 Prozent.",
    why_relevant:
      "Vorlauf zur strategischen Planung eines Folgeantrags zum laufenden Bildungsprojekt in Gitega.",
    next_steps: ["Programmteam für Q4-Planung informieren"],
    topic_tags: ["Förderung", "Bildung"],
    funding_deadline: d(120),
    funding_amount_min: 100000,
    funding_amount_max: 300000,
    funding_funder: "Misereor",
    eligibility_verdict: "check",
    eligibility_reason:
      "Burundi Kids erfüllt grundsätzlich die Kriterien; Detail-Modalitäten werden erst im September veröffentlicht.",
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
    original_text:
      "Une bibliothèque scolaire financée par une ONG locale a été inaugurée à Gitega.",
    translated_title: "Gitega: Neue Schulbibliothek eingeweiht",
    summary:
      "In Gitega wurde eine neue Schulbibliothek eingeweiht. Das Projekt wurde von einer lokalen NGO finanziert und ist für 400 Schüler:innen ausgelegt.",
    full_summary:
      "Die Bibliothek umfasst 1.200 Bücher in Französisch und Kirundi und ist Teil eines größeren Bildungsprojekts. Eröffnung erfolgte im Beisein lokaler Behörden. Weitere Bibliotheken in den umliegenden Gemeinden sind geplant.",
    why_relevant:
      "Mögliche Kooperationspartner für Lesepatenschaften in Gitega; ergänzt eigene Bildungsarbeit.",
    next_steps: [],
    topic_tags: ["Bildung"],
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
    original_text:
      "Der Dachverband VENRO veröffentlicht seinen Jahresbericht zur Lage kleiner Träger in der deutschen EZ.",
    translated_title: "VENRO-Bericht: Lage kleiner Träger in der EZ 2026",
    summary:
      "Der VENRO-Bericht beleuchtet Finanzierungslage, Personalentwicklung und politische Rahmenbedingungen für kleine deutsche NGOs in der Entwicklungszusammenarbeit.",
    full_summary:
      "Der Bericht zeigt eine zunehmende Konkurrenz um BMZ-Mittel und steigende Anforderungen an Wirkungsmessung. Kleine Träger verzeichnen Rückgänge bei privaten Spenden. VENRO empfiehlt verstärkte Kooperationen und gemeinsame Fundraising-Strategien.",
    why_relevant:
      "Hintergrundwissen für Vorstandssitzung und Strategieplanung kleiner NRW-Träger wie Burundi Kids.",
    next_steps: [],
    topic_tags: ["Förderung"],
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
    original_text:
      "Le ministère de la Santé rapporte une amélioration significative de la couverture vaccinale chez les enfants de moins de cinq ans.",
    translated_title: "Burundi: Bessere Impfversorgung bei Kleinkindern",
    summary:
      "Das Gesundheitsministerium meldet deutliche Fortschritte bei der Impfquote für Kinder unter fünf Jahren. Mehrere Provinzen erreichen erstmals die WHO-Zielwerte.",
    full_summary:
      "Landesweit liegt die Impfrate bei den Standardimpfungen jetzt bei 87 Prozent. In ländlichen Regionen wie Cibitoke gab es die größten Fortschritte. Internationale Geber, darunter Gavi, haben die Logistik mitfinanziert.",
    why_relevant:
      "Positiver Kontext für die Gesundheitskomponente eigener Schulprogramme; nutzbar in Berichten an Geber.",
    next_steps: [],
    topic_tags: ["Gesundheit"],
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
    original_text:
      "Brot für die Welt informiert über eine kommende Projektförderung zu Bildungsgerechtigkeit in Subsahara-Afrika.",
    translated_title: "Brot für die Welt: Vorinformation neue Projektförderung",
    summary:
      "Brot für die Welt plant eine Projektförderung zu Bildungsgerechtigkeit in Subsahara-Afrika. Details und Antragsfenster werden im Herbst veröffentlicht.",
    full_summary:
      "Die geplante Förderlinie konzentriert sich auf Mädchenbildung und inklusive Schulbildung. Konkrete Höhen und Eigenanteile stehen noch nicht fest. Empfohlen wird die Aufnahme in den Verteiler.",
    why_relevant:
      "Mögliche Co-Finanzierungsquelle neben BMZ für laufende Bildungsarbeit in Gitega.",
    next_steps: ["Verteiler-Eintrag prüfen"],
    topic_tags: ["Förderung", "Bildung"],
    funding_deadline: d(150),
    funding_amount_min: null,
    funding_amount_max: null,
    funding_funder: "Brot für die Welt",
    eligibility_verdict: "check",
    eligibility_reason:
      "Burundi Kids ist als kleiner Träger grundsätzlich antragsberechtigt; konkrete Kriterien stehen aus.",
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
    original_text:
      "OCHA's monthly humanitarian overview for the Great Lakes Region highlights protracted displacement and food insecurity.",
    translated_title: "OCHA: Humanitäre Lage Große Seen Juni 2026",
    summary:
      "Der Monatsbericht von OCHA zeigt anhaltende Vertreibung und Ernährungsunsicherheit in der Region der Großen Seen. Burundi nimmt weiterhin Geflüchtete aus der DRC auf.",
    full_summary:
      "Über 90.000 kongolesische Geflüchtete leben aktuell in burundischen Aufnahmeeinrichtungen, davon ein erheblicher Teil Kinder und Jugendliche. Bildung und psychosoziale Betreuung sind unterfinanziert. OCHA fordert verstärktes Engagement internationaler Geber.",
    why_relevant:
      "Bietet Kontext und Zahlen für Burundi-Kids-Arbeit mit geflüchteten Kindern an der Grenze zur DRC.",
    next_steps: [],
    topic_tags: ["Humanitäre Hilfe", "Bildung"],
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
    original_text:
      "Une ONG locale lance un programme de formation professionnelle destiné aux jeunes filles de Bujumbura.",
    translated_title: "Bujumbura: Neue Berufsausbildung für junge Frauen",
    summary:
      "Eine lokale NGO startet ein Berufsbildungsprogramm für junge Frauen in Bujumbura. Schwerpunkte sind Schneiderei und digitale Grundkenntnisse.",
    full_summary:
      "Das Programm richtet sich an Schulabbrecherinnen und bietet einen sechsmonatigen Ausbildungszyklus mit anschließender Vermittlung in lokale Betriebe. Erste Kohorte umfasst 40 Teilnehmerinnen.",
    why_relevant:
      "Möglicher lokaler Partner für die geplante Berufsausbildungs-Komponente in Gateri.",
    next_steps: ["Kontakt zur lokalen NGO suchen"],
    topic_tags: ["Bildung", "GBV"],
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
    original_text:
      "A new investigation documents the rapid growth of the donkey hide trade across several West African countries.",
    translated_title: "Untersuchung enthüllt Ausmaß des Eselshäute-Handels in Westafrika",
    summary:
      "Eine neue Untersuchung dokumentiert das rasche Wachstum des Eselshäute-Handels in Westafrika. Mehrere Länder erwägen Exportverbote. Tierschutzorganisationen fordern internationales Handeln.",
    full_summary:
      "Die Untersuchung zeigt eine Zunahme illegaler Schlachtungen und grenzüberschreitenden Handels. Hauptabnehmer ist die Produktion von Ejiao in China. Lokale Eselpopulationen brechen ein, mit Folgen für ländliche Haushalte. Mehrere westafrikanische Staaten prüfen derzeit Exportverbote oder haben sie bereits erlassen. Internationale Tierschutzorganisationen fordern koordinierte Maßnahmen und Konsumentenaufklärung.",
    why_relevant:
      "Direkter Treffer für WTG-Schwerpunkt Eselshäute-Handel; relevant für Advocacy- und Social-Media-Arbeit.",
    next_steps: [
      "Bericht im Advocacy-Team auswerten",
      "Social-Media-Beitrag mit Pressestelle abstimmen",
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
    original_text:
      "Das BMZ schreibt erstmals eine eigene Förderlinie für Tierschutz in der Entwicklungszusammenarbeit aus.",
    translated_title: "BMZ-Förderung: Tierschutz in der Entwicklungszusammenarbeit",
    summary:
      "Das BMZ schreibt erstmals eine Förderlinie für Tierschutz in der EZ aus. Förderfähig sind Projekte in Partnerländern mit Fokus auf Nutztiere und Arbeitstiere.",
    full_summary:
      "Die Förderlinie umfasst Projekte mit Laufzeit 18–36 Monate und Fördersummen zwischen 100.000 und 500.000 EUR. Eigenanteil 15 Prozent. Antragsberechtigt sind deutsche Träger mit nachweisbarer Projekterfahrung im Bereich Tierschutz und EZ. Anträge sind über das BMZ-Portal einzureichen. Bewertet wird unter anderem nach Wirkungslogik, lokaler Verankerung und Beitrag zu den SDGs.",
    why_relevant:
      "Erstmaliger BMZ-Aufruf, der exakt den WTG-Kernschwerpunkt Tierschutz in Entwicklungsländern adressiert.",
    next_steps: [
      "Skizze für Projekt in einem WTG-Partnerland vorbereiten",
      "Eigenanteil mit Geschäftsführung klären",
    ],
    topic_tags: ["International", "Landwirtschaft"],
    funding_deadline: d(6),
    funding_amount_min: 100000,
    funding_amount_max: 500000,
    funding_funder: "BMZ",
    eligibility_verdict: "yes",
    eligibility_reason:
      "WTG hat über 20 Jahre Projekterfahrung in Tierschutz in Entwicklungsländern und arbeitet bereits in zahlreichen Partnerländern der deutschen EZ.",
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
    original_text:
      "Eine gemeinsame Recherche dokumentiert systematischen Welpenhandel über die deutsche Ostgrenze.",
    translated_title: "Recherche deckt illegalen Welpenhandel an deutscher Ostgrenze auf",
    summary:
      "Eine neue Recherche dokumentiert systematischen Welpenhandel über die deutsche Ostgrenze. Hunderte Welpen werden monatlich unter tierschutzwidrigen Bedingungen transportiert.",
    full_summary:
      "Die Recherche zeigt organisierte Strukturen mit Verkaufsplattformen in Deutschland. Tiere werden zu früh von Müttern getrennt, oft krank und ohne gültige Papiere. Behörden in mehreren Bundesländern kündigen verstärkte Kontrollen an. Tierschutzorganisationen fordern Verschärfungen im Onlinehandel mit Tieren.",
    why_relevant:
      "Kernthema WTG Welpenhandel und Tierschutz DE; akute Medienlage für eigene Pressearbeit.",
    next_steps: [
      "Pressemitteilung mit Bezug zur Recherche aufsetzen",
      "Social-Media-Kampagne zum Welpenhandel verstärken",
    ],
    topic_tags: ["Tierschutz DE", "Social Media", "Andere NGOs"],
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
    original_text:
      "Die Bundesregierung kündigt eine Novelle des Tierschutzgesetzes für das kommende Jahr an.",
    translated_title: "Bundesregierung plant Novelle des Tierschutzgesetzes",
    summary:
      "Die Bundesregierung kündigt eine Novelle des Tierschutzgesetzes an. Schwerpunkte sollen Heimtierhandel, Nutztierhaltung und Strafrahmen sein.",
    full_summary:
      "Der Referentenentwurf wird für das vierte Quartal erwartet. Verbände werden zu einer Stellungnahme aufgerufen. Erwartet werden Verschärfungen im Bereich Onlinehandel mit Tieren sowie strengere Vorgaben für Nutztierhaltung. Die Opposition kritisiert das Tempo der Reform.",
    why_relevant:
      "Direkter Treffer für WTG-Schwerpunkt deutsche Tierschutzgesetzgebung; Stellungnahme empfohlen.",
    next_steps: [
      "Stellungnahme im Advocacy-Team vorbereiten",
      "Koalitionspartner im Verbändekreis kontaktieren",
    ],
    topic_tags: ["Tierschutz DE"],
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
    original_text:
      "Engagement Global hat eine Förderlinie für tierschutzbezogene Projekte in der EZ veröffentlicht.",
    translated_title: "bengo: Förderlinie für tierschutzbezogene EZ-Projekte",
    summary:
      "Engagement Global öffnet eine neue Förderlinie für tierschutzbezogene EZ-Projekte. Förderfähig sind kleine und mittlere deutsche Träger.",
    full_summary:
      "Die Förderlinie deckt insbesondere Projekte zu Nutztierhaltung, Tiergesundheit und nachhaltiger Landwirtschaft in Partnerländern ab. Förderhöhe bis 200.000 EUR, Eigenanteil 25 Prozent. Antragsfenster läuft drei Monate.",
    why_relevant:
      "Passt zu mehreren laufenden WTG-Projekten in der internationalen Arbeit zu Nutztierschutz.",
    next_steps: [
      "Projektidee mit Programmteam International abstimmen",
      "Partner für lokale Umsetzung anfragen",
    ],
    topic_tags: ["International", "Landwirtschaft", "Förderung"],
    funding_deadline: d(45),
    funding_amount_min: 50000,
    funding_amount_max: 200000,
    funding_funder: "Engagement Global (bengo)",
    eligibility_verdict: "yes",
    eligibility_reason:
      "WTG ist als kleiner deutscher Träger mit Tierschutz-Projekterfahrung in über 20 Ländern antragsberechtigt.",
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
    original_text:
      "The European Commission opens a public consultation on stricter rules for online sales of companion animals.",
    translated_title: "EU-Konsultation zu strengeren Regeln für Online-Tierhandel",
    summary:
      "Die EU-Kommission startet eine öffentliche Konsultation zu strengeren Regeln für den Online-Handel mit Heimtieren. Tierschutzorganisationen werden ausdrücklich zur Beteiligung aufgerufen.",
    full_summary:
      "Die Konsultation läuft acht Wochen und behandelt Identifizierungspflichten, Verifizierung von Verkäufern und Sanktionen. Erwartet werden im Ergebnis Vorschläge für eine EU-weite Verordnung. Tierschutzorganisationen sehen darin eine zentrale Chance zur Eindämmung des illegalen Welpenhandels.",
    why_relevant:
      "Direkter Anknüpfungspunkt für WTG-Arbeit zum Welpenhandel und für Social-Media-Mobilisierung.",
    next_steps: [
      "Konsultationsbeitrag im Advocacy-Team koordinieren",
      "Mitglieder über Konsultation informieren",
    ],
    topic_tags: ["International", "Tierschutz DE", "Social Media"],
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
    original_text:
      "World Animal Protection publishes its global review of working equine welfare for 2026.",
    translated_title: "Globale Übersicht: Wohlergehen von Arbeitspferden und -eseln 2026",
    summary:
      "World Animal Protection veröffentlicht eine globale Übersicht zum Wohlergehen von Arbeitspferden und -eseln. Bericht analysiert 15 Länder.",
    full_summary:
      "Der Bericht zeigt erhebliche regionale Unterschiede in der tierärztlichen Versorgung und im Schutz vor Überlastung. Empfohlen werden lokale Trainingsprogramme für Halter:innen und politische Maßnahmen gegen den Eselshäute-Handel. NGOs werden als zentrale Umsetzungspartner genannt.",
    why_relevant:
      "Hintergrundstudie für WTG-Projekte zu Arbeitseseln in mehreren Partnerländern.",
    next_steps: ["Studie an Programmteam International weiterleiten"],
    topic_tags: ["International", "Landwirtschaft"],
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
    original_text:
      "Eine neue Verbraucherumfrage zeigt hohes Vertrauen in die staatliche Haltungskennzeichnung.",
    translated_title: "Verbraucherumfrage zu Haltungskennzeichnung veröffentlicht",
    summary:
      "Eine neue Verbraucherumfrage zeigt steigendes Vertrauen in die staatliche Haltungskennzeichnung bei tierischen Produkten in Deutschland.",
    full_summary:
      "Über 60 Prozent der Befragten achten beim Einkauf auf die Haltungskennzeichnung. Jüngere Konsumentengruppen sind besonders sensibilisiert. Verbände sehen Anlass für verstärkte Verbraucherkommunikation.",
    why_relevant:
      "Datenbasis für WTG-Arbeit zu Verbraucher- und Landwirtschaftsthemen in Deutschland.",
    next_steps: [],
    topic_tags: ["Tierschutz DE", "Landwirtschaft"],
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
    original_text:
      "Das BMZ informiert über eine kommende Förderlinie zur nachhaltigen Landwirtschaft mit Tierwohl-Komponente.",
    translated_title: "BMZ: Vorinformation zur Förderung nachhaltiger Landwirtschaft",
    summary:
      "Das BMZ kündigt eine Förderlinie zur nachhaltigen Landwirtschaft mit Tierwohl-Komponente an. Konkrete Modalitäten folgen im Herbst.",
    full_summary:
      "Die Förderlinie soll Projekte unterstützen, die ökologische Landwirtschaft mit besserer Nutztierhaltung verbinden. Antragsberechtigt voraussichtlich deutsche Träger mit Partnerstrukturen in EZ-Ländern. Erwartete Fördersummen 200.000 bis 600.000 EUR.",
    why_relevant:
      "Mögliche größere Förderquelle für integrierte WTG-Projekte in Landwirtschaftsregionen.",
    next_steps: [],
    topic_tags: ["Förderung", "Landwirtschaft", "International"],
    funding_deadline: d(100),
    funding_amount_min: 200000,
    funding_amount_max: 600000,
    funding_funder: "BMZ",
    eligibility_verdict: "check",
    eligibility_reason:
      "WTG erfüllt grundsätzlich die Kriterien; konkrete Modalitäten zur Antragstellung werden erst im Herbst veröffentlicht.",
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
    original_text:
      "Der Deutsche Tierschutzbund veröffentlicht seinen Jahresbericht zur Lage des Tierschutzes in Deutschland.",
    translated_title: "Jahresbericht zur Lage des Tierschutzes in Deutschland 2026",
    summary:
      "Der Deutsche Tierschutzbund veröffentlicht seinen Jahresbericht. Schwerpunkte sind Heimtierhandel, Nutztierhaltung und Versuchstiere.",
    full_summary:
      "Der Bericht dokumentiert Fortschritte bei der Aufdeckung illegalen Welpenhandels und anhaltende Defizite bei Nutztierhaltung und Versuchstierzahlen. Empfohlen werden gesetzgeberische Reformen und stärkere Kontrollen. Verbände werden zur gemeinsamen Lobbyarbeit aufgerufen.",
    why_relevant:
      "Übergreifender Referenztext für WTG-Positionspapiere und Kommunikation zur deutschen Tierschutzlage.",
    next_steps: [],
    topic_tags: ["Tierschutz DE", "Andere NGOs"],
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
