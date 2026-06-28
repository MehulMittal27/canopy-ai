const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type FundingPriority = "red" | "amber" | "green";
type FundingEligibility = "yes" | "check" | "no";

type Org = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  languages: string[] | null;
  topics: string[] | null;
};

type FundingOpportunity = {
  id: string;
  funder: string | null;
  title: string | null;
  amount_min: number | null;
  amount_max: number | null;
  amount_currency: string | null;
  deadline: string | null;
  match_score: number | null;
  description: string | null;
  url: string | null;
  source_type: string | null;
  source_url: string | null;
  published_date: string | null;
  raw_text: string | null;
  title_original: string | null;
  title_de: string | null;
  lang_original: string | null;
  summary_de: string | null;
  topics: string[] | null;
  funders: string[] | null;
  eligibility: FundingEligibility | null;
  eligibility_reason: string | null;
  ai_processed_at: string | null;
};

type Analysis = {
  id: string;
  title_de: string;
  summary_de: string;
  deadline: string | null;
  amount_min: number | null;
  amount_max: number | null;
  amount_currency: string | null;
  topics: string[];
  funders: string[];
  own_contribution_required: boolean | null;
  nrw_required: boolean | null;
  applies_from_burundi_ok: boolean | null;
  eligibility: FundingEligibility;
  eligibility_reason: string;
  match_score: number;
  classification_reason: string;
};

type AnalyzeResult = {
  processed: number;
  updated: number;
  skipped: number;
  warnings: string[];
};

type AnalyzeRequest = {
  opportunityId: string | null;
};

const MAX_ITEMS_PER_RUN = 12;
const MAX_TEXT_LENGTH = 2_600;
const DEFAULT_MODEL = "gpt-4o-mini";

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
          id: { type: "string" },
          title_de: { type: "string" },
          summary_de: { type: "string" },
          deadline: { type: ["string", "null"] },
          amount_min: { type: ["integer", "null"] },
          amount_max: { type: ["integer", "null"] },
          amount_currency: { type: ["string", "null"] },
          topics: { type: "array", items: { type: "string" } },
          funders: { type: "array", items: { type: "string" } },
          own_contribution_required: { type: ["boolean", "null"] },
          nrw_required: { type: ["boolean", "null"] },
          applies_from_burundi_ok: { type: ["boolean", "null"] },
          eligibility: { type: "string", enum: ["yes", "check", "no"] },
          eligibility_reason: { type: "string" },
          match_score: { type: "integer" },
          classification_reason: { type: "string" },
        },
        required: [
          "id",
          "title_de",
          "summary_de",
          "deadline",
          "amount_min",
          "amount_max",
          "amount_currency",
          "topics",
          "funders",
          "own_contribution_required",
          "nrw_required",
          "applies_from_burundi_ok",
          "eligibility",
          "eligibility_reason",
          "match_score",
          "classification_reason",
        ],
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
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

    const items = payload.opportunityId
      ? await getSingleOpportunityToAnalyze(env, org.id, payload.opportunityId)
      : await getOpportunitiesToAnalyze(env, org.id);

    if (items.length === 0) {
      return jsonResponse({
        processed: 0,
        updated: 0,
        skipped: 0,
        warnings: ["Funding opportunities have already been analyzed."],
      } satisfies AnalyzeResult);
    }

    const result = await analyzeOpportunities(env, org, items);
    return jsonResponse(result);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unexpected funding analysis failure.";

    if (status >= 500) {
      console.error("analyze-funding failed", error);
    }

    return jsonResponse({ error: message }, status);
  }
});

function readEnvironment() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
  const openAiModel = Deno.env.get("OPENAI_FUNDING_MODEL")?.trim() || DEFAULT_MODEL;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new HttpError(500, "Supabase function environment is missing required keys.");
  }

  if (!openAiApiKey) {
    throw new HttpError(500, "OpenAI API key is not configured for funding analysis.");
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    openAiApiKey,
    openAiModel,
  };
}

async function readAnalyzeRequest(req: Request): Promise<AnalyzeRequest> {
  const text = await req.text();
  if (!text.trim()) return { opportunityId: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (_error) {
    throw new HttpError(400, "Invalid funding analysis request.");
  }

  if (!parsed || typeof parsed !== "object") return { opportunityId: null };

  const opportunityId = (parsed as { opportunityId?: unknown }).opportunityId;
  if (opportunityId == null || opportunityId === "") return { opportunityId: null };

  if (typeof opportunityId !== "string" || !/^[0-9a-f-]{36}$/i.test(opportunityId)) {
    throw new HttpError(400, "Invalid funding opportunity id.");
  }

  return { opportunityId };
}

async function requireAuthenticatedUser(
  req: Request,
  env: ReturnType<typeof readEnvironment>,
): Promise<string> {
  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "You must be signed in to analyze funding opportunities.");
  }

  const response = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: env.supabaseAnonKey,
    },
  });

  if (!response.ok) {
    throw new HttpError(401, "Your session expired. Please sign in again.");
  }

  const user = await response.json();
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
  const select = ["id", "name", "slug", "country", "languages", "topics"].join(",");
  const url = `${env.supabaseUrl}/rest/v1/orgs?admin_user_id=eq.${encodeURIComponent(
    userId,
  )}&select=${select}&limit=1`;
  const response = await serviceRoleFetch(env, url);

  if (!response.ok) {
    throw new HttpError(500, "Could not load organization for funding analysis.");
  }

  const rows = (await response.json()) as Org[];
  return rows[0] ?? null;
}

function fundingOpportunitySelect() {
  return [
    "id",
    "funder",
    "title",
    "amount_min",
    "amount_max",
    "amount_currency",
    "deadline",
    "match_score",
    "description",
    "url",
    "source_type",
    "source_url",
    "published_date",
    "raw_text",
    "title_original",
    "title_de",
    "lang_original",
    "summary_de",
    "topics",
    "funders",
    "eligibility",
    "eligibility_reason",
    "ai_processed_at",
  ].join(",");
}

async function getSingleOpportunityToAnalyze(
  env: ReturnType<typeof readEnvironment>,
  orgId: string,
  opportunityId: string,
): Promise<FundingOpportunity[]> {
  const url = [
    `${env.supabaseUrl}/rest/v1/funding_opportunities?org_id=eq.${encodeURIComponent(orgId)}`,
    `id=eq.${encodeURIComponent(opportunityId)}`,
    `select=${fundingOpportunitySelect()}`,
    "limit=1",
  ].join("&");
  const response = await serviceRoleFetch(env, url);

  if (!response.ok) {
    throw new HttpError(500, "Could not load the selected funding opportunity for analysis.");
  }

  const rows = (await response.json()) as FundingOpportunity[];
  if (rows.length === 0) {
    throw new HttpError(404, "That funding opportunity could not be found for your organization.");
  }

  return rows;
}

async function getOpportunitiesToAnalyze(
  env: ReturnType<typeof readEnvironment>,
  orgId: string,
): Promise<FundingOpportunity[]> {
  const url = [
    `${env.supabaseUrl}/rest/v1/funding_opportunities?org_id=eq.${encodeURIComponent(orgId)}`,
    `select=${fundingOpportunitySelect()}`,
    "order=deadline.asc.nullslast,created_at.desc",
    "limit=60",
  ].join("&");
  const response = await serviceRoleFetch(env, url);

  if (!response.ok) {
    throw new HttpError(500, "Could not load funding opportunities for analysis.");
  }

  const rows = (await response.json()) as FundingOpportunity[];
  return rows
    .filter((item) => !item.ai_processed_at || !item.summary_de?.trim() || !item.eligibility)
    .slice(0, MAX_ITEMS_PER_RUN);
}

async function analyzeOpportunities(
  env: ReturnType<typeof readEnvironment>,
  org: Org,
  items: FundingOpportunity[],
): Promise<AnalyzeResult> {
  const parsed = await callOpenAI(env, org, items);
  const validIds = new Set(items.map((item) => item.id));
  const analyses = parseAnalyses(parsed, validIds);
  const warnings = parseWarnings(parsed);
  let updated = 0;
  let skipped = 0;

  for (const analysis of analyses) {
    const source = items.find((item) => item.id === analysis.id);
    if (!source) {
      skipped += 1;
      continue;
    }

    if (await updateFundingAnalysis(env, org.id, source, sanitizeAnalysis(source, analysis), env.openAiModel)) {
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  const missing = items.length - analyses.length;
  if (missing > 0) {
    skipped += missing;
    warnings.push(`${missing} funding item(s) were not returned by the AI analysis.`);
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
  items: FundingOpportunity[],
) {
  const response = await fetch("https://api.openai.com/v1/responses", {
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
              text: buildInstructions(org),
            },
            {
              type: "input_text",
              text: JSON.stringify({
                opportunities: items.map((item) => ({
                  id: item.id,
                  funder: safeString(item.funder),
                  title: safeString(item.title_original || item.title),
                  currentGermanTitle: safeString(item.title_de),
                  sourceUrl: safeString(item.source_url || item.url),
                  publishedDate: safeString(item.published_date),
                  knownDeadline: safeString(item.deadline),
                  knownAmountMin: item.amount_min,
                  knownAmountMax: item.amount_max,
                  knownCurrency: safeString(item.amount_currency),
                  existingTopics: item.topics ?? [],
                  rawText: truncate(
                    safeString(item.raw_text || item.description || item.title || ""),
                    MAX_TEXT_LENGTH,
                  ),
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
          name: "canopy_funding_analysis",
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("OpenAI funding analysis error", detail);
    throw new HttpError(502, "OpenAI could not analyze funding opportunities right now.");
  }

  const data = await response.json();
  return parseJsonObject(extractOutputText(data));
}

function buildInstructions(org: Org) {
  const orgProfile =
    org.slug === "burundi-kids"
      ? [
          "Organization profile: Burundi Kids e.V. is a German charitable association registered in Cologne/NRW.",
          "It supports education, vocational training, health, child protection, girls' and women's rights, GBV prevention, rural development and environment work in Burundi.",
          "It works through local partner Fondation Stamm in Burundi. It can usually satisfy local-partner requirements, but large EU/PADOR/consortium processes are risky and should be marked check.",
          "It is a small-to-medium NGO; typical ideal project size is EUR 20k-500k.",
        ].join(" ")
      : [
          `Organization profile: ${org.name}.`,
          `Country/context: ${org.country ?? "not configured"}.`,
          `Topics: ${(org.topics ?? []).join(", ") || "not configured"}.`,
        ].join(" ");

  return [
    "You are Canopy's funding analyst for small NGOs.",
    orgProfile,
    "Analyze only the supplied funding text and metadata. Do not invent dates or amounts.",
    "Translate the title and write the summary in German regardless of source language.",
    "Use null for missing deadlines, amounts, currencies and boolean requirements.",
    "Eligibility values: yes means the organization clearly qualifies; check means plausible but a blocking detail, consortium, own contribution, geography or applicant restriction needs review; no means clearly ineligible or not a project grant.",
    "Priority is not returned directly. We will compute red/amber/green from eligibility, deadline and match score.",
    "For nomination-only awards, recognition prizes, tenders unrelated to NGO project funding, or unrelated themes, return eligibility no and a low match score.",
    "Return every supplied id exactly once as strict JSON matching the schema.",
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
    const eligibility = parseEligibility(row.eligibility);
    const titleDe = asNonEmptyString(row.title_de);
    const summaryDe = asNonEmptyString(row.summary_de);
    const eligibilityReason = asNonEmptyString(row.eligibility_reason);
    const classificationReason = asNonEmptyString(row.classification_reason);
    const matchScore = clampScore(row.match_score);

    if (
      !id ||
      !validIds.has(id) ||
      seen.has(id) ||
      !eligibility ||
      !titleDe ||
      !summaryDe ||
      !eligibilityReason
    ) {
      continue;
    }

    result.push({
      id,
      title_de: truncate(titleDe, 240),
      summary_de: truncate(summaryDe, 1_000),
      deadline: parseNullableDate(row.deadline),
      amount_min: asNullableInteger(row.amount_min),
      amount_max: asNullableInteger(row.amount_max),
      amount_currency: asNullableString(row.amount_currency, 12),
      topics: asStringArray(row.topics, 8),
      funders: asStringArray(row.funders, 6),
      own_contribution_required: asNullableBoolean(row.own_contribution_required),
      nrw_required: asNullableBoolean(row.nrw_required),
      applies_from_burundi_ok: asNullableBoolean(row.applies_from_burundi_ok),
      eligibility,
      eligibility_reason: truncate(eligibilityReason, 600),
      match_score: matchScore,
      classification_reason: truncate(classificationReason || "AI funding classification.", 600),
    });
    seen.add(id);
  }

  return result;
}

function sanitizeAnalysis(source: FundingOpportunity, analysis: Analysis): Analysis {
  const rawText = `${source.raw_text ?? ""}\n${source.description ?? ""}\n${source.title ?? ""}`;
  const deadline = analysis.deadline && appearsInSource(rawText, analysis.deadline)
    ? analysis.deadline
    : source.deadline;

  return {
    ...analysis,
    deadline,
    amount_min: keepAmountIfCredible(rawText, analysis.amount_min, source.amount_min),
    amount_max: keepAmountIfCredible(rawText, analysis.amount_max, source.amount_max),
    amount_currency: analysis.amount_currency || source.amount_currency || "EUR",
    topics: analysis.topics.length > 0 ? analysis.topics : source.topics ?? [],
    funders: analysis.funders.length > 0 ? analysis.funders : source.funders ?? [],
  };
}

async function updateFundingAnalysis(
  env: ReturnType<typeof readEnvironment>,
  orgId: string,
  source: FundingOpportunity,
  analysis: Analysis,
  model: string,
) {
  const priority = priorityFor(analysis.eligibility, analysis.deadline, analysis.match_score);
  const response = await serviceRoleFetch(
    env,
    `${env.supabaseUrl}/rest/v1/funding_opportunities?id=eq.${encodeURIComponent(
      analysis.id,
    )}&org_id=eq.${encodeURIComponent(orgId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        title: analysis.title_de,
        title_de: analysis.title_de,
        summary_de: analysis.summary_de,
        description: analysis.summary_de,
        deadline: analysis.deadline,
        amount_min: analysis.amount_min,
        amount_max: analysis.amount_max,
        amount_currency: analysis.amount_currency,
        topics: analysis.topics,
        funders: analysis.funders,
        eligibility: analysis.eligibility,
        eligibility_reason: analysis.eligibility_reason,
        match_score: analysis.match_score,
        priority,
        classification_reason: analysis.classification_reason,
        own_contribution_required: analysis.own_contribution_required,
        nrw_required: analysis.nrw_required,
        applies_from_burundi_ok: analysis.applies_from_burundi_ok,
        ai_processed_at: new Date().toISOString(),
        ai_model: model,
        url: source.source_url || source.url,
      }),
    },
  );

  if (!response.ok) {
    console.error("Could not update funding analysis", response.status, await response.text());
  }

  return response.ok;
}

function priorityFor(
  eligibility: FundingEligibility,
  deadline: string | null,
  matchScore: number,
): FundingPriority {
  const days = deadline ? daysUntil(deadline) : null;
  if (eligibility !== "no" && days !== null && days >= 0 && days <= 14) return "red";
  if (eligibility === "yes" || matchScore >= 70) return "amber";
  return "green";
}

function daysUntil(value: string) {
  const deadline = new Date(`${value}T23:59:59Z`).getTime();
  if (!Number.isFinite(deadline)) return null;
  return Math.ceil((deadline - Date.now()) / 86_400_000);
}

function parseWarnings(parsed: Record<string, unknown>) {
  if (!Array.isArray(parsed.warnings)) return [];
  return parsed.warnings
    .map((warning) => asNonEmptyString(warning))
    .filter(Boolean)
    .map((warning) => truncate(warning, 240));
}

function parseEligibility(value: unknown): FundingEligibility | null {
  if (value === "yes" || value === "check" || value === "no") return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "yes" || normalized === "check" || normalized === "no") return normalized;
  return null;
}

function parseNullableDate(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) ? value : null;
}

function appearsInSource(rawText: string, date: string) {
  if (!rawText.trim()) return true;
  const [year, month, day] = date.split("-");
  const variants = [
    date,
    `${day}.${month}.${year}`,
    `${day}/${month}/${year}`,
    `${Number(day)}.${Number(month)}.${year}`,
    `${Number(day)}/${Number(month)}/${year}`,
  ];
  return variants.some((variant) => rawText.includes(variant));
}

function keepAmountIfCredible(rawText: string, value: number | null, fallback: number | null) {
  if (value == null) return fallback;
  if (!rawText.trim()) return value;
  const compact = rawText.replace(/[.,\s]/g, "");
  const rawValue = String(value);
  if (compact.includes(rawValue)) return value;
  if (value >= 1_000 && compact.includes(String(Math.round(value / 1_000)))) return value;
  return fallback;
}

function clampScore(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function asNullableInteger(value: unknown) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function asNullableBoolean(value: unknown) {
  if (value === true || value === false) return value;
  return null;
}

function asNullableString(value: unknown, maxLength: number) {
  if (value == null) return null;
  return asNonEmptyString(value).slice(0, maxLength) || null;
}

function asStringArray(value: unknown, maxItems: number) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(asNonEmptyString).filter(Boolean))]
    .map((item) => truncate(item, 80))
    .slice(0, maxItems);
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
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
    throw new HttpError(502, "OpenAI returned an empty funding analysis.");
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
    throw new HttpError(502, "OpenAI returned funding analysis in an unexpected format.");
  }
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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
