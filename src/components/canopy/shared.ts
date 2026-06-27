import type { Category, Urgency } from "@/data/items";

export const URGENCY_RANK: Record<Urgency, number> = { red: 0, yellow: 1, green: 2 };

export const URGENCY_META: Record<
  Urgency,
  { label: string; color: string; borderClass: string }
> = {
  red: { label: "URGENT", color: "#DC2626", borderClass: "border-l-[#DC2626]" },
  yellow: { label: "RELEVANT", color: "#D97706", borderClass: "border-l-[#D97706]" },
  green: { label: "INFO", color: "#059669", borderClass: "border-l-[#059669]" },
};

export const CATEGORY_LABEL: Record<Category, string> = {
  news: "News",
  funding: "Funding",
  report: "Report",
};

export const LANG_LABEL: Record<"fr" | "en" | "de", string> = {
  fr: "FR",
  en: "EN",
  de: "DE",
};

export function formatDate(iso: string): string {
  const dt = new Date(iso);
  const day = String(dt.getUTCDate()).padStart(2, "0");
  const month = dt.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const year = dt.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export function daysUntil(iso: string): number {
  const target = new Date(iso).getTime();
  const today = new Date("2026-06-27T00:00:00Z").getTime();
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}
