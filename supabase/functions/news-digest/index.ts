const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Org = {
  id: string;
  name: string;
  country: string | null;
  languages: string[] | null;
  topics: string[] | null;
  news_countries: string[] | null;
  news_topics: string[] | null;
  news_languages: string[] | null;
  trusted_news_domains: string[] | null;
};

type NewsItem = {
  id: string;
  source: string | null;
  source_url: string | null;
  headline: string | null;
  topic: string | null;
  priority: string | null;
  is_urgent: boolean | null;
  published_at: string | null;
  created_at: string | null;
  snippet: string | null;
  ai_summary: string | null;
  ai_why_relevant: string | null;
  ai_next_steps: string[] | null;
};

type NewsPreferences = {
  countries: string[];
  topics: string[];
  languages: string[];
  trustedDomains: string[];
};

type DigestResult = {
  title: string;
  overview: string;
  urgentDevelopments: string[];
  prepareFor: string[];
  opportunities: string[];
  articleCount: number;
  generatedAt: string;
  warnings: string[];
};

const DEFAULT_MODEL = "gpt-4o";
const MAX_DIGEST_ITEMS = 18;
const MAX_TEXT_LENGTH = 900;
const NEWS_MAX_AGE_DAYS = 14;

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      description: "A concise title for today's NGO news digest.",
    },
    overview: {
      type: "string",
      description: "A 3-5 sentence overview of what is happening and why it matters.",
    },
    urgentDevelopments: {
      type: "array",
      items: { type: "string" },
      description: "Important urgent developments the NGO should notice.",
    },
    prepareFor: {
      type: "array",
      items: { type: "string" },
      description: "Practical things the NGO should prepare for.",
    },
    opportunities: {
      type: "array",
      items: { type: "string" },
      description: "Potential opportunities, openings, or useful follow-ups.",
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      description: "Limitations or caveats about the digest.",
    },
  },
  required: ["title", "overview", "urgentDevelopments", "prepareFor", "opportunities", "warnings"],
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

    const items = await getRecentNewsItems(env, org.id);
    if (items.length === 0) {
      throw new HttpError(400, "Refresh news before generating a daily digest.");
    }

    const digest = await generateDigest(env, org, normalizeNewsPreferences(org), items);
    return jsonResponse(digest);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unexpected news digest failure.";

    if (status >= 500) {
      console.error("news-digest failed", error);
    }

    return jsonResponse({ error: message }, status);
  }
});

function readEnvironment() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
  const openAiModel = Deno.env.get("OPENAI_NEWS_MODEL")?.trim() || DEFAULT_MODEL;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new HttpError(500, "Supabase function environment is missing required keys.");
  }

  if (!openAiApiKey) {
    throw new HttpError(500, "OpenAI API key is not configured for news digest.");
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    openAiApiKey,
    openAiModel,
  };
}

async function requireAuthenticatedUser(
  req: Request,
  env: ReturnType<typeof readEnvironment>,
): Promise<string> {
  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "You must be signed in to generate a news digest.");
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
    throw new HttpError(500, "Could not load organization for news digest.");
  }

  const rows = (await response.json()) as Org[];
  return rows[0] ?? null;
}

async function getRecentNewsItems(
  env: ReturnType<typeof readEnvironment>,
  orgId: string,
): Promise<NewsItem[]> {
  const select = [
    "id",
    "source",
    "source_url",
    "headline",
    "topic",
    "priority",
    "is_urgent",
    "published_at",
    "created_at",
    "snippet",
    "ai_summary",
    "ai_why_relevant",
    "ai_next_steps",
  ].join(",");
  const url = [
    `${env.supabaseUrl}/rest/v1/news_items?org_id=eq.${encodeURIComponent(orgId)}`,
    `select=${select}`,
    `or=${encodeURIComponent(recentNewsFilter())}`,
    "order=published_at.desc.nullslast,created_at.desc",
    `limit=${MAX_DIGEST_ITEMS}`,
  ].join("&");
  const response = await serviceRoleFetch(env, url);

  if (!response.ok) {
    throw new HttpError(500, "Could not load news items for digest.");
  }

  return ((await response.json()) as NewsItem[]).filter(isRecentNewsItem);
}

function recentNewsFilter() {
  const cutoff = new Date(Date.now() - NEWS_MAX_AGE_DAYS * 86_400_000).toISOString();
  return `(published_at.gte.${cutoff},and(published_at.is.null,created_at.gte.${cutoff}))`;
}

function isRecentNewsItem(item: Pick<NewsItem, "published_at" | "created_at">) {
  const value = item.published_at || item.created_at;
  if (!value) return false;

  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return false;

  return time >= Date.now() - NEWS_MAX_AGE_DAYS * 86_400_000;
}

async function generateDigest(
  env: ReturnType<typeof readEnvironment>,
  org: Org,
  preferences: NewsPreferences,
  items: NewsItem[],
): Promise<DigestResult> {
  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.openAiModel,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildInstructions(org, preferences),
            },
            {
              type: "input_text",
              text: JSON.stringify({
                articles: items.map((item) => ({
                  id: item.id,
                  headline: safeString(item.headline),
                  source: safeString(item.source),
                  topic: safeString(item.topic),
                  priority: safeString(item.priority),
                  isUrgent: Boolean(item.is_urgent),
                  publishedAt: safeString(item.published_at),
                  snippet: truncate(safeString(item.snippet), MAX_TEXT_LENGTH),
                  aiSummary: truncate(safeString(item.ai_summary), MAX_TEXT_LENGTH),
                  aiWhyRelevant: truncate(safeString(item.ai_why_relevant), MAX_TEXT_LENGTH),
                  aiNextSteps: Array.isArray(item.ai_next_steps) ? item.ai_next_steps.slice(0, 3) : [],
                  sourceUrl: safeString(item.source_url),
                })),
              }),
            },
          ],
        },
      ],
      temperature: 0.2,
      max_output_tokens: 4_000,
      text: {
        format: {
          type: "json_schema",
          name: "canopy_news_digest",
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  });

  if (!openAiResponse.ok) {
    const detail = await openAiResponse.text();
    console.error("OpenAI news digest error", detail);
    throw new HttpError(502, "OpenAI could not generate the news digest right now.");
  }

  const parsed = parseJsonObject(extractOutputText(await openAiResponse.json()));

  return {
    title: asNonEmptyString(parsed.title, "Daily digest"),
    overview: asNonEmptyString(parsed.overview, "No digest overview returned."),
    urgentDevelopments: parseStringArray(parsed.urgentDevelopments, 4),
    prepareFor: parseStringArray(parsed.prepareFor, 5),
    opportunities: parseStringArray(parsed.opportunities, 4),
    articleCount: items.length,
    generatedAt: new Date().toISOString(),
    warnings: parseStringArray(parsed.warnings, 5),
  };
}

function buildInstructions(org: Org, preferences: NewsPreferences) {
  return [
    "You are Canopy's daily news digest analyst for small NGOs operating in Africa.",
    "Use only the supplied article metadata and existing AI summaries. Do not claim to have read full articles.",
    `Organization: ${org.name}.`,
    `Monitored countries: ${preferences.countries.join(", ") || "none configured"}.`,
    `Monitored topics: ${preferences.topics.join(", ") || "none configured"}.`,
    "Produce a practical daily digest: what is happening, why it matters, and what the NGO should prepare for.",
    "Focus on operational relevance: program risks, legal/policy changes, health/crisis signals, funding or partnership openings, and communications needs.",
    "Keep it concise and executive-readable for an NGO worker with limited time.",
    "Return only valid JSON matching the schema.",
  ].join("\n");
}

function normalizeNewsPreferences(org: Org): NewsPreferences {
  return {
    countries: cleanList(org.news_countries, org.country ? [org.country] : []),
    topics: cleanList(org.news_topics, org.topics ?? []),
    languages: cleanList(org.news_languages, org.languages ?? []),
    trustedDomains: cleanDomains(org.trusted_news_domains ?? []),
  };
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

function extractOutputText(data: unknown): string {
  if (data && typeof data === "object" && "output_text" in data) {
    const outputText = (data as { output_text?: unknown }).output_text;
    if (typeof outputText === "string" && outputText.trim()) return outputText;
  }

  const output = (data as { output?: Array<{ content?: Array<{ text?: unknown }> }> })?.output;
  const text = output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((value): value is string => typeof value === "string")
    .join("\n");

  if (!text?.trim()) {
    throw new HttpError(502, "OpenAI returned an empty digest.");
  }

  return text;
}

function parseJsonObject(rawText: string): Record<string, unknown> {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    throw new HttpError(502, "OpenAI returned the news digest in an unexpected format.");
  }
}

function cleanList(primary: string[] | null, fallback: string[]) {
  const source = primary && primary.length > 0 ? primary : fallback;
  return Array.from(
    new Set(source.map((value) => value.trim()).filter((value) => value.length > 0)),
  );
}

function cleanDomains(values: string[]) {
  return values
    .map((value) => value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, ""))
    .map((value) => value.split("/")[0])
    .filter(Boolean);
}

function asNonEmptyString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function parseStringArray(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .map((item) => truncate(item, 280))
    .slice(0, limit);
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
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
