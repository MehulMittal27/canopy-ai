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

type AssistantRequest = {
  message: string;
  sessionId: string | null;
};

type Citation = {
  title: string | null;
  sourceUri: string | null;
  excerpt: string | null;
};

type RetrievedChunk = {
  text: string;
  title: string | null;
  sourceUri: string | null;
  metadata: Record<string, unknown>;
};

type AwsConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
};

const MAX_MESSAGE_LENGTH = 4_000;
const NUMBER_OF_RESULTS = 20;
const BEDROCK_SIGNING_SERVICE = "bedrock";
const MAX_CONTEXT_CHUNKS = 10;
const MAX_CONTEXT_CHARS_PER_CHUNK = 900;

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

    const metadataNgo = metadataNgoForOrg(org.slug);
    const payload = validatePayload(await req.json());
    const result = await askKnowledgeBase(env, org, metadataNgo, payload);

    return jsonResponse(result);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unexpected assistant failure.";

    if (status >= 500) {
      console.error("bedrock-chat failed", error);
    }

    return jsonResponse({ error: message }, status);
  }
});

function readEnvironment() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const awsRegion = Deno.env.get("BEDROCK_REGION") ?? Deno.env.get("AWS_REGION");
  const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  const awsSessionToken = Deno.env.get("AWS_SESSION_TOKEN") || undefined;
  const bedrockKnowledgeBaseId = Deno.env.get("BEDROCK_KNOWLEDGE_BASE_ID");
  const bedrockModelArn = Deno.env.get("BEDROCK_MODEL_ARN");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new HttpError(500, "Supabase function environment is missing required keys.");
  }

  if (!awsRegion || !awsAccessKeyId || !awsSecretAccessKey) {
    throw new HttpError(
      500,
      "AWS credentials or BEDROCK_REGION are not configured for the assistant.",
    );
  }

  if (!bedrockKnowledgeBaseId || !bedrockModelArn) {
    throw new HttpError(500, "Bedrock knowledge base configuration is missing.");
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    awsRegion,
    awsAccessKeyId,
    awsSecretAccessKey,
    awsSessionToken,
    bedrockKnowledgeBaseId,
    bedrockModelArn,
  };
}

async function requireAuthenticatedUser(
  req: Request,
  env: ReturnType<typeof readEnvironment>,
): Promise<string> {
  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "You must be signed in to use the assistant.");
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
    throw new HttpError(500, "Could not load organization for the assistant.");
  }

  const rows = (await response.json()) as Org[];
  return rows[0] ?? null;
}

function validatePayload(value: unknown): AssistantRequest {
  if (!value || typeof value !== "object") {
    throw new HttpError(400, "Missing assistant request.");
  }

  const payload = value as Partial<AssistantRequest>;
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const sessionId = typeof payload.sessionId === "string" ? payload.sessionId.trim() : null;

  if (!message) {
    throw new HttpError(400, "Write a message before sending.");
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(400, "Please keep assistant questions under 4,000 characters.");
  }

  return {
    message,
    sessionId: sessionId && /^[A-Za-z0-9._:-]{2,100}$/.test(sessionId) ? sessionId : null,
  };
}

function metadataNgoForOrg(slug: string) {
  if (slug === "burundi-kids") return "BurundikKids";
  if (slug === "wtg") return "WTG";
  throw new HttpError(400, "This organization does not have a Bedrock assistant configured.");
}

async function askKnowledgeBase(
  env: ReturnType<typeof readEnvironment>,
  org: Org,
  metadataNgo: string,
  payload: AssistantRequest,
) {
  const aws = {
    accessKeyId: env.awsAccessKeyId,
    secretAccessKey: env.awsSecretAccessKey,
    sessionToken: env.awsSessionToken,
    region: env.awsRegion,
  };
  const chunks = await retrieveManagedKnowledgeBase({
    aws,
    knowledgeBaseId: env.bedrockKnowledgeBaseId,
    message: payload.message,
    metadataNgo,
  });

  if (chunks.length === 0) {
    return {
      answer: `I couldn't find any retrieved documents tagged ngo=${metadataNgo} for that question.`,
      sessionId: payload.sessionId ?? "",
      citations: [],
    };
  }

  const answer = await generateAnswer({
    aws,
    modelArnOrId: env.bedrockModelArn,
    org,
    metadataNgo,
    question: payload.message,
    chunks,
  });

  return {
    answer,
    sessionId: payload.sessionId ?? "",
    citations: citationsFromChunks(chunks),
  };
}

async function retrieveManagedKnowledgeBase({
  aws,
  knowledgeBaseId,
  message,
  metadataNgo,
}: {
  aws: AwsConfig;
  knowledgeBaseId: string;
  message: string;
  metadataNgo: string;
}): Promise<RetrievedChunk[]> {
  const response = await signedBedrockFetch({
    aws,
    hostService: "bedrock-agent-runtime",
    path: `/knowledgebases/${knowledgeBaseId}/retrieve`,
    body: {
      retrievalQuery: {
        text: message,
      },
      retrievalConfiguration: {
        managedSearchConfiguration: {
          numberOfResults: NUMBER_OF_RESULTS,
          filter: {
            equals: {
              key: "ngo",
              value: metadataNgo,
            },
          },
        },
      },
    },
  });

  return normalizeRetrievedChunks(response.retrievalResults);
}

async function generateAnswer({
  aws,
  modelArnOrId,
  org,
  metadataNgo,
  question,
  chunks,
}: {
  aws: AwsConfig;
  modelArnOrId: string;
  org: Org;
  metadataNgo: string;
  question: string;
  chunks: RetrievedChunk[];
}) {
  const modelId = modelIdFromArn(modelArnOrId);
  const response = await signedBedrockFetch({
    aws,
    hostService: "bedrock-runtime",
    path: `/model/${awsPathSegment(modelId)}/invoke`,
    body: {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 900,
      temperature: 0.2,
      system: buildSystemPrompt(org, metadataNgo),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildUserPrompt(question, chunks),
            },
          ],
        },
      ],
    },
  });

  const answer = extractClaudeText(response);

  if (!answer) {
    throw new HttpError(502, "Bedrock did not return an answer.");
  }

  return answer;
}

function normalizeRetrievedChunks(value: unknown): RetrievedChunk[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((result): RetrievedChunk | null => {
      const resultObject =
        result && typeof result === "object" ? (result as Record<string, unknown>) : {};
      const metadata =
        resultObject.metadata && typeof resultObject.metadata === "object"
          ? (resultObject.metadata as Record<string, unknown>)
          : {};
      const content =
        resultObject.content && typeof resultObject.content === "object"
          ? (resultObject.content as Record<string, unknown>)
          : {};
      const text = asString(content.text);

      if (!text) return null;

      const sourceUri = extractSourceUri(resultObject.location);
      const title =
        asString(metadata.title) ??
        asString(metadata.source) ??
        asString(metadata.file_name) ??
        (sourceUri ? (sourceUri.split("/").pop() ?? null) : null);

      return {
        text,
        title,
        sourceUri,
        metadata,
      };
    })
    .filter((chunk): chunk is RetrievedChunk => Boolean(chunk));
}

function extractClaudeText(response: Record<string, unknown>) {
  if (!Array.isArray(response.content)) return null;

  return response.content
    .map((part) => {
      const partObject = part && typeof part === "object" ? (part as Record<string, unknown>) : {};
      return asString(partObject.text);
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function citationsFromChunks(chunks: RetrievedChunk[]): Citation[] {
  return dedupeCitations(
    chunks.map((chunk) => ({
      title: chunk.title,
      sourceUri: chunk.sourceUri,
      excerpt: chunk.text.slice(0, 220),
    })),
  ).slice(0, 5);
}

function modelIdFromArn(value: string) {
  const foundationModelMarker = "foundation-model/";
  const foundationModelIndex = value.indexOf(foundationModelMarker);

  if (foundationModelIndex >= 0) {
    return value.slice(foundationModelIndex + foundationModelMarker.length);
  }

  return value;
}

function buildSystemPrompt(org: Org, metadataNgo: string) {
  const focus =
    org.slug === "burundi-kids"
      ? "Burundi, education, health, gender-based violence, child protection, and funding opportunities"
      : org.slug === "wtg"
        ? "animal welfare, wildlife trafficking, rabies, livestock welfare, and East Africa"
        : (org.topics ?? []).join(", ");

  return [
    `You are Canopy Assistant for ${org.name}.`,
    `Only answer using the retrieved document excerpts tagged ngo=${metadataNgo}.`,
    `Focus areas: ${focus || "the organization's configured topics"}.`,
    "If the retrieved excerpts do not contain enough evidence, say what is missing instead of guessing.",
    "Be concise, practical, and cite source numbers like [1] when useful.",
  ].join("\n");
}

function buildUserPrompt(question: string, chunks: RetrievedChunk[]) {
  const context = chunks
    .slice(0, MAX_CONTEXT_CHUNKS)
    .map((chunk, index) => {
      const title = chunk.title ? `Title: ${chunk.title}\n` : "";
      const source = chunk.sourceUri ? `Source: ${chunk.sourceUri}\n` : "";
      return [
        `[${index + 1}]`,
        title,
        source,
        `Excerpt: ${chunk.text.slice(0, MAX_CONTEXT_CHARS_PER_CHUNK)}`,
      ].join("");
    })
    .join("\n\n");

  return [
    "Retrieved excerpts:",
    context,
    "",
    `Question: ${question}`,
    "",
    "Answer using only the retrieved excerpts above.",
  ].join("\n");
}

function awsPathSegment(value: string) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

async function signedBedrockFetch({
  aws,
  hostService,
  path,
  body,
}: {
  aws: AwsConfig;
  hostService: string;
  path: string;
  body: unknown;
}): Promise<Record<string, unknown>> {
  const method = "POST";
  const host = `${hostService}.${aws.region}.amazonaws.com`;
  const endpoint = `https://${host}${path}`;
  const payload = JSON.stringify(body);
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(payload);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  if (aws.sessionToken) {
    headers["x-amz-security-token"] = aws.sessionToken;
  }

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key}:${headers[key].trim()}`)
    .join("\n");
  const canonicalRequest = [
    method,
    path,
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const scope = `${dateStamp}/${aws.region}/${BEDROCK_SIGNING_SERVICE}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, await sha256Hex(canonicalRequest)].join(
    "\n",
  );
  const signingKey = await getSignatureKey(
    aws.secretAccessKey,
    dateStamp,
    aws.region,
    BEDROCK_SIGNING_SERVICE,
  );
  const signature = toHex(await hmac(signingKey, stringToSign));
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${aws.accessKeyId}/${scope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  const response = await fetch(endpoint, {
    method,
    headers: {
      ...headers,
      authorization,
    },
    body: payload,
  });

  if (!response.ok) {
    throw new HttpError(response.status, await readBedrockError(response));
  }

  return (await response.json()) as Record<string, unknown>;
}

async function readBedrockError(response: Response) {
  try {
    const body = (await response.json()) as {
      message?: string;
      Message?: string;
      __type?: string;
      code?: string;
    };
    return body.message || body.Message || body.__type || body.code || "Bedrock request failed.";
  } catch (_error) {
    const text = await response.text();
    return text || "Bedrock request failed.";
  }
}

function extractSourceUri(location: unknown): string | null {
  if (!location || typeof location !== "object") return null;
  const typed = location as Record<string, unknown>;

  const s3Uri = asString((typed.s3Location as Record<string, unknown> | undefined)?.uri);
  const webUrl = asString((typed.webLocation as Record<string, unknown> | undefined)?.url);
  const customUrl = asString(
    (typed.customDocumentLocation as Record<string, unknown> | undefined)?.id,
  );

  return s3Uri ?? webUrl ?? customUrl;
}

function dedupeCitations(citations: Citation[]) {
  const seen = new Set<string>();
  return citations.filter((citation) => {
    const key = citation.sourceUri ?? citation.title ?? citation.excerpt;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function serviceRoleFetch(
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

async function getSignatureKey(
  secretAccessKey: string,
  dateStamp: string,
  regionName: string,
  serviceName: string,
) {
  const kDate = await hmac(utf8(`AWS4${secretAccessKey}`), dateStamp);
  const kRegion = await hmac(kDate, regionName);
  const kService = await hmac(kRegion, serviceName);
  return hmac(kService, "aws4_request");
}

async function hmac(key: Uint8Array, value: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, utf8(value));
  return new Uint8Array(signature);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", utf8(value));
  return toHex(new Uint8Array(digest));
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function utf8(value: string) {
  return new TextEncoder().encode(value);
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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
