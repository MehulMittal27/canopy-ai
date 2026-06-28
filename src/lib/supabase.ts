import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseConfigError =
  "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to a local .env file and restart the dev server.";

export function requireSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError);
  }
}

export const supabase = createClient(
  supabaseUrl ?? "https://missing-supabase-url.supabase.co",
  supabaseAnonKey ?? "missing-supabase-anon-key",
);
