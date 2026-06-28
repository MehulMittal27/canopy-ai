import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { ArrowLeft, Bookmark, ExternalLink, RefreshCw, Sparkles, X } from "lucide-react";
import { TopBar } from "@/components/canopy/TopBar";
import { Chip } from "@/components/canopy/CardItem";
import { NewsMedia } from "@/components/canopy/NewsMedia";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeNewsPreferences } from "@/lib/api/news-preferences";
import {
  getNewsItems,
  getNewsPriority,
  analyzeNewsItem,
  refreshNewsItems,
  sortNewsItems,
  type RefreshNewsResult,
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
  const queryClient = useQueryClient();
  const [activeTopics, setActiveTopics] = useState<string[]>([]);
  const [tab, setTab] = useState<NewsTab>("All");
  const [refreshSummary, setRefreshSummary] = useState<RefreshNewsResult | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzingItemId, setAnalyzingItemId] = useState<string | null>(null);
  const [selectedAiItemId, setSelectedAiItemId] = useState<string | null>(null);
  const preferences = useMemo(() => normalizeNewsPreferences(org), [org]);
  const newsQueryKey = useMemo(() => ["news_items", org?.id] as const, [org?.id]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: newsQueryKey,
    queryFn: getNewsItems,
    enabled: Boolean(org),
  });

  const refreshMutation = useMutation({
    mutationFn: refreshNewsItems,
    onMutate: () => {
      setRefreshSummary(null);
      setAnalysisMessage(null);
      setAnalysisError(null);
    },
    onSuccess: async (result) => {
      setRefreshSummary(result);
      await queryClient.invalidateQueries({ queryKey: newsQueryKey });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: analyzeNewsItem,
    onMutate: (itemId) => {
      setAnalyzingItemId(itemId);
      setAnalysisMessage(null);
      setAnalysisError(null);
    },
    onSuccess: async (result) => {
      setAnalysisMessage(
        result.updated > 0 ? "AI summary saved for the selected story." : "No update was saved.",
      );
      await queryClient.invalidateQueries({ queryKey: newsQueryKey });
    },
    onError: (error) => {
      setAnalysisError(error instanceof Error ? error.message : "Could not analyze that story.");
    },
    onSettled: () => {
      setAnalyzingItemId(null);
    },
  });

  const rows = useMemo(() => sortNewsItems(data ?? []), [data]);
  const selectedAiItem = selectedAiItemId
    ? rows.find((row) => row.id === selectedAiItemId) ?? null
    : null;
  const topicOptions = useMemo(
    () => getTopicOptions(preferences.topics, rows),
    [preferences.topics, rows],
  );

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

  const handleAnalyze = (item: NewsItem) => {
    setSelectedAiItemId(item.id);
    setAnalysisError(null);
    setAnalysisMessage(null);

    if (hasNewsAiInsight(item) || analyzeMutation.isPending) return;
    analyzeMutation.mutate(item.id);
  };

  const retrySelectedAnalysis = () => {
    if (!selectedAiItem || analyzeMutation.isPending) return;
    setAnalysisError(null);
    analyzeMutation.mutate(selectedAiItem.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <DetailHeader
        title="News Monitor"
        subtitle={`All news items for ${org?.name ?? "your NGO"}`}
      />
      <div className="mx-auto max-w-[1200px] border-b border-border px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          </div>
          <div className="flex items-center gap-3">
            {activeTopics.length > 0 && (
              <button
                onClick={() => setActiveTopics([])}
                className="text-xs font-medium text-[color:var(--accent)] hover:underline"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending || analyzeMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--accent)] px-3 py-1 text-xs font-semibold text-[color:var(--accent)] transition-colors hover:bg-[color:var(--accent)]/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={12} className={refreshMutation.isPending ? "animate-spin" : ""} />
              {refreshMutation.isPending ? "Refreshing..." : "Refresh news"}
            </button>
          </div>
        </div>
        <RefreshStatus mutation={refreshMutation} summary={refreshSummary} />
        <AnalysisStatus error={analysisError} message={analysisMessage} />
      </div>
      <PreferenceSummary preferences={preferences} />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        {isLoading ? (
          <NewsLoading />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : list.length === 0 ? (
          <EmptyState />
        ) : (
          <NewsFeed
            items={list}
            onAnalyze={handleAnalyze}
            analyzingItemId={analyzingItemId}
            analysisDisabled={refreshMutation.isPending || analyzeMutation.isPending}
          />
        )}
      </main>
      {selectedAiItem && (
        <NewsAiDialog
          item={selectedAiItem}
          isLoading={analyzingItemId === selectedAiItem.id}
          error={analysisError}
          onClose={() => setSelectedAiItemId(null)}
          onRetry={retrySelectedAnalysis}
        />
      )}
    </div>
  );
}

function AnalysisStatus({
  error,
  message,
}: {
  error: string | null;
  message: string | null;
}) {
  if (error) {
    return (
      <p className="mt-2 text-[12px] font-medium text-[#CC4444]">{error}</p>
    );
  }

  if (!message) return null;

  return (
    <p className="mt-2 text-[12px] font-medium text-[#137A5C]">{message}</p>
  );
}

function RefreshStatus({
  mutation,
  summary,
}: {
  mutation: UseMutationResult<RefreshNewsResult, Error, void, unknown>;
  summary: RefreshNewsResult | null;
}) {
  if (mutation.isError) {
    return (
      <p className="mt-2 text-[12px] font-medium text-[#CC4444]">
        {mutation.error instanceof Error
          ? mutation.error.message
          : "Could not refresh news right now."}
      </p>
    );
  }

  if (!summary) return null;

  return (
    <p className="mt-2 text-[12px] font-medium text-[#137A5C]">
      News refreshed. Added {summary.inserted}, updated {summary.updated}, skipped {summary.skipped}
      {summary.warnings.length > 0 ? `, with ${summary.warnings.length} warning(s)` : ""}.
    </p>
  );
}

function PreferenceSummary({
  preferences,
}: {
  preferences: ReturnType<typeof normalizeNewsPreferences>;
}) {
  const chips = [
    ...preferences.countries.map((value) => ({ label: value, group: "Country" })),
    ...preferences.topics.slice(0, 8).map((value) => ({
      label: formatNewsTopic(value),
      group: "Topic",
    })),
    ...preferences.languages.map((value) => ({ label: value.toUpperCase(), group: "Language" })),
    ...preferences.trustedDomains.slice(0, 5).map((value) => ({ label: value, group: "Source" })),
  ];

  if (chips.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1200px] border-b border-border px-6 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[12px] font-semibold uppercase tracking-wider text-[color:var(--metadata)]">
          Monitoring
        </span>
        {chips.map((chip) => (
          <span
            key={`${chip.group}-${chip.label}`}
            className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[12px] text-foreground"
            title={chip.group}
          >
            {chip.label}
          </span>
        ))}
      </div>
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

function NewsFeed({
  items,
  onAnalyze,
  analyzingItemId,
  analysisDisabled,
}: {
  items: NewsItem[];
  onAnalyze: (item: NewsItem) => void;
  analyzingItemId: string | null;
  analysisDisabled: boolean;
}) {
  const featured = items.find((item) => Boolean(item.image_url?.trim())) ?? items[0];
  const rest = items.filter((item) => item.id !== featured.id);
  const topStories = rest.slice(0, 3);
  const cardStories = rest.slice(3);

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <FeaturedNewsCard
          item={featured}
          onAnalyze={onAnalyze}
          analyzingItemId={analyzingItemId}
          analysisDisabled={analysisDisabled}
        />
        {topStories.length > 0 && (
          <div className="flex flex-col gap-3">
            {topStories.map((item) => (
              <TopNewsCard
                key={item.id}
                item={item}
                onAnalyze={onAnalyze}
                analyzingItemId={analyzingItemId}
                analysisDisabled={analysisDisabled}
              />
            ))}
          </div>
        )}
      </section>

      {cardStories.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cardStories.map((item) => (
            <NewsTile
              key={item.id}
              item={item}
              onAnalyze={onAnalyze}
              analyzingItemId={analyzingItemId}
              analysisDisabled={analysisDisabled}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function FeaturedNewsCard({
  item,
  onAnalyze,
  analyzingItemId,
  analysisDisabled,
}: {
  item: NewsItem;
  onAnalyze: (item: NewsItem) => void;
  analyzingItemId: string | null;
  analysisDisabled: boolean;
}) {
  const priority = getNewsPriority(item);
  const meta = PRIORITY_META[priority];
  const snippet = getSnippet(item);

  return (
    <NewsArticleLink
      item={item}
      className="group block overflow-hidden rounded-[18px] border border-border bg-card shadow-[0_1px_2px_rgba(20,20,18,.04),0_14px_30px_-22px_rgba(20,20,18,.22)] transition-colors hover:bg-[#FAF9F5] focus:outline-none focus:ring-2 focus:ring-[#16A06B]/25"
    >
      <NewsMedia
        imageUrl={item.image_url}
        imageAlt={item.image_alt || item.headline}
        sourceUrl={item.source_url}
        flag={item.country_flag}
        source={item.source}
        className="h-[280px] w-full border-0"
        fallbackClassName="bg-[#E7F3ED]"
        flagClassName="h-12 w-16 rounded-[5px]"
      />
      <div className="p-5">
        <NewsMeta
          item={item}
          priority={priority}
          meta={meta}
          onAnalyze={onAnalyze}
          isAnalyzing={analyzingItemId === item.id}
          analysisDisabled={analysisDisabled}
        />
        <h2 className="mt-3 text-[30px] font-semibold leading-[1.05] tracking-tight text-foreground md:text-[36px]">
          {item.headline || "Untitled update"}
        </h2>
        {snippet && (
          <p
            className="mt-3 max-w-[760px] text-[14px] leading-relaxed text-[color:var(--secondary)]"
            style={clampStyle(3)}
          >
            {snippet}
          </p>
        )}
        <TopicRow item={item} meta={meta} />
      </div>
    </NewsArticleLink>
  );
}

function TopNewsCard({
  item,
  onAnalyze,
  analyzingItemId,
  analysisDisabled,
}: {
  item: NewsItem;
  onAnalyze: (item: NewsItem) => void;
  analyzingItemId: string | null;
  analysisDisabled: boolean;
}) {
  const priority = getNewsPriority(item);
  const meta = PRIORITY_META[priority];

  return (
    <NewsArticleLink
      item={item}
      className="group grid grid-cols-[112px_minmax(0,1fr)] gap-4 rounded-[16px] border border-border bg-card p-3 transition-colors hover:bg-[#FAF9F5] focus:outline-none focus:ring-2 focus:ring-[#16A06B]/25"
    >
      <NewsMedia
        imageUrl={item.image_url}
        imageAlt={item.image_alt || item.headline}
        sourceUrl={item.source_url}
        flag={item.country_flag}
        source={item.source}
        className="h-[86px] w-full rounded-[12px]"
        fallbackClassName="bg-[#F4F3EE]"
        flagClassName="h-7 w-10 rounded-[4px]"
        showSource={false}
      />
      <div className="min-w-0">
        <NewsMeta
          item={item}
          priority={priority}
          meta={meta}
          compact
          onAnalyze={onAnalyze}
          isAnalyzing={analyzingItemId === item.id}
          analysisDisabled={analysisDisabled}
        />
        <h3
          className="mt-2 text-[16px] font-semibold leading-snug text-foreground"
          style={clampStyle(3)}
        >
          {item.headline || "Untitled update"}
        </h3>
        <TopicRow item={item} meta={meta} compact />
      </div>
    </NewsArticleLink>
  );
}

function NewsTile({
  item,
  onAnalyze,
  analyzingItemId,
  analysisDisabled,
}: {
  item: NewsItem;
  onAnalyze: (item: NewsItem) => void;
  analyzingItemId: string | null;
  analysisDisabled: boolean;
}) {
  const priority = getNewsPriority(item);
  const meta = PRIORITY_META[priority];
  const snippet = getSnippet(item);

  return (
    <NewsArticleLink
      item={item}
      className="group flex min-h-full flex-col overflow-hidden rounded-[16px] border border-border bg-card transition-colors hover:bg-[#FAF9F5] focus:outline-none focus:ring-2 focus:ring-[#16A06B]/25"
    >
      <NewsMedia
        imageUrl={item.image_url}
        imageAlt={item.image_alt || item.headline}
        sourceUrl={item.source_url}
        flag={item.country_flag}
        source={item.source}
        className="h-[150px] w-full border-0"
        fallbackClassName="bg-[#F4F3EE]"
        flagClassName="h-10 w-14 rounded-[5px]"
      />
      <div className="flex flex-1 flex-col p-4">
        <NewsMeta
          item={item}
          priority={priority}
          meta={meta}
          compact
          onAnalyze={onAnalyze}
          isAnalyzing={analyzingItemId === item.id}
          analysisDisabled={analysisDisabled}
        />
        <h3
          className="mt-2 text-[17px] font-semibold leading-snug text-foreground"
          style={clampStyle(3)}
        >
          {item.headline || "Untitled update"}
        </h3>
        {snippet && (
          <p
            className="mt-2 text-[13px] leading-relaxed text-[color:var(--secondary)]"
            style={clampStyle(3)}
          >
            {snippet}
          </p>
        )}
        <div className="mt-auto">
          <TopicRow item={item} meta={meta} compact />
        </div>
      </div>
    </NewsArticleLink>
  );
}

function NewsArticleLink({
  item,
  className,
  children,
}: {
  item: NewsItem;
  className: string;
  children: ReactNode;
}) {
  const sourceUrl = item.source_url?.trim();

  if (sourceUrl) {
    return (
      <article
        role="link"
        tabIndex={0}
        className={className}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("button,a")) return;
          window.open(sourceUrl, "_blank", "noopener,noreferrer");
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          if ((event.target as HTMLElement).closest("button,a")) return;
          event.preventDefault();
          window.open(sourceUrl, "_blank", "noopener,noreferrer");
        }}
        aria-label={`Open source for ${item.headline || "news item"}`}
      >
        {children}
      </article>
    );
  }

  return <article className={className}>{children}</article>;
}

function NewsMeta({
  item,
  priority,
  meta,
  compact = false,
  onAnalyze,
  isAnalyzing = false,
  analysisDisabled = false,
}: {
  item: NewsItem;
  priority: NewsPriority;
  meta: (typeof PRIORITY_META)[NewsPriority];
  compact?: boolean;
  onAnalyze?: (item: NewsItem) => void;
  isAnalyzing?: boolean;
  analysisDisabled?: boolean;
}) {
  const analyzed = hasNewsAiInsight(item);

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[color:var(--metadata)] ${
        compact ? "text-[11px]" : "text-[12px]"
      }`}
    >
      <span
        className="inline-flex items-center gap-1 font-semibold tracking-wide"
        style={{ color: meta.color }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
        {meta.label}
      </span>
      <span aria-hidden>·</span>
      <span>{item.source || "News"}</span>
      <span aria-hidden>·</span>
      <span>{formatNewsTime(item)}</span>
      {onAnalyze && (
        <>
          <span aria-hidden>·</span>
          <InlineAnalyzeButton
            onClick={() => onAnalyze(item)}
            disabled={!analyzed && analysisDisabled}
            isLoading={isAnalyzing}
            analyzed={analyzed}
            compact={compact}
          />
        </>
      )}
      {item.is_saved && (
        <>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1 text-[color:var(--accent)]">
            <Bookmark size={12} fill="currentColor" /> Saved
          </span>
        </>
      )}
      {item.is_urgent && priority !== "red" && (
        <>
          <span aria-hidden>·</span>
          <span className="font-semibold text-[#CC4444]">Urgent signal</span>
        </>
      )}
    </div>
  );
}

function InlineAnalyzeButton({
  analyzed,
  compact,
  disabled,
  isLoading,
  onClick,
}: {
  analyzed: boolean;
  compact: boolean;
  disabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}) {
  const label = isLoading
    ? "Analyzing story"
    : analyzed
      ? "Open AI summary"
      : "Analyze this story with AI";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-full border border-[#CFE3DC] bg-[#F0F7F3] font-semibold text-[#137A5C] transition-colors hover:bg-[#E7F3ED] disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        width: compact ? 20 : 22,
        height: compact ? 20 : 22,
      }}
      aria-label={label}
      title={label}
    >
      <Sparkles size={compact ? 10 : 11} className={isLoading ? "animate-pulse" : ""} />
    </button>
  );
}

function NewsAiDialog({
  item,
  isLoading,
  error,
  onClose,
  onRetry,
}: {
  item: NewsItem;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}) {
  const priority = getNewsPriority(item);
  const meta = PRIORITY_META[priority];
  const summary = item.ai_summary?.trim();
  const whyRelevant = item.ai_why_relevant?.trim();
  const nextSteps = getNewsAiNextSteps(item);
  const hasInsight = hasNewsAiInsight(item);
  const sourceUrl = item.source_url?.trim();

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(20,20,18,.36)] px-4 py-6"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="AI news summary"
        className="max-h-[86vh] w-full max-w-[680px] overflow-y-auto rounded-[18px] border border-border bg-card shadow-[0_24px_80px_rgba(20,20,18,.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4 border-b border-border px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#CFE3DC] bg-[#F0F7F3] text-[#137A5C]">
            <Sparkles size={17} className={isLoading ? "animate-pulse" : ""} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[color:var(--metadata)]">
              <span className="inline-flex items-center gap-1 font-semibold tracking-wide" style={{ color: meta.color }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                {meta.label}
              </span>
              <span aria-hidden>·</span>
              <span>{item.source || "News"}</span>
              <span aria-hidden>·</span>
              <span>{formatNewsTime(item)}</span>
            </div>
            <h2 className="mt-2 text-[22px] font-semibold leading-tight text-foreground">
              {item.headline || "Untitled update"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close AI summary"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[color:var(--secondary)] transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5">
          {isLoading ? (
            <div className="rounded-[14px] border border-[#CFE3DC] bg-[#F0F7F3] px-4 py-5 text-[13px] font-medium text-[#137A5C]">
              Canopy is preparing an NGO-specific summary for this story...
            </div>
          ) : error ? (
            <div className="rounded-[14px] border border-[#FBE9E7] bg-[#FBE9E7] px-4 py-4">
              <p className="text-[13px] font-medium text-[#CC4444]">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#CC4444]"
              >
                Retry AI summary
              </button>
            </div>
          ) : hasInsight ? (
            <div className="space-y-4">
              {summary && (
                <AiDialogSection title="AI summary">
                  <p>{summary}</p>
                </AiDialogSection>
              )}
              {whyRelevant && (
                <AiDialogSection title="Why it matters">
                  <p>{whyRelevant}</p>
                </AiDialogSection>
              )}
              <AiDialogSection title="Next steps">
                {nextSteps.length > 0 ? (
                  <ul className="space-y-2">
                    {nextSteps.map((step, index) => (
                      <li key={`${index}-${step}`} className="flex gap-2">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A06B]" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Review the source article and decide whether it affects current work.</p>
                )}
              </AiDialogSection>
            </div>
          ) : (
            <div className="rounded-[14px] border border-border bg-muted/40 px-4 py-4">
              <p className="text-[13px] text-[color:var(--secondary)]">
                No AI summary is available yet.
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 rounded-full bg-[#16A06B] px-3 py-1 text-[12px] font-semibold text-white"
              >
                Generate AI summary
              </button>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ color: meta.color, background: meta.bg }}
            >
              {formatNewsTopic(item.topic)}
            </span>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#CFE3DC] px-3 py-1 text-[12px] font-semibold text-[#137A5C] transition-colors hover:bg-[#F0F7F3]"
              >
                Open source <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function AiDialogSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[14px] border border-[#CFE3DC] bg-[#F0F7F3] p-4 text-[13px] leading-relaxed text-[#31443D]">
      <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#137A5C]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function hasNewsAiInsight(item: NewsItem) {
  return Boolean(
    item.ai_summary?.trim() ||
      item.ai_why_relevant?.trim() ||
      getNewsAiNextSteps(item).length > 0,
  );
}

function getNewsAiNextSteps(item: NewsItem) {
  return Array.isArray(item.ai_next_steps)
    ? item.ai_next_steps.map((step) => step.trim()).filter(Boolean).slice(0, 3)
    : [];
}

function TopicRow({
  item,
  meta,
  compact = false,
}: {
  item: NewsItem;
  meta: (typeof PRIORITY_META)[NewsPriority];
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "mt-2" : "mt-4"}`}>
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{ color: meta.color, background: meta.bg }}
      >
        {formatNewsTopic(item.topic)}
      </span>
    </div>
  );
}

function getSnippet(item: NewsItem) {
  return item.snippet?.trim() || null;
}

function clampStyle(lines: number) {
  return {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: lines,
    overflow: "hidden",
  } as const;
}

function NewsLoading() {
  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="overflow-hidden rounded-[18px] border border-border bg-card">
          <div className="h-[280px] w-full bg-[#F4F3EE]" />
          <div className="p-5">
            <div className="h-3 w-40 rounded bg-[#F4F3EE]" />
            <div className="mt-4 h-8 w-full rounded bg-[#F4F3EE]" />
            <div className="mt-2 h-8 w-3/4 rounded bg-[#F4F3EE]" />
            <div className="mt-4 h-4 w-2/3 rounded bg-[#F4F3EE]" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 rounded-[16px] border border-border bg-card p-3"
            >
              <div className="h-[86px] rounded-[12px] bg-[#F4F3EE]" />
              <div>
                <div className="h-3 w-28 rounded bg-[#F4F3EE]" />
                <div className="mt-3 h-4 w-full rounded bg-[#F4F3EE]" />
                <div className="mt-2 h-4 w-3/4 rounded bg-[#F4F3EE]" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-[16px] border border-border bg-card">
            <div className="h-[150px] w-full bg-[#F4F3EE]" />
            <div className="p-4">
              <div className="h-3 w-32 rounded bg-[#F4F3EE]" />
              <div className="mt-3 h-5 w-full rounded bg-[#F4F3EE]" />
              <div className="mt-2 h-5 w-2/3 rounded bg-[#F4F3EE]" />
            </div>
          </div>
        ))}
      </section>
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
