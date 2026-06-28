import {
  ClassifierError,
  classifyInboxContent,
  type OrgContext,
} from "../_shared/inbox-classifier.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type OrgRecord = OrgContext & {
  admin_user_id: string;
};

type GmailConnectionRecord = {
  id: string;
  org_id: string;
  google_email: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  status: "active" | "disabled" | "error";
};

type GmailMessageListItem = {
  id?: string;
  threadId?: string;
};

type GmailMessage = {
  id?: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  payload?: GmailPart;
};

type GmailPart = {
  mimeType?: string;
  filename?: string;
  headers?: Array<{ name?: string; value?: string }>;
  body?: { data?: string };
  parts?: GmailPart[];
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
    if (req.method !== "POST") throw new HttpError(405, "Method not allowed.");

    const authorization = req.headers.get("Authorization");
    const userId = await requireAuthenticatedUser(authorization);
    const body = (await req.json().catch(() => ({}))) as { limit?: unknown; query?: unknown };
    const limit = clampNumber(body.limit, 1, 25, 10);
    const query = typeof body.query === "string" && body.query.trim()
      ? body.query.trim()
      : "newer_than:30d -in:spam -in:trash";

    const org = await getOrgForUser(userId);
    let connection = await getActiveConnection(org.id);
    if (!connection) throw new HttpError(400, "Connect Gmail before syncing inbox messages.");
    connection = await ensureFreshAccessToken(connection);

    const messages = await listGmailMessages(connection.access_token!, query, limit);
    const results: Array<{ message_id: string; inbox_item_id?: string; skipped?: boolean; error?: string }> = [];

    for (const listed of messages) {
      const messageId = cleanString(listed.id);
      if (!messageId) continue;

      try {
        const existing = await getIngestEvent(org.id, messageId);
        if (existing) {
          results.push({ message_id: messageId, skipped: true });
          continue;
        }

        const message = await getGmailMessage(connection.access_token!, messageId);
        const normalized = normalizeMessage(message);
        const classified = await classifyInboxContent(
          {
            orgId: org.id,
            title: normalized.title,
            source: normalized.source,
            body: normalized.body,
            summary: normalized.summary,
            receivedAt: normalized.receivedAt,
          },
          org,
        );

        const inboxItem = await insertInboxItem({
          orgId: org.id,
          providerMessageId: messageId,
          providerThreadId: normalized.threadId,
          providerGrantId: connection.google_email ?? connection.id,
          classified,
        });

        await insertIngestEvent({
          messageId,
          threadId: normalized.threadId,
          orgId: org.id,
          inboxItemId: inboxItem.id,
          connectionId: connection.id,
        });

        results.push({ message_id: messageId, inbox_item_id: inboxItem.id });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not sync this message.";
        console.error("Gmail message sync failed", messageId, error);
        results.push({ message_id: messageId, error: message });
      }
    }

    return jsonResponse({
      ok: true,
      imported: results.filter((result) => result.inbox_item_id).length,
      skipped: results.filter((result) => result.skipped).length,
      errors: results.filter((result) => result.error).length,
      results,
    });
  } catch (error) {
    const status =
      error instanceof HttpError || error instanceof ClassifierError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unexpected Gmail sync failure.";

    if (status >= 500) console.error("gmail-sync failed", error);
    return jsonResponse({ error: message }, status);
  }
});

async function requireAuthenticatedUser(authorization: string | null): Promise<string> {
  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "You must be signed in to sync Gmail.");
  }

  const response = await fetch(`${getEnv("SUPABASE_URL")}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: getEnv("SUPABASE_ANON_KEY"),
    },
  });

  if (!response.ok) throw new HttpError(401, "Your session expired. Please sign in again.");

  const data = (await response.json()) as { id?: unknown };
  if (typeof data.id !== "string" || !data.id) {
    throw new HttpError(401, "Could not verify the signed-in user.");
  }

  return data.id;
}

async function getOrgForUser(userId: string): Promise<OrgRecord> {
  const params = new URLSearchParams({
    select: "id,name,slug,country,languages,topics,admin_user_id",
    admin_user_id: `eq.${userId}`,
    limit: "1",
  });
  const rows = await serviceRest<OrgRecord[]>(`/orgs?${params.toString()}`);
  const org = rows[0];
  if (!org) throw new HttpError(403, "No organization is linked to this user.");
  return org;
}

async function getActiveConnection(orgId: string): Promise<GmailConnectionRecord | null> {
  const params = new URLSearchParams({
    select: "id,org_id,google_email,access_token,refresh_token,token_expires_at,status",
    org_id: `eq.${orgId}`,
    status: "eq.active",
    limit: "1",
  });
  const rows = await serviceRest<GmailConnectionRecord[]>(
    `/org_gmail_connections?${params.toString()}`,
  );
  const connection = rows[0] ?? null;
  if (connection && !connection.access_token && !connection.refresh_token) return null;
  return connection;
}

async function ensureFreshAccessToken(
  connection: GmailConnectionRecord,
): Promise<GmailConnectionRecord> {
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;
  if (connection.access_token && expiresAt > Date.now() + 60_000) return connection;
  if (!connection.refresh_token) throw new HttpError(401, "Reconnect Gmail to refresh access.");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getEnv("GMAIL_CLIENT_ID"),
      client_secret: getEnv("GMAIL_CLIENT_SECRET"),
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Google token refresh failed", detail);
    throw new HttpError(401, "Reconnect Gmail to refresh access.");
  }

  const tokens = (await response.json()) as { access_token?: unknown; expires_in?: unknown; scope?: unknown };
  if (typeof tokens.access_token !== "string") {
    throw new HttpError(502, "Google did not return a refreshed Gmail token.");
  }

  const tokenExpiresAt = new Date(
    Date.now() + Math.max(60, typeof tokens.expires_in === "number" ? tokens.expires_in - 60 : 3540) * 1000,
  ).toISOString();

  const params = new URLSearchParams({ id: `eq.${connection.id}` });
  await serviceRest(`/org_gmail_connections?${params.toString()}`, {
    method: "PATCH",
    body: JSON.stringify({
      access_token: tokens.access_token,
      token_expires_at: tokenExpiresAt,
      scope: typeof tokens.scope === "string" ? tokens.scope : undefined,
    }),
  });

  return { ...connection, access_token: tokens.access_token, token_expires_at: tokenExpiresAt };
}

async function listGmailMessages(accessToken: string, query: string, limit: number) {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(limit),
  });
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } },
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("Gmail message list failed", detail);
    throw new HttpError(502, "Could not list Gmail messages.");
  }

  const data = (await response.json()) as { messages?: GmailMessageListItem[] };
  return data.messages ?? [];
}

async function getGmailMessage(accessToken: string, messageId: string): Promise<GmailMessage> {
  const params = new URLSearchParams({ format: "full" });
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } },
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("Gmail message fetch failed", detail);
    throw new HttpError(502, "Could not fetch a Gmail message.");
  }

  return response.json() as Promise<GmailMessage>;
}

async function getIngestEvent(orgId: string, messageId: string) {
  const params = new URLSearchParams({
    select: "id",
    org_id: `eq.${orgId}`,
    gmail_message_id: `eq.${messageId}`,
    limit: "1",
  });
  const rows = await serviceRest<Array<{ id: string }>>(`/gmail_ingest_events?${params.toString()}`);
  return rows[0] ?? null;
}

async function insertInboxItem(input: {
  orgId: string;
  providerMessageId: string;
  providerThreadId: string | null;
  providerGrantId: string;
  classified: {
    title: string;
    source: string;
    summary: string;
    why_relevant: string;
    full_summary: string;
    next_steps: string[];
    priority: "red" | "amber" | "green";
    tags: string[];
    item_date: string;
  };
}) {
  const rows = await serviceRest<Array<{ id: string }>>("/inbox_items?select=id", {
    method: "POST",
    body: JSON.stringify({
      org_id: input.orgId,
      title: input.classified.title,
      source: input.classified.source,
      summary: input.classified.summary,
      why_relevant: input.classified.why_relevant,
      full_summary: input.classified.full_summary,
      next_steps: input.classified.next_steps,
      priority: input.classified.priority,
      tags: input.classified.tags,
      item_date: input.classified.item_date,
      provider: "gmail",
      provider_message_id: input.providerMessageId,
      provider_thread_id: input.providerThreadId,
      provider_grant_id: input.providerGrantId,
    }),
    headers: { Prefer: "return=representation" },
  });
  const item = rows[0];
  if (!item) throw new HttpError(500, "Inbox item was inserted but not returned.");
  return item;
}

async function insertIngestEvent(input: {
  messageId: string;
  threadId: string | null;
  orgId: string;
  inboxItemId: string;
  connectionId: string;
}) {
  await serviceRest("/gmail_ingest_events", {
    method: "POST",
    body: JSON.stringify({
      org_id: input.orgId,
      gmail_message_id: input.messageId,
      gmail_thread_id: input.threadId,
      gmail_connection_id: input.connectionId,
      inbox_item_id: input.inboxItemId,
    }),
  });
}

function normalizeMessage(message: GmailMessage) {
  const headers = message.payload?.headers ?? [];
  const subject = header(headers, "subject") || "Untitled email";
  const from = header(headers, "from") || "Gmail";
  const dateHeader = header(headers, "date");
  const body = extractBody(message.payload);
  const textBody = body.plain || stripHtml(body.html);
  const summary = cleanString(message.snippet) || summarize(textBody, 240);

  return {
    title: subject,
    source: from,
    summary,
    body: textBody || summary || subject,
    receivedAt: normalizeDate(dateHeader, message.internalDate),
    threadId: cleanString(message.threadId) || null,
  };
}

function extractBody(part: GmailPart | undefined): { plain: string; html: string } {
  if (!part) return { plain: "", html: "" };

  let plain = "";
  let html = "";
  const decoded = decodeBody(part.body?.data);

  if (decoded) {
    if (part.mimeType === "text/plain") plain += `\n${decoded}`;
    if (part.mimeType === "text/html") html += `\n${decoded}`;
  }

  for (const child of part.parts ?? []) {
    const nested = extractBody(child);
    plain += nested.plain ? `\n${nested.plain}` : "";
    html += nested.html ? `\n${nested.html}` : "";
  }

  return {
    plain: plain.replace(/\s+/g, " ").trim(),
    html: html.trim(),
  };
}

function decodeBody(value: string | undefined) {
  if (!value) return "";
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (_error) {
    return "";
  }
}

function header(headers: Array<{ name?: string; value?: string }>, name: string) {
  const found = headers.find((item) => item.name?.toLowerCase() === name.toLowerCase());
  return cleanString(found?.value);
}

function normalizeDate(dateHeader: string, internalDate: string | undefined) {
  if (dateHeader) {
    const date = new Date(dateHeader);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  if (internalDate) {
    const date = new Date(Number(internalDate));
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  return new Date().toISOString();
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function summarize(value: string, maxLength: number) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

async function serviceRest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getEnv("SUPABASE_URL")}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: getEnv("CANOPY_SERVICE_ROLE_KEY"),
      Authorization: `Bearer ${getEnv("CANOPY_SERVICE_ROLE_KEY")}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Supabase REST error", detail);
    throw new HttpError(500, "Could not update Gmail inbox records.");
  }

  if (response.status === 204) return null as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
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
