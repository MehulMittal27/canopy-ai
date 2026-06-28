const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type NewsPriority = "red" | "amber" | "green";

type Org = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  languages: string[] | null;
  topics: string[] | null;
  news_countries: string[] | null;
  news_topics: string[] | null;
  news_languages: string[] | null;
  trusted_news_domains: string[] | null;
};

type NewsPreferences = {
  countries: string[];
  topics: string[];
  languages: string[];
  trustedDomains: string[];
};

type CandidateNewsItem = {
  external_id: string;
  source: string | null;
  source_url: string | null;
  image_url: string | null;
  image_alt: string | null;
  country_flag: string | null;
  headline: string;
  topic: string;
  time_ago: string | null;
  priority: NewsPriority;
  is_urgent: boolean;
  published_at: string | null;
  snippet: string | null;
  raw_source: "africa-rss" | "gdelt" | "reliefweb";
};

type ExistingNewsImageRow = {
  id: string;
  source_url: string | null;
  headline: string | null;
  published_at: string | null;
  created_at: string | null;
};

type InsertResult = {
  inserted: number;
  updated: number;
  skipped: number;
  warnings: string[];
};

const URGENT_TERMS = [
  "urgent",
  "emergency",
  "deadline",
  "flood",
  "flooding",
  "disaster",
  "outbreak",
  "conflict",
  "violence",
  "ban",
  "law",
  "court",
  "investigation",
];

const SOURCE_IMAGE_ENRICHMENT_LIMIT = 24;
const SOURCE_IMAGE_ENRICHMENT_CONCURRENCY = 6;
const SOURCE_IMAGE_FETCH_TIMEOUT_MS = 4_000;
const SOURCE_HTML_PARSE_LIMIT = 300_000;
const NEWS_MAX_AGE_DAYS = 14;
const NEWS_FUTURE_GRACE_DAYS = 1;

const AFRICAN_COUNTRY_FLAGS: Record<string, string> = {
  algeria: "🇩🇿",
  angola: "🇦🇴",
  benin: "🇧🇯",
  botswana: "🇧🇼",
  "burkina faso": "🇧🇫",
  burundi: "🇧🇮",
  cameroon: "🇨🇲",
  "cape verde": "🇨🇻",
  "central african republic": "🇨🇫",
  chad: "🇹🇩",
  comoros: "🇰🇲",
  congo: "🇨🇬",
  "cote d'ivoire": "🇨🇮",
  "democratic republic of the congo": "🇨🇩",
  djibouti: "🇩🇯",
  egypt: "🇪🇬",
  "equatorial guinea": "🇬🇶",
  eritrea: "🇪🇷",
  eswatini: "🇸🇿",
  ethiopia: "🇪🇹",
  gabon: "🇬🇦",
  gambia: "🇬🇲",
  ghana: "🇬🇭",
  guinea: "🇬🇳",
  "guinea-bissau": "🇬🇼",
  kenya: "🇰🇪",
  lesotho: "🇱🇸",
  liberia: "🇱🇷",
  libya: "🇱🇾",
  madagascar: "🇲🇬",
  malawi: "🇲🇼",
  mali: "🇲🇱",
  mauritania: "🇲🇷",
  mauritius: "🇲🇺",
  morocco: "🇲🇦",
  mozambique: "🇲🇿",
  namibia: "🇳🇦",
  niger: "🇳🇪",
  nigeria: "🇳🇬",
  rwanda: "🇷🇼",
  "sao tome and principe": "🇸🇹",
  senegal: "🇸🇳",
  seychelles: "🇸🇨",
  "sierra leone": "🇸🇱",
  somalia: "🇸🇴",
  "south africa": "🇿🇦",
  "south sudan": "🇸🇸",
  sudan: "🇸🇩",
  tanzania: "🇹🇿",
  togo: "🇹🇬",
  tunisia: "🇹🇳",
  uganda: "🇺🇬",
  zambia: "🇿🇲",
  zimbabwe: "🇿🇼",
};

const GUARDIAN_COUNTRY_FEEDS: Record<string, string> = {
  burundi: "burundi",
  cameroon: "cameroon",
  congo: "congo",
  "democratic republic of the congo": "congo",
  ethiopia: "ethiopia",
  ghana: "ghana",
  kenya: "kenya",
  malawi: "malawi",
  mozambique: "mozambique",
  nigeria: "nigeria",
  rwanda: "rwanda",
  senegal: "senegal",
  somalia: "somalia",
  "south africa": "southafrica",
  sudan: "sudan",
  tanzania: "tanzania",
  uganda: "uganda",
  zambia: "zambia",
  zimbabwe: "zimbabwe",
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      throw new HttpError(405, "Method not allowed.");
    }

    const env = readEnvironment();
    const userId = await requireAuthenticatedUser(req, env);
    const org = await getOrgForUser(env, userId);

    if (!org) {
      throw new HttpError(404, "No organization is linked to this account.");
    }

    const preferences = normalizeNewsPreferences(org);
    const { candidates, warnings } = await fetchNewsCandidates(preferences, env.reliefWebAppName);
    const result = await insertNewsItems(env, org.id, candidates, warnings);
    const imageBackfill = await backfillRecentNewsItemImages(env, org.id);

    result.updated += imageBackfill.updated;
    result.skipped += imageBackfill.skipped;

    return jsonResponse(result);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unexpected news refresh failure.";

    if (status >= 500) {
      console.error("refresh-news failed", error);
    }

    return jsonResponse({ error: message }, status);
  }
});

function readEnvironment() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const reliefWebAppName = Deno.env.get("RELIEFWEB_APP_NAME")?.trim() || "";

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new HttpError(500, "Supabase function environment is missing required keys.");
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    reliefWebAppName,
  };
}

async function requireAuthenticatedUser(
  req: Request,
  env: ReturnType<typeof readEnvironment>,
): Promise<string> {
  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "You must be signed in to refresh news.");
  }

  const authResponse = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: env.supabaseAnonKey,
    },
  });

  if (!authResponse.ok) {
    throw new HttpError(401, "Your session expired. Please sign in again.");
  }

  const user = await authResponse.json();
  const userId = typeof user?.id === "string" ? user.id : "";

  if (!userId) {
    throw new HttpError(401, "Your session could not be verified.");
  }

  return userId;
}

async function getOrgForUser(
  env: ReturnType<typeof readEnvironment>,
  userId: string,
): Promise<Org | null> {
  const select = [
    "id",
    "name",
    "slug",
    "country",
    "languages",
    "topics",
    "news_countries",
    "news_topics",
    "news_languages",
    "trusted_news_domains",
  ].join(",");
  const url = `${env.supabaseUrl}/rest/v1/orgs?admin_user_id=eq.${encodeURIComponent(
    userId,
  )}&select=${select}&limit=1`;
  const response = await serviceRoleFetch(env, url);

  if (!response.ok) {
    throw new HttpError(500, "Could not load organization for news refresh.");
  }

  const rows = (await response.json()) as Org[];
  return rows[0] ?? null;
}

function normalizeNewsPreferences(org: Org): NewsPreferences {
  const countries = preferArray(org.news_countries, org.country ? [org.country] : []).filter(
    isAfricanCountry,
  );

  return {
    countries,
    topics: preferArray(org.news_topics, org.topics ?? []),
    languages: preferArray(org.news_languages, org.languages ?? []),
    trustedDomains: cleanDomains(org.trusted_news_domains ?? []),
  };
}

async function fetchNewsCandidates(preferences: NewsPreferences, reliefWebAppName: string) {
  const warnings: string[] = [];
  const candidates: CandidateNewsItem[] = [];
  const sourceFetches: Promise<CandidateNewsItem[]>[] = [];
  const sourceNames: string[] = [];

  if (preferences.countries.length === 0) {
    warnings.push("Choose at least one African country in News Monitor preferences.");
    return { candidates, warnings };
  }

  try {
    candidates.push(...(await fetchGdeltNews(preferences)));
  } catch (error) {
    console.error("GDELT source failed", error);
    warnings.push(`GDELT could not be refreshed right now: ${errorMessage(error)}`);
  }

  sourceFetches.push(fetchAfricaRssNews(preferences));
  sourceNames.push("Africa RSS");

  if (isApprovedReliefWebAppName(reliefWebAppName)) {
    sourceFetches.push(fetchReliefWebNews(preferences, reliefWebAppName));
    sourceNames.push("ReliefWeb");
  }

  const results = await Promise.allSettled(sourceFetches);

  for (const [index, result] of results.entries()) {
    if (result.status === "fulfilled") {
      candidates.push(...result.value);
      continue;
    }

    warnings.push(
      `${sourceNames[index]} could not be refreshed right now: ${errorMessage(result.reason)}`,
    );
    console.error("News source failed", result.reason);
  }

  const dedupedCandidates = dedupeCandidates(candidates).slice(0, 70);
  await enrichCandidatesWithSourceImages(dedupedCandidates);

  return {
    candidates: dedupedCandidates,
    warnings,
  };
}

async function fetchGdeltNews(preferences: NewsPreferences): Promise<CandidateNewsItem[]> {
  const query = buildGdeltQuery(preferences);
  if (!query) return [];

  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", query);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("timespan", "1week");
  url.searchParams.set("sort", "datedesc");
  url.searchParams.set("maxrecords", "50");

  const response = await fetchWithRetry(url);
  if (!response.ok) {
    throw new Error(`GDELT returned ${response.status}.`);
  }

  const payload = await response.json();
  const articles = Array.isArray(payload?.articles) ? payload.articles : [];

  return articles
    .map((article): CandidateNewsItem | null => {
      const title = asString(article?.title);
      const sourceUrl = asUrl(article?.url);

      if (!title || !sourceUrl) return null;

      const text = [title, asString(article?.domain), asString(article?.sourcecountry)].join(" ");
      const source = asString(article?.domain) || "GDELT";
      const publishedAt = parseGdeltDate(asString(article?.seendate));
      const imageUrl = firstUrl(
        article?.socialimage,
        article?.imageurl,
        article?.image,
        article?.thumbnail,
      );

      return buildCandidate({
        rawSource: "gdelt",
        externalId: sourceUrl,
        title,
        source,
        sourceUrl,
        imageUrl,
        imageAlt: title,
        snippet: null,
        publishedAt,
        searchableText: text,
        preferences,
      });
    })
    .filter((item): item is CandidateNewsItem => Boolean(item));
}

async function fetchAfricaRssNews(preferences: NewsPreferences): Promise<CandidateNewsItem[]> {
  const feeds = africaRssFeedsFor(preferences);
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const response = await fetch(feed.url, { headers: sourceRequestHeaders() });
      if (!response.ok) {
        throw new Error(`${feed.name} returned ${response.status}.`);
      }

      const xml = await response.text();
      return parseRssItems(xml)
        .slice(0, 20)
        .map((item): CandidateNewsItem | null => {
          if (!item.title || !item.link) return null;

          const searchableText = [item.title, item.description, item.source, feed.country]
            .filter(Boolean)
            .join(" ");
          const matchedCountry =
            feed.country ?? firstMatchingCountry(preferences.countries, searchableText);

          if (!matchedCountry) return null;

          return buildCandidate({
            rawSource: "africa-rss",
            externalId: item.guid || item.link,
            title: item.title,
            source: item.source || feed.name,
            sourceUrl: item.link,
            imageUrl: item.imageUrl,
            imageAlt: item.title,
            snippet: item.description,
            publishedAt: item.publishedAt,
            searchableText,
            forcedCountry: matchedCountry,
            preferences,
          });
        })
        .filter((item): item is CandidateNewsItem => Boolean(item));
    }),
  );

  return results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

function isApprovedReliefWebAppName(value: string) {
  return Boolean(value && value !== "canopy-ai-news-monitor" && value !== "apidoc");
}

async function fetchReliefWebNews(
  preferences: NewsPreferences,
  reliefWebAppName: string,
): Promise<CandidateNewsItem[]> {
  const query = buildReliefWebQuery(preferences);
  if (!query) return [];

  const url = new URL("https://api.reliefweb.int/v2/reports");
  url.searchParams.set("appname", reliefWebAppName);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      appname: reliefWebAppName,
      profile: "list",
      limit: 20,
      query: {
        value: query,
        operator: "AND",
      },
      fields: {
        include: ["title", "url", "source", "date", "body", "image"],
      },
      sort: ["date.created:desc"],
    }),
  });

  if (!response.ok) {
    throw new Error(`ReliefWeb returned ${response.status}.`);
  }

  const payload = await response.json();
  const rows = Array.isArray(payload?.data) ? payload.data : [];

  return rows
    .map((row): CandidateNewsItem | null => {
      const fields = row?.fields ?? {};
      const title = asString(fields.title);
      const sourceUrl = asUrl(fields.url);

      if (!title || !sourceUrl) return null;

      const source = extractReliefWebSource(fields.source) || "ReliefWeb";
      const publishedAt =
        asString(fields?.date?.original) || asString(fields?.date?.created) || null;
      const snippet = stripHtml(asString(fields.body)).slice(0, 480) || null;
      const imageUrl = extractReliefWebImage(fields.image);

      return buildCandidate({
        rawSource: "reliefweb",
        externalId: asString(row?.id) || sourceUrl,
        title,
        source,
        sourceUrl,
        imageUrl,
        imageAlt: title,
        snippet,
        publishedAt,
        searchableText: [title, snippet, source].filter(Boolean).join(" "),
        preferences,
      });
    })
    .filter((item): item is CandidateNewsItem => Boolean(item));
}

async function fetchWithRetry(url: URL) {
  let response = await fetch(url, { headers: sourceRequestHeaders() });

  if (response.status === 429) {
    await sleep(6_000);
    response = await fetch(url, { headers: sourceRequestHeaders() });
  }

  return response;
}

function sourceRequestHeaders() {
  return {
    Accept: "application/json, application/rss+xml, application/xml, text/xml, */*",
    "User-Agent": "CanopyAI/1.0 (hackathon NGO dashboard; contact: hello@canopy.local)",
  };
}

function sourcePageRequestHeaders() {
  return {
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  };
}

function buildCandidate({
  rawSource,
  externalId,
  title,
  source,
  sourceUrl,
  imageUrl,
  imageAlt,
  snippet,
  publishedAt,
  searchableText,
  forcedCountry,
  preferences,
}: {
  rawSource: CandidateNewsItem["raw_source"];
  externalId: string;
  title: string;
  source: string | null;
  sourceUrl: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  snippet: string | null;
  publishedAt: string | null;
  searchableText: string;
  forcedCountry?: string | null;
  preferences: NewsPreferences;
}): CandidateNewsItem | null {
  const normalizedPublishedAt = normalizeRecentNewsDate(publishedAt);
  if (!normalizedPublishedAt) return null;

  const topic = firstMatchingTopic(preferences.topics, searchableText) || "general";
  const matchedCountry =
    forcedCountry || firstMatchingCountry(preferences.countries, searchableText);

  if (!matchedCountry) return null;

  const isUrgent = hasAnyTerm(searchableText, URGENT_TERMS);
  const trusted = isTrustedDomain(sourceUrl, preferences.trustedDomains);
  const directMatch = Boolean(matchedCountry && topic !== "general");
  const priority: NewsPriority = isUrgent ? "red" : directMatch || trusted ? "amber" : "green";

  return {
    external_id: externalId,
    source,
    source_url: sourceUrl,
    image_url: imageUrl ?? null,
    image_alt: imageAlt ?? null,
    country_flag: countryFlag(matchedCountry),
    headline: title,
    topic,
    time_ago: formatTimeAgo(normalizedPublishedAt),
    priority,
    is_urgent: isUrgent,
    published_at: normalizedPublishedAt,
    snippet,
    raw_source: rawSource,
  };
}

async function insertNewsItems(
  env: ReturnType<typeof readEnvironment>,
  orgId: string,
  candidates: CandidateNewsItem[],
  warnings: string[],
): Promise<InsertResult> {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const response = await serviceRoleFetch(env, `${env.supabaseUrl}/rest/v1/news_items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        ...candidate,
        org_id: orgId,
      }),
    });

    if (response.ok) {
      inserted += 1;
      continue;
    }

    const detail = await response.text();
    if (response.status === 409 || detail.includes("23505")) {
      if (await updateExistingNewsItem(env, orgId, candidate)) {
        updated += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    skipped += 1;
    warnings.push("One news item could not be saved.");
    console.error("Could not insert news item", response.status, detail);
  }

  return {
    inserted,
    updated,
    skipped,
    warnings,
  };
}

async function updateExistingNewsItem(
  env: ReturnType<typeof readEnvironment>,
  orgId: string,
  candidate: CandidateNewsItem,
) {
  const updates: Record<string, string | null | boolean> = {};

  if (candidate.image_url) updates.image_url = candidate.image_url;
  if (candidate.image_alt) updates.image_alt = candidate.image_alt;
  if (candidate.snippet) updates.snippet = candidate.snippet;
  if (candidate.published_at) updates.published_at = candidate.published_at;
  if (candidate.time_ago) updates.time_ago = candidate.time_ago;
  updates.priority = candidate.priority;
  updates.is_urgent = candidate.is_urgent;

  if (Object.keys(updates).length === 0) return false;

  const filter = candidate.source_url
    ? `org_id=eq.${encodeURIComponent(orgId)}&source_url=eq.${encodeURIComponent(
        candidate.source_url,
      )}`
    : `org_id=eq.${encodeURIComponent(orgId)}&raw_source=eq.${encodeURIComponent(
        candidate.raw_source,
      )}&external_id=eq.${encodeURIComponent(candidate.external_id)}`;

  const response = await serviceRoleFetch(env, `${env.supabaseUrl}/rest/v1/news_items?${filter}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    console.error("Could not update duplicate news item", response.status, await response.text());
  }

  return response.ok;
}

async function serviceRoleFetch(
  env: ReturnType<typeof readEnvironment>,
  url: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set("apikey", env.supabaseServiceRoleKey);
  headers.set("Authorization", `Bearer ${env.supabaseServiceRoleKey}`);

  return fetch(url, {
    ...init,
    headers,
  });
}

function buildGdeltQuery(preferences: NewsPreferences) {
  const countries = preferences.countries.filter(
    (country) => country.toLowerCase() !== "international",
  );
  const countryGroup = orGroup(countries.slice(0, 2).flatMap(countryQueryTerms));
  const topicGroup = orGroup(preferences.topics.map(topicToGdeltTerm).slice(0, 4));

  if (countries[0]?.toLowerCase() === "burundi") {
    return "Burundi";
  }

  if (countryGroup && topicGroup) return `${countryGroup} ${topicGroup}`;
  return topicGroup || countryGroup;
}

function africaRssFeedsFor(preferences: NewsPreferences) {
  const feeds: Array<{ name: string; url: string; country?: string }> = [
    {
      name: "The Guardian Africa",
      url: "https://www.theguardian.com/world/africa/rss",
    },
    {
      name: "DW Africa",
      url: "https://rss.dw.com/rdf/rss-en-africa",
    },
  ];

  for (const country of preferences.countries) {
    const slug = GUARDIAN_COUNTRY_FEEDS[normalizeCountryKey(country)];
    if (!slug) continue;

    feeds.push({
      name: `The Guardian ${country}`,
      url: `https://www.theguardian.com/world/${slug}/rss`,
      country,
    });
  }

  if (preferences.topics.some((topic) => /animal|wildlife|trade|donkey|puppy/i.test(topic))) {
    feeds.push({
      name: "The Guardian Wildlife",
      url: "https://www.theguardian.com/environment/wildlife/rss",
    });
  }

  return feeds;
}

function buildReliefWebQuery(preferences: NewsPreferences) {
  const countries = preferences.countries.filter(
    (country) => country.toLowerCase() !== "international",
  );
  const countryGroup = reliefWebGroup(countries);
  const topicGroup = reliefWebGroup(preferences.topics.map(topicToPhrase));

  if (countryGroup && topicGroup) return `${countryGroup} AND ${topicGroup}`;
  return countryGroup || topicGroup;
}

function orGroup(values: string[]) {
  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned[0];
  return `(${cleaned.join(" OR ")})`;
}

function reliefWebGroup(values: string[]) {
  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned[0];
  return `(${cleaned.join(" OR ")})`;
}

function countryQueryTerms(country: string) {
  const normalized = country.trim().toLowerCase();
  if (!normalized || !isAfricanCountry(country)) return [];
  if (normalized === "democratic republic of the congo")
    return ['"Democratic Republic of the Congo"', "DRC", "Congo"];
  if (normalized === "congo") return ["Congo"];
  return [quotePhrase(country)];
}

function topicToPhrase(topic: string) {
  return quotePhrase(topic.replace(/[-_]+/g, " "));
}

function topicToGdeltTerm(topic: string) {
  const normalized = topic.replace(/[-_]+/g, " ").toLowerCase();
  if (normalized === "law policy") return "law";
  if (normalized === "field ops") return "field";
  if (normalized === "gbv") return "violence";
  return quotePhrase(normalized);
}

function quotePhrase(value: string) {
  const cleaned = value.replace(/"/g, "").trim();
  if (!cleaned) return "";
  return cleaned.includes(" ") ? `"${cleaned}"` : cleaned;
}

function firstMatchingTopic(topics: string[], text: string) {
  return topics.find((topic) => topicMatches(topic, text)) ?? null;
}

function firstMatchingCountry(countries: string[], text: string) {
  return countries.find((country) => countryMatches(country, text)) ?? null;
}

function topicMatches(topic: string, text: string) {
  const normalizedTopic = normalizeSearchText(topic.replace(/[-_]+/g, " "));
  const normalizedText = normalizeSearchText(text);
  if (!normalizedTopic) return false;
  if (normalizedText.includes(normalizedTopic)) return true;

  const parts = normalizedTopic.split(" ").filter((part) => part.length > 2);
  if (parts.length === 0) return false;
  if (parts.length === 1) return normalizedText.includes(parts[0]);
  return parts.every((part) => normalizedText.includes(part));
}

function countryMatches(country: string, text: string) {
  const normalizedCountry = normalizeSearchText(country);
  const normalizedText = normalizeSearchText(text);
  if (!normalizedCountry || !isAfricanCountry(country)) return false;
  if (normalizedCountry === "democratic republic of the congo") {
    return normalizedText.includes("democratic republic of the congo") || /\bdrc\b/i.test(text);
  }
  return normalizedText.includes(normalizedCountry);
}

function hasAnyTerm(text: string, terms: string[]) {
  const normalizedText = normalizeSearchText(text);
  return terms.some((term) => normalizedText.includes(term));
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAfricanCountry(value: string) {
  return normalizeCountryKey(value) in AFRICAN_COUNTRY_FLAGS;
}

function normalizeCountryKey(value: string) {
  const key = normalizeSearchText(value);

  if (key === "dr congo" || key === "drc" || key === "congo kinshasa") {
    return "democratic republic of the congo";
  }

  if (key === "ivory coast" || key === "cote d ivoire") {
    return "cote d'ivoire";
  }

  if (key === "cape verde" || key === "cabo verde") {
    return "cape verde";
  }

  if (key === "swaziland") {
    return "eswatini";
  }

  if (key === "sao tome and principe") {
    return "sao tome and principe";
  }

  return key;
}

function isTrustedDomain(sourceUrl: string | null, trustedDomains: string[]) {
  if (!sourceUrl) return false;

  try {
    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "").toLowerCase();
    return trustedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch (_error) {
    return false;
  }
}

function countryFlag(country: string | undefined) {
  if (!country) return "🌍";
  return AFRICAN_COUNTRY_FLAGS[normalizeCountryKey(country)] ?? "🌍";
}

function dedupeCandidates(candidates: CandidateNewsItem[]) {
  const seen = new Set<string>();
  const result: CandidateNewsItem[] = [];

  for (const candidate of candidates) {
    const key = candidate.source_url || `${candidate.raw_source}:${candidate.external_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }

  return result;
}

function preferArray(primary: string[] | null, fallback: string[]) {
  return primary && primary.length > 0 ? cleanList(primary) : cleanList(fallback);
}

function cleanList(values: readonly string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = value.trim();
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

function cleanDomains(values: readonly string[]) {
  return cleanList(
    values.map((value) =>
      value
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, ""),
    ),
  );
}

function extractReliefWebSource(value: unknown) {
  if (Array.isArray(value)) {
    return asString(value[0]?.name) || asString(value[0]?.shortname);
  }

  if (value && typeof value === "object") {
    return asString((value as { name?: unknown }).name);
  }

  return asString(value);
}

async function enrichCandidatesWithSourceImages(candidates: CandidateNewsItem[]) {
  const missingImageCandidates = candidates
    .filter((candidate) => !candidate.image_url && candidate.source_url)
    .sort((a, b) => sourceImagePriority(a) - sourceImagePriority(b))
    .slice(0, SOURCE_IMAGE_ENRICHMENT_LIMIT);

  if (missingImageCandidates.length === 0) return;

  await runLimited(
    missingImageCandidates,
    SOURCE_IMAGE_ENRICHMENT_CONCURRENCY,
    async (candidate) => {
      const imageUrl = await fetchSourcePageImage(candidate.source_url);
      if (!imageUrl) return;

      candidate.image_url = imageUrl;
      candidate.image_alt = candidate.image_alt || candidate.headline;
    },
  );
}

function sourceImagePriority(candidate: CandidateNewsItem) {
  if (candidate.raw_source === "africa-rss") return 0;
  if (candidate.raw_source === "gdelt") return 1;
  return 2;
}

async function fetchSourcePageImage(sourceUrl: string | null) {
  if (!sourceUrl) return null;

  const url = asUrl(sourceUrl);
  if (!url) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SOURCE_IMAGE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: sourcePageRequestHeaders(),
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType && !contentType.includes("text/html")) return null;

    const html = (await response.text()).slice(0, SOURCE_HTML_PARSE_LIMIT);
    return extractHtmlImageUrl(html, response.url || url);
  } catch (error) {
    console.error("Could not enrich news image", errorMessage(error), url);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function backfillRecentNewsItemImages(env: ReturnType<typeof readEnvironment>, orgId: string) {
  const rows = await getRecentNewsRowsMissingImages(env, orgId);
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!isRecentNewsDate(row.published_at || row.created_at)) {
      skipped += 1;
      continue;
    }

    const imageUrl = await fetchSourcePageImage(row.source_url);
    if (!imageUrl) {
      skipped += 1;
      continue;
    }

    const response = await serviceRoleFetch(
      env,
      `${env.supabaseUrl}/rest/v1/news_items?id=eq.${encodeURIComponent(
        row.id,
      )}&org_id=eq.${encodeURIComponent(orgId)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          image_url: imageUrl,
          image_alt: row.headline || "News image",
        }),
      },
    );

    if (response.ok) {
      updated += 1;
    } else {
      skipped += 1;
      console.error("Could not backfill news image", response.status, await response.text());
    }
  }

  return { updated, skipped };
}

async function getRecentNewsRowsMissingImages(
  env: ReturnType<typeof readEnvironment>,
  orgId: string,
): Promise<ExistingNewsImageRow[]> {
  const select = ["id", "source_url", "headline", "published_at", "created_at"].join(",");
  const url = [
    `${env.supabaseUrl}/rest/v1/news_items?org_id=eq.${encodeURIComponent(orgId)}`,
    "image_url=is.null",
    "source_url=not.is.null",
    `or=${encodeURIComponent(recentNewsFilter())}`,
    `select=${select}`,
    "order=published_at.desc.nullslast,created_at.desc",
    "limit=16",
  ].join("&");
  const response = await serviceRoleFetch(env, url);

  if (!response.ok) {
    console.error(
      "Could not load recent rows for image backfill",
      response.status,
      await response.text(),
    );
    return [];
  }

  return (await response.json()) as ExistingNewsImageRow[];
}

function extractHtmlImageUrl(html: string, baseUrl: string) {
  const candidates = [
    extractMetaContent(html, "property", "og:image:secure_url"),
    extractMetaContent(html, "property", "og:image"),
    extractMetaContent(html, "property", "og:image:url"),
    extractMetaContent(html, "name", "twitter:image"),
    extractMetaContent(html, "name", "twitter:image:src"),
    extractMetaContent(html, "name", "thumbnail"),
    extractMetaContent(html, "itemprop", "image"),
    extractLinkHref(html, "image_src"),
    extractBestHtmlImage(html),
  ];

  for (const candidate of candidates) {
    const url = resolveUrl(candidate, baseUrl);
    if (url) return url;
  }

  return null;
}

function extractBestHtmlImage(html: string) {
  const tags = html.match(/<img\b[^>]*>/gi) ?? [];
  let best: { src: string; score: number } | null = null;

  for (const tag of tags) {
    const src = extractHtmlAttribute(tag, "src") || extractHtmlAttribute(tag, "data-src");
    if (!src || isDecorativeImage(src)) continue;

    const width = parseHtmlDimension(extractHtmlAttribute(tag, "width"));
    const height = parseHtmlDimension(extractHtmlAttribute(tag, "height"));
    const alt = decodeXml(extractHtmlAttribute(tag, "alt"));
    const score = scoreHtmlImage(src, alt, width, height);

    if (score <= 0) continue;
    if (!best || score > best.score) {
      best = { src, score };
    }
  }

  return best?.src ?? null;
}

function scoreHtmlImage(src: string, alt: string | null, width: number, height: number) {
  const normalized = normalizeSearchText([src, alt].filter(Boolean).join(" "));
  if (!src || isDecorativeImage(src)) return 0;
  if (/\.(svg|gif)(?:[?#]|$)/i.test(src)) return 0;
  if (normalized.includes("logo") || normalized.includes("icon") || normalized.includes("button")) {
    return 0;
  }

  const hasDimensions = width > 0 || height > 0;
  if (hasDimensions && (width < 90 || height < 60)) return 0;

  let score = hasDimensions ? Math.max(width * height, width, height) : 9000;
  if (/\.(jpe?g|png|webp)(?:[?#]|$)/i.test(src)) score += 5000;
  if (normalized.includes("article") || normalized.includes("upload") || normalized.includes("story")) {
    score += 2500;
  }
  if (normalized.includes("banner") || normalized.includes("template") || normalized.includes("avatar")) {
    score -= 7000;
  }

  return score;
}

function parseHtmlDimension(value: string | null) {
  const dimension = Number.parseInt(value ?? "", 10);
  return Number.isFinite(dimension) ? dimension : 0;
}

function isDecorativeImage(src: string) {
  const decoded = decodeXml(src);
  return (
    !decoded ||
    decoded === "\"\"" ||
    decoded.includes("%22%22") ||
    /(?:spacer|pixel|tracking|analytics|printbutton|pdf_button|emailbutton|\/templates\/)/i.test(
      decoded,
    )
  );
}

function extractMetaContent(html: string, attributeName: string, attributeValue: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const value = extractHtmlAttribute(tag, attributeName);
    if (value?.toLowerCase() !== attributeValue.toLowerCase()) continue;

    const content = extractHtmlAttribute(tag, "content");
    if (content) return decodeXml(content);
  }

  return null;
}

function extractLinkHref(html: string, relValue: string) {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const value = extractHtmlAttribute(tag, "rel");
    if (value?.toLowerCase() !== relValue.toLowerCase()) continue;

    const href = extractHtmlAttribute(tag, "href");
    if (href) return decodeXml(href);
  }

  return null;
}

function extractHtmlAttribute(tag: string, attributeName: string) {
  const quoted = new RegExp(
    `\\b${escapeRegExp(attributeName)}\\s*=\\s*(["'])([\\s\\S]*?)\\1`,
    "i",
  ).exec(tag);
  if (quoted?.[2]) return quoted[2].trim();

  const unquoted = new RegExp(`\\b${escapeRegExp(attributeName)}\\s*=\\s*([^\\s>]+)`, "i").exec(
    tag,
  );
  return unquoted?.[1]?.trim() ?? null;
}

function resolveUrl(value: string | null, baseUrl: string) {
  const cleaned = decodeXml(value);
  if (!cleaned) return null;

  try {
    return new URL(cleaned, baseUrl).toString();
  } catch (_error) {
    return null;
  }
}

async function runLimited<T>(items: T[], concurrency: number, task: (item: T) => Promise<void>) {
  const workerCount = Math.min(concurrency, items.length);
  const workers = Array.from({ length: workerCount }, async (_value, workerIndex) => {
    for (let index = workerIndex; index < items.length; index += workerCount) {
      await task(items[index]);
    }
  });

  await Promise.all(workers);
}

function extractReliefWebImage(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = extractReliefWebImage(item);
      if (url) return url;
    }

    return null;
  }

  if (typeof value === "string") {
    return asUrl(value);
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  return firstUrl(
    record.url,
    record.original,
    record.large,
    record.medium,
    record.small,
    record.thumbnail,
    record.file,
  );
}

function parseGdeltDate(value: string | null) {
  if (!value) return null;

  const match = /^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?(\d{2})?Z?$/.exec(value);
  if (match) {
    const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function normalizeRecentNewsDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  const time = date.getTime();
  if (!Number.isFinite(time)) return null;

  const now = Date.now();
  const oldestAllowed = now - NEWS_MAX_AGE_DAYS * 86_400_000;
  const newestAllowed = now + NEWS_FUTURE_GRACE_DAYS * 86_400_000;

  if (time < oldestAllowed || time > newestAllowed) return null;
  return date.toISOString();
}

function recentNewsFilter() {
  const cutoff = new Date(Date.now() - NEWS_MAX_AGE_DAYS * 86_400_000).toISOString();
  return `(published_at.gte.${cutoff},and(published_at.is.null,created_at.gte.${cutoff}))`;
}

function isRecentNewsDate(value: string | null) {
  if (!value) return false;

  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return false;

  return time >= Date.now() - NEWS_MAX_AGE_DAYS * 86_400_000;
}

function formatTimeAgo(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;

  const days = Math.floor((Date.now() - time) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function stripHtml(value: string | null) {
  return (value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRssItems(xml: string) {
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((match) => {
    const itemXml = match[1];
    const description = stripHtml(decodeXml(extractXmlTag(itemXml, "description")));
    const pubDate = decodeXml(
      extractXmlTag(itemXml, "pubDate") || extractXmlTag(itemXml, "dc:date"),
    );
    const parsedDate = pubDate ? new Date(pubDate) : null;
    const enclosureUrl = decodeXml(extractXmlAttribute(itemXml, "enclosure", "url"));
    const enclosureType = decodeXml(extractXmlAttribute(itemXml, "enclosure", "type"));
    const imageUrl =
      extractBestMediaContentUrl(itemXml) ||
      firstUrl(
        extractXmlAttribute(itemXml, "media:thumbnail", "url"),
        extractXmlAttribute(itemXml, "image", "url"),
        enclosureType && !enclosureType.toLowerCase().startsWith("image/") ? null : enclosureUrl,
      );

    return {
      title: decodeXml(extractXmlTag(itemXml, "title")),
      link: decodeXml(extractXmlTag(itemXml, "link")),
      guid: decodeXml(extractXmlTag(itemXml, "guid")),
      description,
      source: decodeXml(extractXmlTag(itemXml, "source")),
      imageUrl,
      publishedAt:
        parsedDate && Number.isFinite(parsedDate.getTime()) ? parsedDate.toISOString() : null,
    };
  });
}

function extractXmlTag(xml: string, tagName: string) {
  const escapedTagName = escapeRegExp(tagName);
  const match = new RegExp(
    `<${escapedTagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedTagName}>`,
    "i",
  ).exec(xml);
  return match?.[1]?.trim() ?? null;
}

function extractBestMediaContentUrl(xml: string) {
  const tags = xml.match(/<media:content\b[^>]*>/gi) ?? [];
  let best: { url: string; width: number } | null = null;

  for (const tag of tags) {
    const url = firstUrl(extractXmlAttribute(tag, "media:content", "url"));
    if (!url) continue;

    const width = Number.parseInt(
      decodeXml(extractXmlAttribute(tag, "media:content", "width")),
      10,
    );
    const normalizedWidth = Number.isFinite(width) ? width : 0;

    if (!best || normalizedWidth > best.width) {
      best = { url, width: normalizedWidth };
    }
  }

  return best?.url ?? null;
}

function extractXmlAttribute(xml: string, tagName: string, attributeName: string) {
  const match = new RegExp(
    `<${escapeRegExp(tagName)}\\b[^>]*\\s${escapeRegExp(attributeName)}=(["'])(.*?)\\1`,
    "i",
  ).exec(xml);

  return match?.[2]?.trim() ?? null;
}

function decodeXml(value: string | null) {
  return (value ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asUrl(value: unknown) {
  const url = asString(value);
  if (!url) return null;

  try {
    return new URL(url).toString();
  } catch (_error) {
    return null;
  }
}

function firstUrl(...values: unknown[]) {
  for (const value of values) {
    const url = asUrl(decodeXml(asString(value)));
    if (url) return url;
  }

  return null;
}

function errorMessage(value: unknown) {
  return value instanceof Error ? value.message : "unknown source error";
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
