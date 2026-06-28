import { supabase } from "@/lib/supabase";

export type FundingPriority = "red" | "amber" | "green";
export type FundingEligibility = "yes" | "check" | "no";

export type FundingOpportunity = {
  id: string;
  org_id: string;
  funder: string | null;
  title: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  match_score: number | null;
  description: string | null;
  url: string | null;
  created_at: string | null;
  external_id?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  published_date?: string | null;
  raw_text?: string | null;
  title_original?: string | null;
  title_de?: string | null;
  lang_original?: string | null;
  summary_de?: string | null;
  topics?: string[] | null;
  funders?: string[] | null;
  eligibility?: FundingEligibility | null;
  eligibility_reason?: string | null;
  priority?: FundingPriority | null;
  classification_reason?: string | null;
  ai_processed_at?: string | null;
  ai_model?: string | null;
  amount_currency?: string | null;
  own_contribution_required?: boolean | null;
  nrw_required?: boolean | null;
  applies_from_burundi_ok?: boolean | null;
};

export type RefreshFundingResult = {
  inserted: number;
  updated: number;
  skipped: number;
  warnings: string[];
};

export type AnalyzeFundingResult = {
  processed: number;
  updated: number;
  skipped: number;
  warnings: string[];
};

export const FUNDING_QUERY_KEY = ["funding_opportunities"] as const;

const BASE_FUNDING_COLUMNS =
  "id, org_id, funder, title, amount_min, amount_max, deadline, match_score, description, url, created_at";

const EXTENDED_FUNDING_COLUMNS = [
  BASE_FUNDING_COLUMNS,
  "external_id",
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
  "priority",
  "classification_reason",
  "ai_processed_at",
  "ai_model",
  "amount_currency",
  "own_contribution_required",
  "nrw_required",
  "applies_from_burundi_ok",
].join(", ");

const PRIORITY_RANK: Record<FundingPriority, number> = {
  red: 0,
  amber: 1,
  green: 2,
};

const ELIGIBILITY_RANK: Record<FundingEligibility, number> = {
  yes: 0,
  check: 1,
  no: 2,
};

export async function getFundingOpportunities(): Promise<FundingOpportunity[]> {
  const { data, error } = await selectFundingOpportunities(EXTENDED_FUNDING_COLUMNS);

  if (error && isMissingFundingColumnError(error)) {
    const fallback = await selectFundingOpportunities(BASE_FUNDING_COLUMNS);
    if (fallback.error) throw fallback.error;
    return sortFundingOpportunities((fallback.data ?? []) as unknown as FundingOpportunity[]);
  }

  if (error) throw error;
  return sortFundingOpportunities((data ?? []) as unknown as FundingOpportunity[]);
}

export async function refreshFundingOpportunities(
  includeLive = true,
): Promise<RefreshFundingResult> {
  const { data, error } = await supabase.functions.invoke<RefreshFundingResult>("refresh-funding", {
    method: "POST",
    body: { includeLive },
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  return normalizeRefreshResult(data);
}

export async function analyzeFundingOpportunities(): Promise<AnalyzeFundingResult> {
  const { data, error } = await supabase.functions.invoke<AnalyzeFundingResult>("analyze-funding", {
    method: "POST",
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  return normalizeAnalyzeResult(data);
}

export async function analyzeFundingOpportunity(
  opportunityId: string,
): Promise<AnalyzeFundingResult> {
  const { data, error } = await supabase.functions.invoke<AnalyzeFundingResult>("analyze-funding", {
    method: "POST",
    body: { opportunityId },
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  return normalizeAnalyzeResult(data);
}

export function sortFundingOpportunities(
  opportunities: readonly FundingOpportunity[],
): FundingOpportunity[] {
  return [...opportunities].sort((a, b) => {
    const priorityDiff =
      PRIORITY_RANK[getFundingPriority(a)] - PRIORITY_RANK[getFundingPriority(b)];
    if (priorityDiff !== 0) return priorityDiff;

    const deadlineDiff = deadlineMs(a) - deadlineMs(b);
    if (deadlineDiff !== 0) return deadlineDiff;

    const eligibilityDiff =
      ELIGIBILITY_RANK[getFundingEligibility(a)] - ELIGIBILITY_RANK[getFundingEligibility(b)];
    if (eligibilityDiff !== 0) return eligibilityDiff;

    const matchDiff = Number(b.match_score ?? 0) - Number(a.match_score ?? 0);
    if (matchDiff !== 0) return matchDiff;

    return dateMs(b.published_date || b.created_at) - dateMs(a.published_date || a.created_at);
  });
}

export function getFundingPriority(
  opportunity: Pick<FundingOpportunity, "priority" | "deadline" | "eligibility" | "match_score">,
): FundingPriority {
  if (
    opportunity.priority === "red" ||
    opportunity.priority === "amber" ||
    opportunity.priority === "green"
  ) {
    return opportunity.priority;
  }

  const eligibility = getFundingEligibility(opportunity);
  const days = daysUntil(opportunity.deadline);
  if (eligibility !== "no" && days !== null && days >= 0 && days <= 14) return "red";
  if (eligibility === "yes" || Number(opportunity.match_score ?? 0) >= 70) return "amber";
  return "green";
}

export function getFundingEligibility(
  opportunity: Pick<FundingOpportunity, "eligibility">,
): FundingEligibility {
  if (
    opportunity.eligibility === "yes" ||
    opportunity.eligibility === "check" ||
    opportunity.eligibility === "no"
  ) {
    return opportunity.eligibility;
  }
  return "check";
}

export function daysUntil(deadline: string | null | undefined): number | null {
  if (!deadline) return null;
  const date = new Date(`${deadline}T23:59:59`);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

function selectFundingOpportunities(columns: string) {
  return supabase
    .from("funding_opportunities")
    .select(columns)
    .order("deadline", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
}

function deadlineMs(opportunity: Pick<FundingOpportunity, "deadline">) {
  if (!opportunity.deadline) return Number.POSITIVE_INFINITY;
  const time = new Date(`${opportunity.deadline}T23:59:59`).getTime();
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

function dateMs(value: string | null | undefined) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function normalizeRefreshResult(data: RefreshFundingResult | null | undefined) {
  return {
    inserted: Number(data?.inserted ?? 0),
    updated: Number(data?.updated ?? 0),
    skipped: Number(data?.skipped ?? 0),
    warnings: Array.isArray(data?.warnings) ? data.warnings : [],
  };
}

function normalizeAnalyzeResult(data: AnalyzeFundingResult | null | undefined) {
  return {
    processed: Number(data?.processed ?? 0),
    updated: Number(data?.updated ?? 0),
    skipped: Number(data?.skipped ?? 0),
    warnings: Array.isArray(data?.warnings) ? data.warnings : [],
  };
}

function isMissingFundingColumnError(error: { message?: string; code?: string }) {
  return (
    error.code === "42703" ||
    /external_id|source_type|source_url|published_date|raw_text|title_original|title_de|lang_original|summary_de|topics|funders|eligibility|priority|amount_currency|ai_processed_at/i.test(
      error.message ?? "",
    )
  );
}

async function getFunctionErrorMessage(error: unknown) {
  const maybeContext = error as { context?: Response; message?: string };

  if (maybeContext.context instanceof Response) {
    try {
      const body = (await maybeContext.context.clone().json()) as { error?: string };
      if (body.error) return body.error;
    } catch (_error) {
      // Fall through to the Supabase error message.
    }
  }

  return maybeContext.message || "Funding action failed.";
}
