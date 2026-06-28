import { CURATED_FUNDING_SEEDS, FUNDING_SOURCE_URLS } from "../_shared/funding-sources.ts";
import type { CuratedFundingSeed, FundingPriority } from "../_shared/funding-sources.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Org = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  languages: string[] | null;
  topics: string[] | null;
};

type RefreshRequest = {
  includeLive: boolean;
};

type FundingCandidate = {
  external_id: string;
  source_type: string;
  source_url: string | null;
  funder: string;
  title: string;
  title_original: string | null;
  title_de: string | null;
  lang_original: string | null;
  published_date: string | null;
  deadline: string | null;
  amount_min: number | null;
  amount_max: number | null;
  amount_currency: string | null;
  topics: string[];
  funders: string[];
  eligibility: "yes" | "check" | "no" | null;
  eligibility_reason: string | null;
  match_score: number | null;
  priority: FundingPriority | null;
  summary_de: string | null;
  description: string | null;
  raw_text: string | null;
  own_contribution_required: boolean | null;
  nrw_required: boolean | null;
  applies_from_burundi_ok: boolean | null;
  classification_reason: string | null;
};

type RefreshResult = {
  inserted: number;
  updated: number;
  skipped: number;
  warnings: string[];
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
    const payload = await readRefreshRequest(req);
    const userId = await requireAuthenticatedUser(req, env);
    const org = await getOrgForUser(env, userId);

    if (!org) {
      throw new HttpError(404, "No organization is linked to this account.");
    }

    const warnings: string[] = [];
    const candidates = curatedSeedsForOrg(org);

    if (payload.includeLive) {
      candidates.push(...(await fetchBmzCandidates(warnings)));
      candidates.push(...(await fetchEuCandidates(env, org, warnings)));
    }

    const result = await upsertFundingCandidates(env, org.id, candidates, warnings);
    return jsonResponse(result);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unexpected funding refresh failure.";

    if (status >= 500) {
      console.error("refresh-funding failed", error);
    }

    return jsonResponse({ error: message }, status);
  }
});

function readEnvironment() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const enableEuBulk = Deno.env.get("FUNDING_ENABLE_EU_BULK") === "true";

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new HttpError(500, "Supabase function environment is missing required keys.");
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    enableEuBulk,
  };
}

async function readRefreshRequest(req: Request): Promise<RefreshRequest> {
  const text = await req.text();
  if (!text.trim()) return { includeLive: true };

  try {
    const parsed = JSON.parse(text) as { includeLive?: unknown };
    return { includeLive: parsed.includeLive !== false };
  } catch (_error) {
    throw new HttpError(400, "Invalid funding refresh request.");
  }
}

async function requireAuthenticatedUser(
  req: Request,
  env: ReturnType<typeof readEnvironment>,
): Promise<string> {
  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "You must be signed in to refresh funding opportunities.");
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
    throw new HttpError(500, "Could not load organization for funding refresh.");
  }

  const rows = (await response.json()) as Org[];
  return rows[0] ?? null;
}

function curatedSeedsForOrg(org: Org): FundingCandidate[] {
  return CURATED_FUNDING_SEEDS.filter((seed) => seed.orgSlug === org.slug).map(seedToCandidate);
}

function seedToCandidate(seed: CuratedFundingSeed): FundingCandidate {
  return {
    external_id: seed.externalId,
    source_type: seed.sourceType,
    source_url: seed.sourceUrl,
    funder: seed.funder,
    title: seed.title,
    title_original: seed.titleOriginal,
    title_de: seed.title,
    lang_original: seed.language,
    published_date: seed.publishedDate,
    deadline: seed.deadline,
    amount_min: seed.amountMin,
    amount_max: seed.amountMax,
    amount_currency: seed.amountCurrency,
    topics: seed.topics,
    funders: seed.funders,
    eligibility: seed.eligibility,
    eligibility_reason: seed.eligibilityReason,
    match_score: seed.matchScore,
    priority: seed.priority,
    summary_de: seed.summaryDe,
    description: seed.summaryDe,
    raw_text: seed.rawText,
    own_contribution_required: seed.ownContributionRequired,
    nrw_required: seed.nrwRequired,
    applies_from_burundi_ok: seed.appliesFromBurundiOk,
    classification_reason: "Curated source profile from funding playbook.",
  };
}

async function fetchBmzCandidates(warnings: string[]): Promise<FundingCandidate[]> {
  let xml = "";
  try {
    xml = await fetchTextWithTimeout(FUNDING_SOURCE_URLS.bmzRss, 7_000);
  } catch (error) {
    warnings.push(`BMZ RSS could not be refreshed: ${error instanceof Error ? error.message : "unknown error"}`);
    return [];
  }

  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
    .slice(0, 20)
    .map((match) => parseRssItem(match[1]))
    .filter((item) => item.title && isFundingRelevant(item.title, item.description));

  const candidates: FundingCandidate[] = [];
  for (const item of items.slice(0, 6)) {
    const title = decodeXml(item.title);
    const link = decodeXml(item.link || FUNDING_SOURCE_URLS.bmzRss);
    const description = truncate(stripHtml(decodeXml(item.description || title)), 900);
    const publishedDate = parseDateOnly(item.pubDate);

    candidates.push({
      external_id: await stableExternalId("bmz-rss", link, title),
      source_type: "bmz-rss",
      source_url: link,
      funder: "BMZ",
      title,
      title_original: title,
      title_de: null,
      lang_original: "de",
      published_date: publishedDate,
      deadline: null,
      amount_min: null,
      amount_max: null,
      amount_currency: "EUR",
      topics: inferTopics(`${title} ${description}`),
      funders: ["BMZ"],
      eligibility: null,
      eligibility_reason: null,
      match_score: null,
      priority: "green",
      summary_de: null,
      description,
      raw_text: `${title}\n\n${description}`,
      own_contribution_required: null,
      nrw_required: null,
      applies_from_burundi_ok: null,
      classification_reason: null,
    });
  }

  return candidates;
}

async function fetchEuCandidates(
  env: ReturnType<typeof readEnvironment>,
  org: Org,
  warnings: string[],
): Promise<FundingCandidate[]> {
  if (!env.enableEuBulk) {
    return [];
  }

  let data: unknown;
  try {
    const text = await fetchTextWithTimeout(FUNDING_SOURCE_URLS.euBulkJson, 15_000);
    data = JSON.parse(text);
  } catch (error) {
    warnings.push(`EU bulk funding data could not be refreshed: ${error instanceof Error ? error.message : "unknown error"}`);
    return [];
  }

  const rawItems = extractEuGrantTenderObjects(data);
  const keywords = org.slug === "burundi-kids"
    ? ["burundi", "civil society", "education", "children", "sub-saharan", "africa"]
    : ["animal welfare", "veterinary", "wildlife", "stray", "agriculture"];

  const matches = rawItems
    .filter((item) => hasAnyKeyword(`${item.title} ${item.callTitle} ${item.programme}`, keywords))
    .slice(0, 8);

  return matches.map((item) => {
    const topicId = item.identifier.toLowerCase();
    const sourceUrl = `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${encodeURIComponent(topicId)}`;
    const deadline = item.deadlineDatesLong[0] ? new Date(item.deadlineDatesLong[0]).toISOString().slice(0, 10) : null;

    return {
      external_id: `eu-bulk:${item.identifier || item.callIdentifier}`,
      source_type: "eu-bulk",
      source_url: sourceUrl,
      funder: "EU Funding & Tenders Portal",
      title: item.title || item.callTitle || item.identifier,
      title_original: item.title || item.callTitle || item.identifier,
      title_de: null,
      lang_original: "en",
      published_date: item.plannedOpeningDateLong
        ? new Date(item.plannedOpeningDateLong).toISOString().slice(0, 10)
        : null,
      deadline,
      amount_min: null,
      amount_max: null,
      amount_currency: "EUR",
      topics: inferTopics(`${item.title} ${item.callTitle} ${item.programme}`),
      funders: ["European Union"],
      eligibility: null,
      eligibility_reason: null,
      match_score: null,
      priority: deadline && daysUntil(deadline) <= 14 ? "red" : "green",
      summary_de: null,
      description: item.callTitle || item.programme || "EU funding opportunity.",
      raw_text: JSON.stringify(item).slice(0, 5_000),
      own_contribution_required: null,
      nrw_required: false,
      applies_from_burundi_ok: null,
      classification_reason: null,
    };
  });
}

async function upsertFundingCandidates(
  env: ReturnType<typeof readEnvironment>,
  orgId: string,
  candidates: FundingCandidate[],
  warnings: string[],
): Promise<RefreshResult> {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const existingId = await findExistingFundingOpportunity(env, orgId, candidate);
    const row = toFundingRow(orgId, candidate);

    if (existingId) {
      const response = await serviceRoleFetch(
        env,
        `${env.supabaseUrl}/rest/v1/funding_opportunities?id=eq.${encodeURIComponent(existingId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(row),
        },
      );

      if (response.ok) {
        updated += 1;
      } else {
        skipped += 1;
        warnings.push(`Could not update ${candidate.title}: ${await response.text()}`);
      }
      continue;
    }

    const response = await serviceRoleFetch(env, `${env.supabaseUrl}/rest/v1/funding_opportunities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });

    if (response.ok) {
      inserted += 1;
    } else {
      skipped += 1;
      warnings.push(`Could not insert ${candidate.title}: ${await response.text()}`);
    }
  }

  return {
    inserted,
    updated,
    skipped,
    warnings,
  };
}

async function findExistingFundingOpportunity(
  env: ReturnType<typeof readEnvironment>,
  orgId: string,
  candidate: FundingCandidate,
) {
  const url = [
    `${env.supabaseUrl}/rest/v1/funding_opportunities?select=id`,
    `org_id=eq.${encodeURIComponent(orgId)}`,
    `source_type=eq.${encodeURIComponent(candidate.source_type)}`,
    `external_id=eq.${encodeURIComponent(candidate.external_id)}`,
    "limit=1",
  ].join("&");
  const response = await serviceRoleFetch(env, url);

  if (!response.ok) {
    throw new HttpError(500, "Could not check existing funding opportunities.");
  }

  const rows = (await response.json()) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}

function toFundingRow(orgId: string, candidate: FundingCandidate) {
  return {
    org_id: orgId,
    funder: candidate.funder,
    title: candidate.title_de || candidate.title,
    amount_min: candidate.amount_min,
    amount_max: candidate.amount_max,
    deadline: candidate.deadline,
    match_score: candidate.match_score,
    description: candidate.summary_de || candidate.description,
    url: candidate.source_url,
    external_id: candidate.external_id,
    source_type: candidate.source_type,
    source_url: candidate.source_url,
    published_date: candidate.published_date,
    raw_text: candidate.raw_text,
    title_original: candidate.title_original,
    title_de: candidate.title_de,
    lang_original: candidate.lang_original,
    summary_de: candidate.summary_de,
    topics: candidate.topics,
    funders: candidate.funders,
    eligibility: candidate.eligibility,
    eligibility_reason: candidate.eligibility_reason,
    priority: candidate.priority,
    classification_reason: candidate.classification_reason,
    amount_currency: candidate.amount_currency,
    own_contribution_required: candidate.own_contribution_required,
    nrw_required: candidate.nrw_required,
    applies_from_burundi_ok: candidate.applies_from_burundi_ok,
  };
}

async function fetchTextWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Canopy Funding Monitor/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function parseRssItem(xml: string) {
  return {
    title: getXmlTag(xml, "title"),
    link: getXmlTag(xml, "link"),
    description: getXmlTag(xml, "description"),
    pubDate: getXmlTag(xml, "pubDate"),
  };
}

function getXmlTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return "";
  return match[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function isFundingRelevant(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  return [
    "förder",
    "foerder",
    "finanz",
    "zuschuss",
    "call",
    "ausschreibung",
    "burundi",
    "afrika",
    "bildung",
    "zivilgesellschaft",
  ].some((term) => text.includes(term));
}

function inferTopics(value: string) {
  const text = value.toLowerCase();
  const topics: string[] = [];
  if (hasAnyKeyword(text, ["education", "bildung", "school", "schule"])) topics.push("education");
  if (hasAnyKeyword(text, ["burundi"])) topics.push("burundi");
  if (hasAnyKeyword(text, ["civil society", "zivilgesellschaft"])) topics.push("civil society");
  if (hasAnyKeyword(text, ["children", "kinder", "youth", "jugend"])) topics.push("children");
  if (hasAnyKeyword(text, ["health", "gesundheit"])) topics.push("health");
  if (hasAnyKeyword(text, ["animal", "tier", "welfare", "tierschutz"])) topics.push("animal welfare");
  if (hasAnyKeyword(text, ["funding", "förder", "grant", "zuschuss"])) topics.push("funding");
  return [...new Set(topics)].slice(0, 6);
}

function hasAnyKeyword(value: string, keywords: string[]) {
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function parseDateOnly(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function daysUntil(value: string) {
  const deadline = new Date(`${value}T23:59:59Z`).getTime();
  if (!Number.isFinite(deadline)) return Infinity;
  return Math.ceil((deadline - Date.now()) / 86_400_000);
}

function extractEuGrantTenderObjects(data: unknown): Array<{
  callIdentifier: string;
  identifier: string;
  title: string;
  callTitle: string;
  plannedOpeningDateLong: number | null;
  deadlineDatesLong: number[];
  programme: string;
}> {
  const root = data as {
    fundingData?: {
      GrantTenderObj?: unknown[];
    };
  };
  const rows = Array.isArray(root?.fundingData?.GrantTenderObj)
    ? root.fundingData.GrantTenderObj
    : [];

  return rows.map((row) => {
    const item = row as Record<string, unknown>;
    const programmeDivision = Array.isArray(item.programmeDivision)
      ? item.programmeDivision.map((part) => String(part)).join(" ")
      : "";

    return {
      callIdentifier: safeString(item.callIdentifier),
      identifier: safeString(item.identifier),
      title: safeString(item.title),
      callTitle: safeString(item.callTitle),
      plannedOpeningDateLong: asNumber(item.plannedOpeningDateLong),
      deadlineDatesLong: Array.isArray(item.deadlineDatesLong)
        ? item.deadlineDatesLong.map(asNumber).filter((value): value is number => value !== null)
        : [],
      programme: programmeDivision,
    };
  }).filter((item) => item.identifier || item.callIdentifier);
}

async function stableExternalId(sourceType: string, url: string, title: string) {
  const input = new TextEncoder().encode(`${sourceType}:${url}:${title}`);
  const digest = await crypto.subtle.digest("SHA-1", input);
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `${sourceType}:${hex}`;
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function asNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
