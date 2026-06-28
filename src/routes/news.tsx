import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bookmark } from "lucide-react";
import { TopBar } from "@/components/canopy/TopBar";
import { Chip } from "@/components/canopy/CardItem";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import {
  getNewsItems,
  getNewsPriority,
  sortNewsItems,
  type NewsItem,
  type NewsPriority,
} from "@/lib/api/news";
import { filterByTab, formatNewsTime, formatNewsTopic, type NewsTab } from "@/lib/news-utils";

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "News Monitor · CANOPY" }] }),
  component: NewsRoute,
});

const PRIORITY_META: Record<
  NewsPriority,
  { label: string; color: string; borderClass: string; bg: string }
> = {
  red: {
    label: "URGENT",
    color: "#CC4444",
    borderClass: "border-l-[#E0533D]",
    bg: "#FBE9E7",
  },
  amber: {
    label: "RELEVANT",
    color: "#B07814",
    borderClass: "border-l-[#E8A53D]",
    bg: "#FBF1DC",
  },
  green: {
    label: "INFO",
    color: "#2FA36B",
    borderClass: "border-l-[#2FA36B]",
    bg: "#E7F3ED",
  },
};

function NewsRoute() {
  return (
    <ProtectedRoute>
      <NewsView />
    </ProtectedRoute>
  );
}

function NewsView() {
  const { org } = useAuth();
  const [activeTopics, setActiveTopics] = useState<string[]>([]);
  const [tab, setTab] = useState<NewsTab>("All");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["news_items", org?.id],
    queryFn: getNewsItems,
    enabled: Boolean(org),
  });

  const rows = useMemo(() => sortNewsItems(data ?? []), [data]);
  const topicOptions = useMemo(() => getTopicOptions(org?.topics ?? [], rows), [org?.topics, rows]);

  const list = useMemo(() => {
    let nextRows = filterByTab(rows, tab);
    if (activeTopics.length > 0) {
      nextRows = nextRows.filter((row) => activeTopics.includes(topicKey(row.topic)));
    }
    return nextRows;
  }, [activeTopics, rows, tab]);

  const toggleTopic = (topic: string) =>
    setActiveTopics((previous) =>
      previous.includes(topic) ? previous.filter((item) => item !== topic) : [...previous, topic],
    );

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <DetailHeader
        title="News Monitor"
        subtitle={`All news items for ${org?.name ?? "your NGO"}`}
      />
      <div className="mx-auto max-w-[1200px] border-b border-border px-6 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["All", "Urgent", "Saved"] as const).map((option) => (
            <Chip key={option} active={tab === option} onClick={() => setTab(option)}>
              {option}
            </Chip>
          ))}
          <div className="mx-2 h-5 w-px bg-border" />
          {topicOptions.map((topic) => (
            <Chip
              key={topic.key}
              active={activeTopics.includes(topic.key)}
              onClick={() => toggleTopic(topic.key)}
            >
              {topic.label}
            </Chip>
          ))}
          {activeTopics.length > 0 && (
            <button
              onClick={() => setActiveTopics([])}
              className="ml-auto text-xs font-medium text-[color:var(--accent)] hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
      <main className="mx-auto max-w-[780px] px-6 py-8">
        {isLoading ? (
          <NewsLoading />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : list.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-4">
            {list.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export function DetailHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-5">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-[12px] font-medium text-[color:var(--accent)] hover:underline"
      >
        <ArrowLeft size={12} /> Back to dashboard
      </Link>
      <h1 className="mt-3 text-[22px] font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-1 text-[13px] text-[color:var(--metadata)]">{subtitle}</p>
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const priority = getNewsPriority(item);
  const meta = PRIORITY_META[priority];

  return (
    <article
      className={"rounded-xl border border-border border-l-4 bg-card p-4 " + meta.borderClass}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[color:var(--metadata)]">
        <span
          className="inline-flex items-center gap-1 font-semibold tracking-wide"
          style={{ color: meta.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
          {meta.label}
        </span>
        <span aria-hidden>·</span>
        <span className="rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-foreground">
          News
        </span>
        <span aria-hidden>·</span>
        <span>
          {item.country_flag || "🌍"} {item.source || "News"}
        </span>
        <span aria-hidden>·</span>
        <span>{formatNewsTime(item)}</span>
        {item.is_saved && (
          <>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1 text-[color:var(--accent)]">
              <Bookmark size={12} fill="currentColor" /> Saved
            </span>
          </>
        )}
      </div>

      <h3 className="mt-2 text-[16px] font-semibold leading-snug text-foreground">
        {item.headline || "Untitled update"}
      </h3>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ color: meta.color, background: meta.bg }}
        >
          {formatNewsTopic(item.topic)}
        </span>
        {item.is_urgent && priority !== "red" && (
          <span className="rounded-full bg-[#FBE9E7] px-2 py-0.5 text-[11px] font-semibold text-[#CC4444]">
            Urgent signal
          </span>
        )}
      </div>
    </article>
  );
}

function NewsLoading() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-card p-4">
          <div className="h-3 w-40 rounded bg-[#F4F3EE]" />
          <div className="mt-3 h-5 w-full rounded bg-[#F4F3EE]" />
          <div className="mt-2 h-5 w-2/3 rounded bg-[#F4F3EE]" />
          <div className="mt-4 h-5 w-28 rounded bg-[#F4F3EE]" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center text-sm text-[color:var(--metadata)]">
      Could not load news right now.
      <button
        type="button"
        onClick={onRetry}
        className="ml-2 font-semibold text-[color:var(--accent)] hover:underline"
      >
        Retry
      </button>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center text-sm text-[color:var(--metadata)]">
      No items match these filters. Adjust filters or clear them.
    </div>
  );
}

function getTopicOptions(orgTopics: readonly string[], rows: readonly NewsItem[]) {
  const topics = new Map<string, string>();

  for (const topic of orgTopics) {
    topics.set(topicKey(topic), formatNewsTopic(topic));
  }

  for (const row of rows) {
    topics.set(topicKey(row.topic), formatNewsTopic(row.topic));
  }

  return Array.from(topics, ([key, label]) => ({ key, label })).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

function topicKey(topic: string | null) {
  return (topic ?? "general").trim().toLowerCase();
}
