const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type OrgRecord = {
  id: string;
  name: string;
  slug: string;
  admin_user_id: string;
};

type OAuthStateRecord = {
  id: string;
  state: string;
  org_id: string;
  user_id: string;
  expires_at: string;
  consumed_at: string | null;
};

type GmailConnectionRecord = {
  id: string;
  org_id: string;
  google_email: string | null;
  token_expires_at: string | null;
  scope: string | null;
  status: "active" | "disabled" | "error";
  created_at: string;
  updated_at: string;
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
    if (req.method === "GET") return handleCallback(req);
    if (req.method !== "POST") throw new HttpError(405, "Method not allowed.");

    const authorization = req.headers.get("Authorization");
    const userId = await requireAuthenticatedUser(authorization);
    const body = (await req.json().catch(() => ({}))) as { action?: unknown };
    const action = typeof body.action === "string" ? body.action : "status";
    const org = await getOrgForUser(userId);

    if (action === "start") {
      const state = await createOAuthState(org.id, userId);
      return jsonResponse({ authUrl: buildAuthUrl(state) });
    }

    if (action === "disconnect") {
      await disconnectConnection(org.id);
      return jsonResponse({ connection: await getConnectionStatus(org.id) });
    }

    return jsonResponse({ connection: await getConnectionStatus(org.id) });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unexpected Gmail auth failure.";

    if (status >= 500) console.error("gmail-auth failed", error);
    if (req.method === "GET") return redirectWithStatus("gmail_error", message);
    return jsonResponse({ error: message }, status);
  }
});

async function handleCallback(req: Request) {
  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  if (error) return redirectWithStatus("gmail_error", error);

  const code = url.searchParams.get("code");
  const stateValue = url.searchParams.get("state");
  if (!code || !stateValue) throw new HttpError(400, "Missing Google OAuth callback parameters.");

  const state = await getOAuthState(stateValue);
  if (!state || state.consumed_at) throw new HttpError(400, "This Gmail connection link is no longer valid.");
  if (new Date(state.expires_at).getTime() < Date.now()) {
    throw new HttpError(400, "This Gmail connection link has expired.");
  }

  const tokens = await exchangeCodeForTokens(code);
  const profile = await getGmailProfile(tokens.access_token);
  await upsertConnection({
    orgId: state.org_id,
    googleEmail: profile.emailAddress,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
    scope: tokens.scope,
  });
  await markOAuthStateConsumed(state.id);

  return redirectWithStatus("gmail", "connected");
}

async function requireAuthenticatedUser(authorization: string | null): Promise<string> {
  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "You must be signed in to connect Gmail.");
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
    select: "id,name,slug,admin_user_id",
    admin_user_id: `eq.${userId}`,
    limit: "1",
  });
  const rows = await serviceRest<OrgRecord[]>(`/orgs?${params.toString()}`);
  const org = rows[0];
  if (!org) throw new HttpError(403, "No organization is linked to this user.");
  return org;
}

async function createOAuthState(orgId: string, userId: string) {
  const state = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await serviceRest("/gmail_oauth_states", {
    method: "POST",
    body: JSON.stringify({
      state,
      org_id: orgId,
      user_id: userId,
      expires_at: expiresAt,
    }),
  });

  return state;
}

async function getOAuthState(state: string): Promise<OAuthStateRecord | null> {
  const params = new URLSearchParams({
    select: "id,state,org_id,user_id,expires_at,consumed_at",
    state: `eq.${state}`,
    limit: "1",
  });
  const rows = await serviceRest<OAuthStateRecord[]>(`/gmail_oauth_states?${params.toString()}`);
  return rows[0] ?? null;
}

async function markOAuthStateConsumed(id: string) {
  const params = new URLSearchParams({ id: `eq.${id}` });
  await serviceRest(`/gmail_oauth_states?${params.toString()}`, {
    method: "PATCH",
    body: JSON.stringify({ consumed_at: new Date().toISOString() }),
  });
}

function buildAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: getEnv("GMAIL_CLIENT_ID"),
    redirect_uri: getEnv("GMAIL_REDIRECT_URI"),
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(code: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getEnv("GMAIL_CLIENT_ID"),
      client_secret: getEnv("GMAIL_CLIENT_SECRET"),
      redirect_uri: getEnv("GMAIL_REDIRECT_URI"),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Google token exchange failed", detail);
    throw new HttpError(502, "Google could not finish the Gmail connection.");
  }

  const tokens = (await response.json()) as {
    access_token?: unknown;
    refresh_token?: unknown;
    expires_in?: unknown;
    scope?: unknown;
  };

  if (typeof tokens.access_token !== "string") {
    throw new HttpError(502, "Google did not return a Gmail access token.");
  }

  return {
    access_token: tokens.access_token,
    refresh_token: typeof tokens.refresh_token === "string" ? tokens.refresh_token : null,
    expires_in: typeof tokens.expires_in === "number" ? tokens.expires_in : 3600,
    scope: typeof tokens.scope === "string" ? tokens.scope : null,
  };
}

async function getGmailProfile(accessToken: string) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Gmail profile fetch failed", detail);
    throw new HttpError(502, "Could not read the connected Gmail profile.");
  }

  const profile = (await response.json()) as { emailAddress?: unknown };
  if (typeof profile.emailAddress !== "string" || !profile.emailAddress) {
    throw new HttpError(502, "Gmail did not return an email address.");
  }
  return { emailAddress: profile.emailAddress };
}

async function upsertConnection(input: {
  orgId: string;
  googleEmail: string;
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
  scope: string | null;
}) {
  const existing = await getRawConnection(input.orgId);
  const tokenExpiresAt = new Date(Date.now() + Math.max(60, input.expiresIn - 60) * 1000).toISOString();
  const body = {
    org_id: input.orgId,
    google_email: input.googleEmail,
    access_token: input.accessToken,
    refresh_token: input.refreshToken ?? existing?.refresh_token ?? null,
    token_expires_at: tokenExpiresAt,
    scope: input.scope,
    status: "active",
  };

  await serviceRest("/org_gmail_connections?on_conflict=org_id", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { Prefer: "resolution=merge-duplicates" },
  });
}

async function getRawConnection(orgId: string) {
  const params = new URLSearchParams({
    select: "refresh_token",
    org_id: `eq.${orgId}`,
    limit: "1",
  });
  const rows = await serviceRest<Array<{ refresh_token: string | null }>>(
    `/org_gmail_connections?${params.toString()}`,
  );
  return rows[0] ?? null;
}

async function getConnectionStatus(orgId: string) {
  const params = new URLSearchParams({
    select: "id,org_id,google_email,token_expires_at,scope,status,created_at,updated_at",
    org_id: `eq.${orgId}`,
    limit: "1",
  });
  const rows = await serviceRest<GmailConnectionRecord[]>(
    `/org_gmail_connections?${params.toString()}`,
  );
  const connection = rows[0];
  if (!connection || connection.status !== "active") return null;
  return connection;
}

async function disconnectConnection(orgId: string) {
  const params = new URLSearchParams({ org_id: `eq.${orgId}` });
  await serviceRest(`/org_gmail_connections?${params.toString()}`, {
    method: "PATCH",
    body: JSON.stringify({
      access_token: null,
      refresh_token: null,
      status: "disabled",
    }),
  });
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
    throw new HttpError(500, "Could not update Gmail connection records.");
  }

  if (response.status === 204) return null as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

function redirectWithStatus(key: string, value: string) {
  const appUrl = new URL(Deno.env.get("CANOPY_APP_URL") || "http://localhost:8080");
  appUrl.pathname = "/settings";
  appUrl.searchParams.set(key, value);
  return Response.redirect(appUrl.toString(), 302);
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
