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

type NewsItem = {
  id: string;
  source: string | null;
  source_url: string | null;
  headline: string | null;
  topic: string | null;
  priority: NewsPriority | null;
  is_urgent: boolean | null;
  published_at: string | null;
  snippet: string | null;
  raw_source: string | null;
  created_at: string | null;
  ai_summary: string | null;
  ai_processed_at: string | null;
};

type Analysis = {
  id: string;
  priority: NewsPriority;
  isUrgent: boolean;
  summary: string;
  whyRelevant: string;
  nextSteps: string[];
};

type AnalyzeResult = {
  processed: number;
  updated: number;
  skipped: number;
  warnings: string[];
};

type AnalyzeRequest = {
  itemId: string | null;
};

const MAX_ITEMS_PER_RUN = 20;
const MAX_TEXT_LENGTH = 1_200;
const DEFAULT_MODEL = "gpt-4o";
const NEWS_MAX_AGE_DAYS = 14;

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    analyses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            type: "string",
            description: "The exact news_items.id supplied for this article.",
          },
          priority: {
            type: "string",
            enum: ["red", "amber", "green"],
            description: "Traffic-light priority for the NGO.",
          },
          isUrgent: {
            type: "boolean",
            description: "True when immediate attention is warranted.",
          },
          summary: {
            type: "string",
            description: "A neutral 1-2 sentence summary of the article.",
          },
          whyRelevant: {
            type: "string",
            description: "Why this item matters to the NGO's work.",
          },
          nextSteps: {
            type: "array",
            items: { type: "string" },
            description: "One to three practical next steps for the NGO.",
          },
        },
        required: ["id", "priority", "isUrgent", "summary", "whyRelevant", "nextSteps"],
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      description: "Limitations or caveats for the batch.",
    },
  },
  required: ["analyses", "warnings"],
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
    const payload = await readAnalyzeRequest(req);
    const userId = await requireAuthenticatedUser(req, env);
    const org = await getOrgForUser(env, userId);

    if (!org) {
      throw new HttpError(404, "No organization is linked to this account.");
    }

    const preferences = normalizeNewsPreferences(org);
    const items = payload.itemId
      ? await getSingleItemToAnalyze(env, org.id, payload.itemId)
      : await getItemsToAnalyze(env, org.id);

    if (items.length === 0) {
      return jsonResponse({
        processed: 0,
        updated: 0,
        skipped: 0,
        warnings: ["Recent news items have already been analyzed."],
      } satisfies AnalyzeResult);
    }

    const result = await analyzeItems(env, org, preferences, items);
    return jsonResponse(result);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unexpected news analysis failure.";

    if (status >= 500) {
      console.error("analyze-news failed", error);
    }

    return jsonResponse({ error: message }, status);
  }
});

async function readAnalyzeRequest(req: Request): Promise<AnalyzeRequest> {
  const text = await req.text();
  if (!text.trim()) return { itemId: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (_error) {
    throw new HttpError(400, "Invalid news analysis request.");
  }

  if (!parsed || typeof parsed !== "object") return { itemId: null };

  const itemId = (parsed as { itemId?: unknown }).itemId;
  if (itemId == null || itemId === "") return { itemId: null };

  if (typeof itemId !== "string" || !/^[0-9a-f-]{36}$/i.test(itemId)) {
    throw new HttpError(400, "Invalid news item id.");
  }

  return { itemId };
}

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
    throw new HttpError(500, "OpenAI API key is not configured for news analysis.");
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
    throw new HttpError(401, "You must be signed in to analyze news.");
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
    throw new HttpError(500, "Could not load organization for news analysis.");
  }

  const rows = (await response.json()) as Org[];
  return rows[0] ?? null;
}

function normalizeNewsPreferences(org: Org): NewsPreferences {
  return {
    countries: cleanList(org.news_countries, org.country ? [org.country] : []),
    topics: cleanList(org.news_topics, org.topics ?? []),
    languages: cleanList(org.news_languages, org.languages ?? []),
    trustedDomains: cleanDomains(org.trusted_news_domains ?? []),
  };
}

function newsItemSelect() {
  return [
    "id",
    "source",
    "source_url",
    "headline",
    "topic",
    "priority",
    "is_urgent",
    "published_at",
    "snippet",
    "raw_source",
    "created_at",
    "ai_summary",
    "ai_processed_at",
  ].join(",");
}

async function getSingleItemToAnalyze(
  env: ReturnType<typeof readEnvironment>,
  orgId: string,
  itemId: string,
): Promise<NewsItem[]> {
  const url = [
    `${env.supabaseUrl}/rest/v1/news_items?org_id=eq.${encodeURIComponent(orgId)}`,
    `id=eq.${encodeURIComponent(itemId)}`,
    `select=${newsItemSelect()}`,
    "limit=1",
  ].join("&");
  const response = await serviceRoleFetch(env, url);

  if (!response.ok) {
    throw new HttpError(500, "Could not load the selected news item for analysis.");
  }

  const rows = (await response.json()) as NewsItem[];
  if (rows.length === 0) {
    throw new HttpError(404, "That news item could not be found for your organization.");
  }

  if (!isRecentNewsItem(rows[0])) {
    throw new HttpError(400, "That news item is older than 14 days and cannot be analyzed.");
  }

  return rows;
}

async function getItemsToAnalyze(
  env: ReturnType<typeof readEnvironment>,
  orgId: string,
): Promise<NewsItem[]> {
  const url = [
    `${env.supabaseUrl}/rest/v1/news_items?org_id=eq.${encodeURIComponent(orgId)}`,
    `select=${newsItemSelect()}`,
    `or=${encodeURIComponent(recentNewsFilter())}`,
    "order=published_at.desc.nullslast,created_at.desc",
    "limit=50",
  ].join("&");
  const response = await serviceRoleFetch(env, url);

  if (!response.ok) {
    throw new HttpError(500, "Could not load news items for analysis.");
  }

  const rows = ((await response.json()) as NewsItem[]).filter(
    (item) => isRecentNewsItem(item) && (!item.ai_processed_at || !item.ai_summary?.trim()),
  );

  return rows.slice(0, MAX_ITEMS_PER_RUN);
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

async function analyzeItems(
  env: ReturnType<typeof readEnvironment>,
  org: Org,
  preferences: NewsPreferences,
  items: NewsItem[],
): Promise<AnalyzeResult> {
  const parsed = await callOpenAI(env, org, preferences, items);
  const validIds = new Set(items.map((item) => item.id));
  const analyses = parseAnalyses(parsed, validIds);
  const warnings = parseWarnings(parsed);
  let updated = 0;
  let skipped = 0;

  for (const analysis of analyses) {
    if (await updateNewsItemAnalysis(env, org.id, analysis, env.openAiModel)) {
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  const missing = items.length - analyses.length;
  if (missing > 0) {
    skipped += missing;
    warnings.push(`${missing} news item(s) were not returned by the AI analysis.`);
  }

  return {
    processed: items.length,
    updated,
    skipped,
    warnings,
  };
}

async function callOpenAI(
  env: ReturnType<typeof readEnvironment>,
  org: Org,
  preferences: NewsPreferences,
  items: NewsItem[],
) {
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
                  sourceUrl: safeString(item.source_url),
                  currentTopic: safeString(item.topic),
                  currentPriority: item.priority ?? "green",
                  isUrgent: Boolean(item.is_urgent),
                  publishedAt: safeString(item.published_at),
                  snippet: truncate(safeString(item.snippet), MAX_TEXT_LENGTH),
                  rawSource: safeString(item.raw_source),
                })),
              }),
            },
          ],
        },
      ],
      temperature: 0.2,
      max_output_tokens: 6_000,
      text: {
        format: {
          type: "json_schema",
          name: "canopy_news_analysis",
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  });

  if (!openAiResponse.ok) {
    const detail = await openAiResponse.text();
    console.error("OpenAI news analysis error", detail);
    throw new HttpError(502, "OpenAI could not analyze news right now.");
  }

  const data = await openAiResponse.json();
  const rawText = extractOutputText(data);
  return parseJsonObject(rawText);
}

function buildInstructions(org: Org, preferences: NewsPreferences) {
  return [
    "You are Canopy's news analyst for small NGOs operating in African countries.",
    "Analyze only the provided metadata: headline, snippet, source, URL, topic, and dates. Do not claim to have read the full article.",
    `Organization: ${org.name}.`,
    `Monitored countries: ${preferences.countries.join(", ") || "none configured"}.`,
    `Monitored topics: ${preferences.topics.join(", ") || "none configured"}.`,
    `Preferred languages: ${preferences.languages.join(", ") || "none configured"}.`,
    `Trusted source domains: ${preferences.trustedDomains.join(", ") || "none configured"}.`,
    "For each article, write a neutral 1-2 sentence summary, an NGO-specific relevance explanation, and 1-3 practical next steps.",
    "Priority rules: red means urgent deadlines, crises, laws, investigations, conflict, disasters, health outbreaks, or direct program risk; amber means relevant to selected countries/topics but not time-critical; green means useful background/context.",
    "Use red sparingly, but do not understate direct operational risk.",
    "Return only valid JSON matching the schema. Include every supplied article id exactly once.",
  ].join("\n");
}

function parseAnalyses(parsed: Record<string, unknown>, validIds: Set<string>): Analysis[] {
  const raw = Array.isArray(parsed.analyses) ? parsed.analyses : [];
  const result: Analysis[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = asNonEmptyString(row.id);
    const priority = parsePriority(row.priority);
    const summary = asNonEmptyString(row.summary);
    const whyRelevant = asNonEmptyString(row.whyRelevant);
    const nextSteps = Array.isArray(row.nextSteps)
      ? row.nextSteps.map((step) => asNonEmptyString(step)).filter(Boolean).slice(0, 3)
      : [];

    if (!id || !validIds.has(id) || seen.has(id) || !priority || !summary || !whyRelevant) {
      continue;
    }

    result.push({
      id,
      priority,
      isUrgent: Boolean(row.isUrgent) || priority === "red",
      summary: truncate(summary, 900),
      whyRelevant: truncate(whyRelevant, 900),
      nextSteps: nextSteps.length > 0 ? nextSteps.map((step) => truncate(step, 240)) : ["Review source article."],
    });
    seen.add(id);
  }

  return result;
}

function parseWarnings(parsed: Record<string, unknown>) {
  if (!Array.isArray(parsed.warnings)) return [];
  return parsed.warnings
    .map((warning) => asNonEmptyString(warning))
    .filter(Boolean)
    .map((warning) => truncate(warning, 240));
}

async function updateNewsItemAnalysis(
  env: ReturnType<typeof readEnvironment>,
  orgId: string,
  analysis: Analysis,
  model: string,
) {
  const response = await serviceRoleFetch(
    env,
    `${env.supabaseUrl}/rest/v1/news_items?id=eq.${encodeURIComponent(
      analysis.id,
    )}&org_id=eq.${encodeURIComponent(orgId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        ai_summary: analysis.summary,
        ai_why_relevant: analysis.whyRelevant,
        ai_next_steps: analysis.nextSteps,
        ai_priority: analysis.priority,
        ai_processed_at: new Date().toISOString(),
        ai_model: model,
        priority: analysis.priority,
        is_urgent: analysis.isUrgent,
      }),
    },
  );

  if (!response.ok) {
    console.error("Could not update news analysis", response.status, await response.text());
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
    throw new HttpError(502, "OpenAI returned an empty news analysis.");
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
    throw new HttpError(502, "OpenAI returned news analysis in an unexpected format.");
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

function parsePriority(value: unknown): NewsPriority | null {
  return value === "red" || value === "amber" || value === "green" ? value : null;
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
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
