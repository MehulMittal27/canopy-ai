import { supabase } from "@/lib/supabase";

export interface Org {
  id: string;
  admin_user_id: string | null;
  name: string;
  slug: string;
  country: string | null;
  languages: string[] | null;
  topics: string[] | null;
  created_at: string | null;
}

function slugify(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "organization";
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("You must be signed in.");
  return data.user.id;
}

function isNoRowsError(error: { code?: string } | null): boolean {
  return error?.code === "PGRST116";
}

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

export async function getMyOrg(): Promise<Org | null> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("orgs")
    .select("*")
    .eq("admin_user_id", userId)
    .single();

  if (error) {
    if (isNoRowsError(error)) return null;
    throw error;
  }

  return data as Org;
}

export async function createOrgForCurrentUser(name: string): Promise<Org> {
  const userId = await getCurrentUserId();
  const existingOrg = await getMyOrg();
  if (existingOrg) return existingOrg;

  const baseSlug = slugify(name);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomSuffix()}`;
    const { data: slugMatch, error: slugError } = await supabase
      .from("orgs")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugError) throw slugError;
    if (slugMatch) continue;

    const { data, error } = await supabase
      .from("orgs")
      .insert({ name, slug, admin_user_id: userId })
      .select("*")
      .single();

    if (!error) return data as Org;

    if (isUniqueViolation(error)) {
      const org = await getMyOrg();
      if (org) return org;
      continue;
    }

    throw error;
  }

  throw new Error("Could not create a unique organization slug.");
}

export async function updateMyOrg(updates: Partial<Org>): Promise<Org> {
  const userId = await getCurrentUserId();
  const { id, admin_user_id, created_at, ...safeUpdates } = updates;
  void id;
  void admin_user_id;
  void created_at;

  const { data, error } = await supabase
    .from("orgs")
    .update(safeUpdates)
    .eq("admin_user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Org;
}
