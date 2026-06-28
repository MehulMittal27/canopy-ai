import {
  ClassifierError,
  classifyInboxContent,
  type ClassifierRequest,
  type OrgContext,
} from "../_shared/inbox-classifier.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const authorization = req.headers.get("Authorization");
    const userId = await requireAuthenticatedUser(authorization);
    const payload = validatePayload(await req.json());
    const org = await getAuthorizedOrg(payload.orgId, userId, authorization);
    const result = await classifyInboxContent(payload, org);

    return jsonResponse(result);
  } catch (error) {
    const status =
      error instanceof HttpError || error instanceof ClassifierError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unexpected classification failure.";

    if (status >= 500) {
      console.error("classify-inbox-item failed", error);
    }

    return jsonResponse({ error: message }, status);
  }
});

async function requireAuthenticatedUser(authorization: string | null): Promise<string> {
  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "You must be signed in to classify inbox items.");
  }

  const supabaseUrl = getEnv("SUPABASE_URL");
  const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: supabaseAnonKey,
    },
  });

  if (!authResponse.ok) {
    throw new HttpError(401, "Your session expired. Please sign in again.");
  }

  const data = (await authResponse.json()) as { id?: unknown };
  if (typeof data.id !== "string" || !data.id) {
    throw new HttpError(401, "Could not verify the signed-in user.");
  }

  return data.id;
}

async function getAuthorizedOrg(
  orgId: string,
  userId: string,
  authorization: string | null,
): Promise<OrgContext> {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");
  const params = new URLSearchParams({
    select: "id,name,slug,country,languages,topics",
    id: `eq.${orgId}`,
    admin_user_id: `eq.${userId}`,
    limit: "1",
  });

  const response = await fetch(`${supabaseUrl}/rest/v1/orgs?${params.toString()}`, {
    headers: {
      Authorization: authorization ?? "",
      apikey: supabaseAnonKey,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new HttpError(403, "Could not verify access to this organization.");
  }

  const rows = (await response.json()) as OrgContext[];
  const org = rows[0];
  if (!org) {
    throw new HttpError(403, "You do not have access to this organization.");
  }

  return org;
}

function validatePayload(value: unknown): ClassifierRequest {
  if (!value || typeof value !== "object") {
    throw new HttpError(400, "Missing classifier request.");
  }

  const payload = value as Partial<ClassifierRequest>;
  const orgId = cleanString(payload.orgId);
  const title = cleanString(payload.title);
  const source = cleanString(payload.source);
  const body = cleanString(payload.body);
  const summary = cleanString(payload.summary);
  const receivedAt = cleanString(payload.receivedAt);

  if (!orgId) throw new HttpError(400, "Missing organization id.");
  if (!title) throw new HttpError(400, "Missing item title.");
  if (!source) throw new HttpError(400, "Missing item source.");
  if (!body && !summary) throw new HttpError(400, "Provide a body or summary to classify.");

  if (receivedAt && Number.isNaN(new Date(receivedAt).getTime())) {
    throw new HttpError(400, "receivedAt must be a valid date.");
  }

  return {
    orgId,
    title,
    source,
    body: body || undefined,
    summary: summary || undefined,
    receivedAt: receivedAt || undefined,
  };
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new HttpError(500, `Missing ${name} configuration.`);
  return value;
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
