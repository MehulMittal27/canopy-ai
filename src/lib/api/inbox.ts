import { supabase } from "@/lib/supabase";

export type InboxPriority = "red" | "amber" | "green";
export type InboxCategory = "news" | "funding" | "report";

export interface InboxItem {
  id: string;
  org_id: string;
  title: string;
  source: string;
  summary: string;
  why_relevant: string;
  full_summary: string;
  next_steps: string[];
  priority: InboxPriority;
  tags: string[];
  item_date: string | null;
  is_read: boolean;
  is_saved: boolean;
  created_at: string;
  provider: string | null;
  provider_message_id: string | null;
  provider_thread_id: string | null;
  provider_grant_id: string | null;
}

export interface InboxViewItem extends InboxItem {
  urgency: InboxPriority;
  category: InboxCategory;
  published_at: string;
  translated_title: string;
  topic_tags: string[];
  source_url: string;
}

const PRIORITY_RANK: Record<InboxPriority, number> = { red: 0, amber: 1, green: 2 };

export async function getInboxItems(): Promise<InboxViewItem[]> {
  const { data, error } = await selectInboxItems(
    "id, org_id, title, source, summary, why_relevant, full_summary, next_steps, priority, tags, item_date, is_read, is_saved, created_at, provider, provider_message_id, provider_thread_id, provider_grant_id",
  );

  if (error && isMissingProviderColumnError(error)) {
    const fallback = await selectInboxItems(
      "id, org_id, title, source, summary, why_relevant, full_summary, next_steps, priority, tags, item_date, is_read, is_saved, created_at",
    );
    if (fallback.error) throw fallback.error;
    return toSortedViewItems((fallback.data ?? []) as unknown as Partial<InboxItem>[]);
  }

  if (error) throw error;
  return toSortedViewItems((data ?? []) as unknown as Partial<InboxItem>[]);
}

function selectInboxItems(columns: string) {
  return supabase.from("inbox_items").select(columns).order("created_at", { ascending: false });
}

function toSortedViewItems(items: Partial<InboxItem>[]): InboxViewItem[] {
  return (items as InboxItem[])
    .map(toViewItem)
    .sort((a, b) => {
      const priority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (priority !== 0) return priority;

      const itemDate = dateMs(b.item_date) - dateMs(a.item_date);
      if (itemDate !== 0) return itemDate;

      return dateMs(b.created_at) - dateMs(a.created_at);
    });
}

function isMissingProviderColumnError(error: { message?: string; code?: string }) {
  return (
    error.code === "42703" ||
    /provider|provider_message_id|provider_thread_id|provider_grant_id/i.test(error.message ?? "")
  );
}

export async function markInboxItemRead(id: string, isRead: boolean): Promise<void> {
  const { error } = await supabase.from("inbox_items").update({ is_read: isRead }).eq("id", id);
  if (error) throw error;
}

export async function toggleInboxItemSaved(id: string, isSaved: boolean): Promise<void> {
  const { error } = await supabase.from("inbox_items").update({ is_saved: isSaved }).eq("id", id);
  if (error) throw error;
}

function toViewItem(item: InboxItem): InboxViewItem {
  const tags = item.tags ?? [];

  return {
    ...item,
    source: item.source ?? "Email",
    summary: item.summary ?? "",
    why_relevant: item.why_relevant ?? "",
    full_summary: item.full_summary ?? item.summary ?? "",
    next_steps: item.next_steps ?? [],
    tags,
    urgency: item.priority,
    category: categoryFromTags(tags),
    published_at: item.item_date ?? item.created_at,
    translated_title: item.title,
    topic_tags: tags,
    source_url: "#",
  };
}

function categoryFromTags(tags: string[]): InboxCategory {
  const normalized = tags.map((tag) => tag.toLowerCase());
  if (normalized.includes("funding")) return "funding";
  if (normalized.includes("report")) return "report";
  return "news";
}

function dateMs(value: string | null | undefined) {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}
