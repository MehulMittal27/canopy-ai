import { getNewsPriority, type NewsItem } from "@/lib/api/news";

export type NewsTab = "All" | "Urgent" | "Saved";

export function formatNewsTopic(topic: string | null) {
  if (!topic) return "General";

  const normalized = topic.trim();
  if (!normalized) return "General";

  const special: Record<string, string> = {
    gbv: "GBV",
    bmz: "BMZ",
    eu: "EU",
    un: "UN",
  };

  const key = normalized.toLowerCase();
  if (special[key]) return special[key];

  return normalized
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => special[part.toLowerCase()] ?? part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatNewsTime(row: Pick<NewsItem, "time_ago" | "published_at" | "created_at">) {
  if (row.time_ago) return row.time_ago;
  const value = row.published_at || row.created_at;
  if (!value) return "Recently";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

export function filterByTab(rows: readonly NewsItem[], tab: NewsTab) {
  return rows.filter((row) => {
    if (tab === "Urgent") return getNewsPriority(row) === "red" || Boolean(row.is_urgent);
    if (tab === "Saved") return Boolean(row.is_saved);
    return true;
  });
}
