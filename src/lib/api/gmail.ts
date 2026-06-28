import { supabase } from "@/lib/supabase";

export interface GmailConnection {
  id: string;
  org_id: string;
  google_email: string | null;
  token_expires_at: string | null;
  scope: string | null;
  status: "active" | "disabled" | "error";
  created_at: string;
  updated_at: string;
}

export interface GmailSyncResult {
  ok: boolean;
  imported: number;
  skipped: number;
  errors: number;
  results: Array<{
    message_id: string;
    inbox_item_id?: string;
    skipped?: boolean;
    error?: string;
  }>;
}

interface GmailStatusResponse {
  connection: GmailConnection | null;
}

interface GmailStartResponse {
  authUrl: string;
}

export async function getGmailConnection(): Promise<GmailConnection | null> {
  const { data, error } = await supabase.functions.invoke<GmailStatusResponse>("gmail-auth", {
    body: { action: "status" },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error, "Gmail status failed."));
  return data?.connection ?? null;
}

export async function startGmailOAuth(): Promise<string> {
  const { data, error } = await supabase.functions.invoke<GmailStartResponse>("gmail-auth", {
    body: { action: "start" },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error, "Gmail connection failed."));
  if (!data?.authUrl) throw new Error("Gmail did not return a connection URL.");
  return data.authUrl;
}

export async function disconnectGmail(): Promise<GmailConnection | null> {
  const { data, error } = await supabase.functions.invoke<GmailStatusResponse>("gmail-auth", {
    body: { action: "disconnect" },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error, "Gmail disconnect failed."));
  return data?.connection ?? null;
}

export async function syncGmailInbox(): Promise<GmailSyncResult> {
  const { data, error } = await supabase.functions.invoke<GmailSyncResult>("gmail-sync", {
    body: { limit: 10 },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error, "Gmail sync failed."));
  if (!data) throw new Error("Gmail sync did not return a result.");
  return data;
}

async function getFunctionErrorMessage(error: unknown, fallback: string) {
  const maybeContext = error as { context?: Response; message?: string };

  if (maybeContext.context instanceof Response) {
    try {
      const body = (await maybeContext.context.clone().json()) as { error?: string };
      if (body.error) return body.error;
    } catch (_error) {
      // Fall through to the Supabase error message.
    }
  }

  return maybeContext.message || fallback;
}
