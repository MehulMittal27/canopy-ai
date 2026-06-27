import { supabase } from "@/lib/supabase";

export interface DashboardLayoutRecord {
  user_id: string;
  template: string | null;
  layout_json: unknown;
  updated_at: string | null;
}

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("You must be signed in.");
  return data.user.id;
}

export async function getMyDashboardLayout(): Promise<DashboardLayoutRecord | null> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("dashboard_layouts")
    .select("user_id, template, layout_json, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as DashboardLayoutRecord | null;
}

export async function upsertMyDashboardLayout(
  template: string | null,
  layoutJson: unknown,
): Promise<DashboardLayoutRecord> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("dashboard_layouts")
    .upsert(
      {
        user_id: userId,
        template,
        layout_json: layoutJson,
      },
      { onConflict: "user_id" },
    )
    .select("user_id, template, layout_json, updated_at")
    .single();

  if (error) throw error;
  return data as DashboardLayoutRecord;
}
