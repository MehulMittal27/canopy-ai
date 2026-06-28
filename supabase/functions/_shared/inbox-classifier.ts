export type Priority = "red" | "amber" | "green";
export type Confidence = "high" | "medium" | "low";

export interface OrgContext {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  languages: string[] | null;
  topics: string[] | null;
}

export interface ClassifierRequest {
  orgId: string;
  title: string;
  source: string;
  body?: string;
  summary?: string;
  receivedAt?: string;
}

export interface ClassificationResult {
  title: string;
  source: string;
  summary: string;
  why_relevant: string;
  full_summary: string;
  next_steps: string[];
  priority: Priority;
  tags: string[];
  item_date: string;
  classification_reason: string;
  confidence: Confidence;
  used_model: boolean;
}

interface RuleClassification {
  priority: Priority;
  reason: string;
  confidence: Confidence;
  tags: string[];
  shouldUseModel: boolean;
}

export class ClassifierError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    source: { type: "string" },
    summary: { type: "string" },
    why_relevant: { type: "string" },
    full_summary: { type: "string" },
    next_steps: { type: "array", items: { type: "string" } },
    priority: { type: "string", enum: ["red", "amber", "green"] },
    tags: { type: "array", items: { type: "string" } },
    item_date: { type: "string" },
    classification_reason: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: [
    "title",
    "source",
    "summary",
    "why_relevant",
    "full_summary",
    "next_steps",
    "priority",
    "tags",
    "item_date",
    "classification_reason",
    "confidence",
  ],
};

export async function classifyInboxContent(
  payload: ClassifierRequest,
  org: OrgContext,
): Promise<ClassificationResult> {
  const rule = classifyWithRules(payload, org);

  if (!rule.shouldUseModel) {
    return buildRuleResult(payload, org, rule);
  }

  return classifyWithOpenAI(payload, org, rule);
}

function classifyWithRules(payload: ClassifierRequest, org: OrgContext): RuleClassification {
  const text = `${payload.title}\n${payload.summary ?? ""}\n${payload.body ?? ""}`;
  const normalized = text.toLowerCase();
  const tags = extractTags(normalized, org);
  const receivedAt = parseDate(payload.receivedAt) ?? new Date();
  const deadline = extractDeadline(normalized, receivedAt);

  if (hasAny(normalized, SAFETY_TERMS)) {
    return confident("red", "Safety or security language indicates action may be required.", [
      ...tags,
      "security",
    ]);
  }

  if (hasAny(normalized, COMPLIANCE_TERMS)) {
    return confident("red", "Compliance or legal language indicates action may be required.", [
      ...tags,
      "compliance",
    ]);
  }

  if (hasAny(normalized, DONOR_REQUEST_TERMS)) {
    return confident("red", "A donor or funder request likely needs direct follow-up.", [
      ...tags,
      "donor",
    ]);
  }

  if (deadline && deadline.daysUntil >= 0 && deadline.daysUntil <= 14) {
    return confident("red", "A deadline within 14 days makes this urgent.", [...tags, "deadline"]);
  }

  if (deadline && hasAny(normalized, FUNDING_TERMS)) {
    return confident("amber", "Funding language includes a deadline, but it is not within 14 days.", [
      ...tags,
      "funding",
    ]);
  }

  if (hasAny(normalized, NEWSLETTER_TERMS) && !hasAny(normalized, ACTION_TERMS)) {
    return confident("green", "Newsletter or general update language appears non-actionable.", tags);
  }

  if (hasAny(normalized, POLICY_TERMS) && isOrgRelevant(normalized, org)) {
    return confident(
      "amber",
      "Policy, law, or sector language appears directly relevant to this organization.",
      tags,
    );
  }

  if (isOrgRelevant(normalized, org) && hasAny(normalized, RELEVANCE_TERMS)) {
    return confident("amber", "The content matches the organization's topics or operating context.", tags);
  }

  if (!isOrgRelevant(normalized, org) && hasAny(normalized, GENERAL_INFO_TERMS)) {
    return confident("green", "The content appears to be broad background information.", tags);
  }

  return {
    priority: "amber",
    reason: "Rules were not confident enough; using model classification.",
    confidence: "low",
    tags,
    shouldUseModel: true,
  };
}

function buildRuleResult(
  payload: ClassifierRequest,
  org: OrgContext,
  rule: RuleClassification,
): ClassificationResult {
  const sourceText = payload.summary || payload.body || payload.title;

  return {
    title: payload.title,
    source: payload.source,
    summary: summarize(sourceText, 260),
    why_relevant: buildWhyRelevant(rule.priority, org, rule.reason),
    full_summary: summarize(payload.body || payload.summary || payload.title, 900),
    next_steps: buildNextSteps(rule.priority),
    priority: rule.priority,
    tags: normalizeTags(rule.tags),
    item_date: toDateOnly(payload.receivedAt),
    classification_reason: rule.reason,
    confidence: rule.confidence,
    used_model: false,
  };
}

async function classifyWithOpenAI(
  payload: ClassifierRequest,
  org: OrgContext,
  rule: RuleClassification,
): Promise<ClassificationResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new ClassifierError(500, "OpenAI API key is not configured for inbox classification.");
  }

  const model = Deno.env.get("OPENAI_CLASSIFIER_MODEL") || "gpt-4o-mini";
  const instructions = buildInstructions(payload, org, rule);

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: instructions }],
        },
      ],
      temperature: 0.1,
      max_output_tokens: 2_000,
      text: {
        format: {
          type: "json_schema",
          name: "canopy_inbox_classification",
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  });

  if (!openAiResponse.ok) {
    const detail = await openAiResponse.text();
    console.error("OpenAI classifier error", detail);
    throw new ClassifierError(502, "OpenAI could not classify this inbox item right now.");
  }

  const data = await openAiResponse.json();
  const parsed = parseJsonObject(extractOutputText(data));

  return {
    title: asNonEmptyString(parsed.title, payload.title),
    source: asNonEmptyString(parsed.source, payload.source),
    summary: asNonEmptyString(parsed.summary, summarize(payload.summary || payload.body || "", 260)),
    why_relevant: asNonEmptyString(parsed.why_relevant, "Relevant to the organization's monitoring topics."),
    full_summary: asNonEmptyString(
      parsed.full_summary,
      summarize(payload.body || payload.summary || payload.title, 900),
    ),
    next_steps: asStringArray(parsed.next_steps, buildNextSteps(asPriority(parsed.priority))),
    priority: asPriority(parsed.priority),
    tags: normalizeTags(asStringArray(parsed.tags, rule.tags)),
    item_date: asDateOnly(parsed.item_date, payload.receivedAt),
    classification_reason: asNonEmptyString(parsed.classification_reason, rule.reason),
    confidence: asConfidence(parsed.confidence),
    used_model: true,
  };
}

function buildInstructions(payload: ClassifierRequest, org: OrgContext, rule: RuleClassification) {
  return [
    "You are Canopy's inbox classifier for small NGOs.",
    "Classify this incoming item into exactly one traffic-light priority.",
    "",
    "Priority model:",
    "- red: urgent or action required. Use for funding calls with near deadlines, donor requests, compliance/legal changes requiring action, safety/security alerts, or time-critical project issues.",
    "- amber: relevant and should be monitored closely. Use for laws, policy, funder announcements, sector updates, or country updates directly affecting the NGO's projects without immediate action.",
    "- green: for information. Use for newsletters, broad sector news, background reading, and non-actionable updates.",
    "",
    "Do not invent facts, deadlines, funders, legal requirements, locations, or names.",
    "Return only valid JSON matching the schema.",
    "",
    `Organization: ${org.name}`,
    `Country: ${org.country ?? "unknown"}`,
    `Topics: ${(org.topics ?? []).join(", ") || "unknown"}`,
    `Languages: ${(org.languages ?? []).join(", ") || "unknown"}`,
    `Rule pre-pass: ${rule.priority} (${rule.confidence}) - ${rule.reason}`,
    "",
    `Received at: ${payload.receivedAt ?? "unknown"}`,
    `Source: ${payload.source}`,
    `Title: ${payload.title}`,
    `Summary: ${payload.summary ?? ""}`,
    `Body: ${payload.body ?? ""}`,
  ].join("\n");
}

const SAFETY_TERMS = [
  "security alert",
  "safety alert",
  "evacuation",
  "violence",
  "armed",
  "attack",
  "clashes",
  "gunfire",
  "flooding",
  "cholera",
  "outbreak",
  "emergency",
];

const COMPLIANCE_TERMS = [
  "compliance",
  "legal requirement",
  "regulation requires",
  "mandatory",
  "must submit",
  "audit",
  "deadline for reporting",
  "policy change requires",
];

const DONOR_REQUEST_TERMS = [
  "donor request",
  "funder request",
  "request for information",
  "please respond",
  "action required",
  "requires your response",
];

const FUNDING_TERMS = [
  "call for proposals",
  "funding call",
  "grant",
  "proposal",
  "application",
  "apply by",
  "deadline",
  "closes",
];

const ACTION_TERMS = [...COMPLIANCE_TERMS, ...DONOR_REQUEST_TERMS, "deadline", "urgent"];

const POLICY_TERMS = [
  "law",
  "policy",
  "regulation",
  "consultation",
  "ministry",
  "government",
  "parliament",
  "bundestag",
  "eu panel",
];

const RELEVANCE_TERMS = [
  "project",
  "programme",
  "program",
  "partner",
  "funder",
  "donor",
  "field",
  "advocacy",
  "education",
  "animal welfare",
  "children",
];

const NEWSLETTER_TERMS = [
  "newsletter",
  "roundup",
  "digest",
  "monthly update",
  "weekly update",
  "background",
];

const GENERAL_INFO_TERMS = ["general", "background", "overview", "newsletter", "roundup"];

function confident(priority: Priority, reason: string, tags: string[]): RuleClassification {
  return {
    priority,
    reason,
    confidence: "high",
    tags,
    shouldUseModel: false,
  };
}

function extractTags(normalized: string, org: OrgContext) {
  const topicTags = (org.topics ?? []).filter((topic) =>
    normalized.includes(topic.toLowerCase().replace(/-/g, " ")),
  );
  const genericTags = [
    hasAny(normalized, FUNDING_TERMS) ? "funding" : "",
    hasAny(normalized, POLICY_TERMS) ? "policy" : "",
    hasAny(normalized, SAFETY_TERMS) ? "safety" : "",
  ].filter(Boolean);

  return normalizeTags([...topicTags, ...genericTags]);
}

function isOrgRelevant(normalized: string, org: OrgContext) {
  const topics = org.topics ?? [];
  const topicHit = topics.some((topic) =>
    normalized.includes(topic.toLowerCase()) ||
    normalized.includes(topic.toLowerCase().replace(/-/g, " ")),
  );
  const countryHit = org.country ? normalized.includes(org.country.toLowerCase()) : false;
  const nameHit = normalized.includes(org.name.toLowerCase()) || normalized.includes(org.slug);

  return topicHit || countryHit || nameHit;
}

function extractDeadline(normalized: string, receivedAt: Date) {
  if (!hasAny(normalized, ["deadline", "due", "apply by", "closes", "submit by"])) return null;

  const isoMatch = normalized.match(/\b(20\d{2})-(0[1-9]|1[0-2])-([0-2]\d|3[01])\b/);
  const slashMatch = normalized.match(/\b([0-2]?\d|3[01])[./]([01]?\d)[./](20\d{2})\b/);
  const relativeMatch = normalized.match(/\b(?:in|within)\s+(\d{1,2})\s+days?\b/);

  let deadline: Date | null = null;
  if (isoMatch) {
    deadline = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00Z`);
  } else if (slashMatch) {
    const day = slashMatch[1].padStart(2, "0");
    const month = slashMatch[2].padStart(2, "0");
    deadline = new Date(`${slashMatch[3]}-${month}-${day}T00:00:00Z`);
  } else if (relativeMatch) {
    deadline = new Date(receivedAt);
    deadline.setUTCDate(deadline.getUTCDate() + Number(relativeMatch[1]));
  }

  if (!deadline || Number.isNaN(deadline.getTime())) return null;

  const start = Date.UTC(
    receivedAt.getUTCFullYear(),
    receivedAt.getUTCMonth(),
    receivedAt.getUTCDate(),
  );
  const end = Date.UTC(deadline.getUTCFullYear(), deadline.getUTCMonth(), deadline.getUTCDate());
  const daysUntil = Math.floor((end - start) / 86_400_000);

  return { deadline, daysUntil };
}

function buildWhyRelevant(priority: Priority, org: OrgContext, reason: string) {
  if (priority === "red") return `${reason} ${org.name} should review this promptly.`;
  if (priority === "amber") return `${reason} This should be monitored by ${org.name}.`;
  return `${reason} This is useful background information for ${org.name}.`;
}

function buildNextSteps(priority: Priority) {
  if (priority === "red") {
    return ["Review immediately", "Assign an owner", "Confirm the required next action"];
  }
  if (priority === "amber") {
    return ["Share with the relevant team lead", "Monitor for follow-up dates", "Save for planning"];
  }
  return ["Save for background reading", "No immediate action needed"];
}

function summarize(value: string, maxLength: number) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function hasAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function parseDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateOnly(value: string | undefined) {
  const date = parseDate(value) ?? new Date();
  return date.toISOString().slice(0, 10);
}

function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8),
    ),
  );
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

  if (!text?.trim()) throw new ClassifierError(502, "OpenAI returned an empty classification.");
  return text;
}

function parseJsonObject(rawText: string): Record<string, unknown> {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_error) {
    throw new ClassifierError(502, "OpenAI returned a classification in an unexpected format.");
  }
}

function asNonEmptyString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const strings = value.filter((item): item is string => typeof item === "string" && !!item.trim());
  return strings.length > 0 ? strings : fallback;
}

function asPriority(value: unknown): Priority {
  return value === "red" || value === "amber" || value === "green" ? value : "amber";
}

function asConfidence(value: unknown): Confidence {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}

function asDateOnly(value: unknown, fallback: string | undefined) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return toDateOnly(fallback);
}
