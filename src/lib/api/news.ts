import { supabase } from "@/lib/supabase";

export type NewsPriority = "red" | "amber" | "green";

export type NewsItem = {
  id: string;
  org_id: string;
  source: string | null;
  country_flag: string | null;
  headline: string | null;
  topic: string | null;
  time_ago: string | null;
  priority: NewsPriority | null;
  is_urgent: boolean | null;
  is_saved: boolean | null;
  created_at: string | null;
};

const PRIORITY_RANK: Record<NewsPriority, number> = {
  red: 0,
  amber: 1,
  green: 2,
};

export async function getNewsItems(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from("news_items")
    .select(
      "id, org_id, source, country_flag, headline, topic, time_ago, priority, is_urgent, is_saved, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return sortNewsItems((data ?? []) as NewsItem[]);
}

export function sortNewsItems(items: readonly NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => {
    const priorityDiff = PRIORITY_RANK[getNewsPriority(a)] - PRIORITY_RANK[getNewsPriority(b)];
    if (priorityDiff !== 0) return priorityDiff;

    const urgentDiff = Number(Boolean(b.is_urgent)) - Number(Boolean(a.is_urgent));
    if (urgentDiff !== 0) return urgentDiff;

    const dateDiff = dateMs(b.created_at) - dateMs(a.created_at);
    if (dateDiff !== 0) return dateDiff;

    return (a.headline ?? "").localeCompare(b.headline ?? "");
  });
}

export function getNewsPriority(item: Pick<NewsItem, "priority">): NewsPriority {
  return item.priority === "red" || item.priority === "amber" || item.priority === "green"
    ? item.priority
    : "green";
}

function dateMs(value: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}
