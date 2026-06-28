import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, RefreshCw, Sparkles, X } from "lucide-react";
import { NewsMedia } from "@/components/canopy/NewsMedia";
import { useAuth } from "@/contexts/AuthContext";
import {
  analyzeNewsItem,
  generateNewsDigest,
  getNewsItems,
  getNewsPriority,
  refreshNewsItems,
  sortNewsItems,
  type NewsDigestResult,
  type NewsItem,
  type NewsPriority,
  type RefreshNewsResult,
} from "@/lib/api/news";
import { filterByTab, formatNewsTime, formatNewsTopic, type NewsTab } from "@/lib/news-utils";
import { Widget } from "./Widget";
import { ExpandOverlay } from "./ExpandOverlay";

const DOT_COLOR: Record<NewsPriority, string> = {
  red: "#E0533D",
  amber: "#E8A53D",
  green: "#2FA36B",
};

export function NewsWidget({ onRemove }: { onRemove?: () => void }) {
  const { org } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<NewsTab>("All");
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshSummary, setRefreshSummary] = useState<RefreshNewsResult | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzingItemId, setAnalyzingItemId] = useState<string | null>(null);
  const [selectedAiItemId, setSelectedAiItemId] = useState<string | null>(null);
  const [digest, setDigest] = useState<NewsDigestResult | null>(null);
  const [digestError, setDigestError] = useState<string | null>(null);
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
      setDigestError(null);
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
      setDigestError(null);
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

  const digestMutation = useMutation({
    mutationFn: generateNewsDigest,
    onMutate: () => {
      setDigestError(null);
    },
    onSuccess: (result) => {
      setDigest(result);
    },
    onError: (error) => {
      setDigestError(error instanceof Error ? error.message : "Could not generate daily digest.");
    },
  });

  const rows = useMemo(() => sortNewsItems(data ?? []), [data]);
  const selectedAiItem = selectedAiItemId
    ? rows.find((row) => row.id === selectedAiItemId) ?? null
    : null;
  const baseFiltered = useMemo(() => filterByTab(rows, tab), [rows, tab]);
  const compactRows = baseFiltered.slice(0, 6);

  const fullRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return baseFiltered;

    return baseFiltered.filter((row) =>
      [row.headline, row.source, row.topic].some((value) => value?.toLowerCase().includes(q)),
    );
  }, [baseFiltered, search]);

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
    <>
      <Widget
        title="News Monitor"
        onRemove={onRemove}
        onExpand={() => setExpanded(true)}
        headerRight={<Segment value={tab} onChange={setTab} options={["All", "Urgent", "Saved"]} />}
      >
        <NewsList
          rows={compactRows}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
        />
      </Widget>

      {expanded && (
        <ExpandOverlay
          title="News Monitor"
          onClose={() => {
            setExpanded(false);
            setSelectedAiItemId(null);
          }}
          headerRight={
            <Segment value={tab} onChange={setTab} options={["All", "Urgent", "Saved"]} />
          }
        >
          <div
            style={{
              padding: "12px 22px",
              borderBottom: "1px solid #EBEAE4",
              background: "#FFFFFF",
            }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search headlines..."
                className="min-w-[240px] flex-1 rounded-full border border-transparent bg-transparent px-0 py-2 transition-colors focus:border-[#CFE3DC] focus:bg-[#F7F6F1] focus:px-3"
                style={{
                  outline: "none",
                  fontSize: 16,
                  color: "#22221E",
                }}
              />
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                <WidgetActionButton
                  onClick={() => refreshMutation.mutate()}
                  disabled={refreshMutation.isPending || analyzeMutation.isPending || digestMutation.isPending}
                  variant="secondary"
                >
                  <RefreshCw size={12} className={refreshMutation.isPending ? "animate-spin" : ""} />
                  {refreshMutation.isPending ? "Refreshing..." : "Refresh news"}
                </WidgetActionButton>
                <WidgetActionButton
                  onClick={() => digestMutation.mutate()}
                  disabled={
                    refreshMutation.isPending ||
                    analyzeMutation.isPending ||
                    digestMutation.isPending ||
                    rows.length === 0
                  }
                  variant="primary"
                >
                  <Sparkles size={12} className={digestMutation.isPending ? "animate-pulse" : ""} />
                  {digestMutation.isPending ? "Preparing..." : "Daily digest"}
                </WidgetActionButton>
              </div>
            </div>
          </div>
          <WidgetActionStatus
            refreshSummary={refreshSummary}
            analysisMessage={analysisMessage}
            refreshError={refreshMutation.error}
            analysisError={analysisError}
            digestError={digestError}
          />
          <DailyDigestPanel digest={digest} />
          <ExpandedNewsFeed
            rows={fullRows}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            onAnalyze={handleAnalyze}
            analyzingItemId={analyzingItemId}
            analysisDisabled={
              refreshMutation.isPending || analyzeMutation.isPending || digestMutation.isPending
            }
          />
          {selectedAiItem && (
            <NewsAiDialog
              item={selectedAiItem}
              isLoading={analyzingItemId === selectedAiItem.id}
              error={analysisError}
              onClose={() => setSelectedAiItemId(null)}
              onRetry={retrySelectedAnalysis}
            />
          )}
        </ExpandOverlay>
      )}
    </>
  );
}

function WidgetActionButton({
  children,
  disabled,
  onClick,
  variant,
}: {
  children: ReactNode;
  disabled: boolean;
  onClick: () => void;
  variant: "primary" | "secondary";
}) {
  const primary = variant === "primary";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        background: primary ? "#16A06B" : "#FFFFFF",
        border: primary ? "1px solid #16A06B" : "1px solid #CFE3DC",
        color: primary ? "#FFFFFF" : "#137A5C",
      }}
    >
      {children}
    </button>
  );
}

function WidgetActionStatus({
  refreshSummary,
  analysisMessage,
  refreshError,
  analysisError,
  digestError,
}: {
  refreshSummary: RefreshNewsResult | null;
  analysisMessage: string | null;
  refreshError: Error | null;
  analysisError: string | null;
  digestError: string | null;
}) {
  const error = digestError ?? analysisError ?? refreshError?.message ?? null;

  if (error) {
    return (
      <p className="mt-2 text-[12px] font-medium text-[#CC4444]">
        {error || "News action failed. Please try again."}
      </p>
    );
  }

  if (analysisMessage) {
    return (
      <p className="mt-2 text-[12px] font-medium text-[#137A5C]">
        {analysisMessage}
      </p>
    );
  }

  if (refreshSummary) {
    return (
      <p className="mt-2 text-[12px] font-medium text-[#137A5C]">
        News refreshed. Added {refreshSummary.inserted}, updated {refreshSummary.updated}, skipped{" "}
        {refreshSummary.skipped}.
      </p>
    );
  }

  return null;
}

function DailyDigestPanel({ digest }: { digest: NewsDigestResult | null }) {
  if (!digest) return null;

  return (
    <section
      className="border-b border-[#EBEAE4] bg-[#F0F7F3]"
      style={{ padding: "14px 22px 16px" }}
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#137A5C]">
              Daily digest
            </div>
            <h3 className="mt-1 text-[18px] font-semibold leading-tight text-[#22221E]">
              {digest.title}
            </h3>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#137A5C]">
            {digest.articleCount} stories reviewed
          </span>
        </div>
        <p className="mt-3 max-w-[860px] text-[13px] leading-relaxed text-[#31443D]">
          {digest.overview}
        </p>
        {digest.categorySections.length > 0 && (
          <DigestCategorySections sections={digest.categorySections} />
        )}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <DigestList title="Urgent developments" items={digest.urgentDevelopments} />
          <DigestList title="Prepare for" items={digest.prepareFor} />
          <DigestList title="Opportunities" items={digest.opportunities} />
        </div>
      </div>
    </section>
  );
}

function DigestCategorySections({
  sections,
}: {
  sections: NewsDigestResult["categorySections"];
}) {
  return (
    <div className="mt-4 rounded-[14px] border border-[#CFE3DC] bg-white p-3">
      <div className="text-[12px] font-semibold text-[#137A5C]">WTG article brief</div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {sections.map((section) => (
          <section key={section.category} className="rounded-[12px] bg-[#F7F6F1] p-3">
            <h4 className="text-[12px] font-semibold text-[#22221E]">{section.category}</h4>
            <ul className="mt-2 space-y-1.5">
              {section.articles.map((article) => (
                <li key={`${section.category}-${article.url}`}>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex gap-1.5 text-[12px] font-medium leading-relaxed text-[#137A5C] hover:underline"
                  >
                    <span>{article.headline}</span>
                    <ExternalLink size={11} className="mt-[3px] shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function DigestList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[14px] border border-[#CFE3DC] bg-white p-3">
      <div className="text-[12px] font-semibold text-[#137A5C]">{title}</div>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, index) => (
            <li key={`${index}-${item}`} className="text-[12px] leading-relaxed text-[#31443D]">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[12px] text-[#6E6E64]">No specific items flagged.</p>
      )}
    </div>
  );
}

function NewsList({
  rows,
  isLoading,
  isError,
  onRetry,
}: {
  rows: NewsItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <ul className="flex flex-col">
        {Array.from({ length: 4 }).map((_, index) => (
          <li
            key={index}
            className="flex items-start gap-3"
            style={{
              padding: "13px 18px",
              borderTop: index === 0 ? "none" : "1px solid #F4F3EE",
            }}
          >
            <div className="h-[42px] w-[56px] shrink-0 rounded-[10px] bg-[#F4F3EE]" />
            <div className="min-w-0 flex-1">
              <div className="h-3 w-24 rounded bg-[#F4F3EE]" />
              <div className="mt-2 h-4 w-full rounded bg-[#F4F3EE]" />
              <div className="mt-2 h-5 w-20 rounded bg-[#F4F3EE]" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-[13px] text-[#9B9B90]">Could not load news right now.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-[13px] font-semibold text-[#137A5C] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {rows.map((row, index) => (
        <NewsListRow key={row.id} row={row} index={index} />
      ))}
      {rows.length === 0 && (
        <li
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#9B9B90",
            fontSize: 13,
          }}
        >
          No headlines match.
        </li>
      )}
    </ul>
  );
}

function NewsListRow({ row, index }: { row: NewsItem; index: number }) {
  const priority = getNewsPriority(row);
  const sourceUrl = row.source_url?.trim();
  const rowContent = (
    <>
      <NewsMedia
        imageUrl={row.image_url}
        imageAlt={row.image_alt || row.headline}
        sourceUrl={row.source_url}
        flag={row.country_flag}
        source={row.source}
        className="h-[42px] w-[56px] rounded-[10px]"
        flagClassName="h-[18px] w-[24px] rounded-[3px]"
        showSource={false}
      />
      <div className="min-w-0 flex-1">
        <div style={{ fontSize: 12, color: "#9B9B90" }}>
          <span style={{ color: "#83837A", fontWeight: 500 }}>{row.source || "News"}</span>
          {" · "}
          {formatNewsTime(row)}
        </div>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            lineHeight: 1.34,
            letterSpacing: "-0.005em",
            color: "#22221E",
            marginTop: 2,
          }}
        >
          {row.headline || "Untitled update"}
        </div>
        <div className="mt-2">
          <Chip>{formatNewsTopic(row.topic)}</Chip>
        </div>
      </div>
      <span
        className="shrink-0"
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: DOT_COLOR[priority],
          marginTop: 6,
        }}
      />
    </>
  );

  if (sourceUrl) {
    return (
      <li style={{ borderTop: index === 0 ? "none" : "1px solid #F4F3EE" }}>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-3 transition-colors hover:bg-[#FAF9F5] focus:outline-none focus:ring-2 focus:ring-[#16A06B]/25"
          style={{ padding: "13px 18px", textDecoration: "none" }}
          aria-label={`Open source for ${row.headline || "news item"}`}
        >
          {rowContent}
        </a>
      </li>
    );
  }

  return (
    <li
      className="flex items-start gap-3 transition-colors hover:bg-[#FAF9F5]"
      style={{ padding: "13px 18px", borderTop: index === 0 ? "none" : "1px solid #F4F3EE" }}
    >
      {rowContent}
    </li>
  );
}

function ExpandedNewsFeed({
  rows,
  isLoading,
  isError,
  onRetry,
  onAnalyze,
  analyzingItemId,
  analysisDisabled,
}: {
  rows: NewsItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onAnalyze: (item: NewsItem) => void;
  analyzingItemId: string | null;
  analysisDisabled: boolean;
}) {
  if (isLoading) return <ExpandedNewsLoading />;

  if (isError) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-[13px] text-[#9B9B90]">Could not load news right now.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-[13px] font-semibold text-[#137A5C] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="px-5 py-16 text-center text-[13px] text-[#9B9B90]">No headlines match.</div>
    );
  }

  const featured = rows.find((row) => Boolean(row.image_url?.trim())) ?? rows[0];
  const rest = rows.filter((row) => row.id !== featured.id);
  const topStories = rest.slice(0, 3);
  const cardStories = rest.slice(3);

  return (
    <div className="bg-[#F7F6F1] px-6 py-6">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <ExpandedFeaturedCard
            row={featured}
            onAnalyze={onAnalyze}
            analyzingItemId={analyzingItemId}
            analysisDisabled={analysisDisabled}
          />
          {topStories.length > 0 && (
            <div className="flex flex-col gap-3">
              {topStories.map((row) => (
                <ExpandedTopCard
                  key={row.id}
                  row={row}
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
            {cardStories.map((row) => (
              <ExpandedTileCard
                key={row.id}
                row={row}
                onAnalyze={onAnalyze}
                analyzingItemId={analyzingItemId}
                analysisDisabled={analysisDisabled}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function ExpandedFeaturedCard({
  row,
  onAnalyze,
  analyzingItemId,
  analysisDisabled,
}: {
  row: NewsItem;
  onAnalyze?: (item: NewsItem) => void;
  analyzingItemId?: string | null;
  analysisDisabled?: boolean;
}) {
  const priority = getNewsPriority(row);
  const snippet = row.snippet?.trim();

  return (
    <ExpandedArticleLink
      row={row}
      className="group block overflow-hidden rounded-[18px] border border-[#EBEAE4] bg-white shadow-[0_1px_2px_rgba(20,20,18,.04),0_14px_30px_-22px_rgba(20,20,18,.22)] transition-colors hover:bg-[#FAF9F5] focus:outline-none focus:ring-2 focus:ring-[#16A06B]/25"
    >
      <NewsMedia
        imageUrl={row.image_url}
        imageAlt={row.image_alt || row.headline}
        sourceUrl={row.source_url}
        flag={row.country_flag}
        source={row.source}
        className="h-[300px] w-full border-0"
        fallbackClassName="bg-[#E7F3ED]"
        flagClassName="h-12 w-16 rounded-[5px]"
      />
      <div className="p-5">
        <ExpandedMeta
          row={row}
          priority={priority}
          onAnalyze={onAnalyze}
          isAnalyzing={analyzingItemId === row.id}
          analysisDisabled={Boolean(analysisDisabled)}
        />
        <h2 className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-tight text-[#22221E]">
          {row.headline || "Untitled update"}
        </h2>
        {snippet && (
          <p
            className="mt-3 max-w-[760px] text-[14px] leading-relaxed text-[#6E6E64]"
            style={clampStyle(3)}
          >
            {snippet}
          </p>
        )}
        <ExpandedTopic row={row} priority={priority} />
      </div>
    </ExpandedArticleLink>
  );
}

function ExpandedTopCard({
  row,
  onAnalyze,
  analyzingItemId,
  analysisDisabled,
}: {
  row: NewsItem;
  onAnalyze: (item: NewsItem) => void;
  analyzingItemId: string | null;
  analysisDisabled: boolean;
}) {
  const priority = getNewsPriority(row);

  return (
    <ExpandedArticleLink
      row={row}
      className="group grid grid-cols-[116px_minmax(0,1fr)] gap-4 rounded-[16px] border border-[#EBEAE4] bg-white p-3 transition-colors hover:bg-[#FAF9F5] focus:outline-none focus:ring-2 focus:ring-[#16A06B]/25"
    >
      <NewsMedia
        imageUrl={row.image_url}
        imageAlt={row.image_alt || row.headline}
        sourceUrl={row.source_url}
        flag={row.country_flag}
        source={row.source}
        className="h-[90px] w-full rounded-[12px]"
        fallbackClassName="bg-[#F4F3EE]"
        flagClassName="h-7 w-10 rounded-[4px]"
        showSource={false}
      />
      <div className="min-w-0">
        <ExpandedMeta
          row={row}
          priority={priority}
          compact
          onAnalyze={onAnalyze}
          isAnalyzing={analyzingItemId === row.id}
          analysisDisabled={analysisDisabled}
        />
        <h3
          className="mt-2 text-[16px] font-semibold leading-snug text-[#22221E]"
          style={clampStyle(3)}
        >
          {row.headline || "Untitled update"}
        </h3>
        <ExpandedTopic row={row} priority={priority} compact />
      </div>
    </ExpandedArticleLink>
  );
}

function ExpandedTileCard({
  row,
  onAnalyze,
  analyzingItemId,
  analysisDisabled,
}: {
  row: NewsItem;
  onAnalyze: (item: NewsItem) => void;
  analyzingItemId: string | null;
  analysisDisabled: boolean;
}) {
  const priority = getNewsPriority(row);
  const snippet = row.snippet?.trim();

  return (
    <ExpandedArticleLink
      row={row}
      className="group flex min-h-full flex-col overflow-hidden rounded-[16px] border border-[#EBEAE4] bg-white transition-colors hover:bg-[#FAF9F5] focus:outline-none focus:ring-2 focus:ring-[#16A06B]/25"
    >
      <NewsMedia
        imageUrl={row.image_url}
        imageAlt={row.image_alt || row.headline}
        sourceUrl={row.source_url}
        flag={row.country_flag}
        source={row.source}
        className="h-[150px] w-full border-0"
        fallbackClassName="bg-[#F4F3EE]"
        flagClassName="h-10 w-14 rounded-[5px]"
      />
      <div className="flex flex-1 flex-col p-4">
        <ExpandedMeta
          row={row}
          priority={priority}
          compact
          onAnalyze={onAnalyze}
          isAnalyzing={analyzingItemId === row.id}
          analysisDisabled={analysisDisabled}
        />
        <h3
          className="mt-2 text-[17px] font-semibold leading-snug text-[#22221E]"
          style={clampStyle(3)}
        >
          {row.headline || "Untitled update"}
        </h3>
        {snippet && (
          <p className="mt-2 text-[13px] leading-relaxed text-[#6E6E64]" style={clampStyle(3)}>
            {snippet}
          </p>
        )}
        <div className="mt-auto">
          <ExpandedTopic row={row} priority={priority} compact />
        </div>
      </div>
    </ExpandedArticleLink>
  );
}

function ExpandedArticleLink({
  row,
  className,
  children,
}: {
  row: NewsItem;
  className: string;
  children: ReactNode;
}) {
  const sourceUrl = row.source_url?.trim();

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
        aria-label={`Open source for ${row.headline || "news item"}`}
      >
        {children}
      </article>
    );
  }

  return <article className={className}>{children}</article>;
}

function ExpandedMeta({
  row,
  priority,
  compact = false,
  onAnalyze,
  isAnalyzing = false,
  analysisDisabled = false,
}: {
  row: NewsItem;
  priority: NewsPriority;
  compact?: boolean;
  onAnalyze?: (item: NewsItem) => void;
  isAnalyzing?: boolean;
  analysisDisabled?: boolean;
}) {
  const color = DOT_COLOR[priority];
  const label = priority === "red" ? "URGENT" : priority === "amber" ? "RELEVANT" : "INFO";
  const analyzed = hasNewsAiInsight(row);

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[#9B9B90] ${
        compact ? "text-[11px]" : "text-[12px]"
      }`}
    >
      <span
        className="inline-flex items-center gap-1 font-semibold tracking-wide"
        style={{ color }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span aria-hidden>·</span>
      <span>{row.source || "News"}</span>
      <span aria-hidden>·</span>
      <span>{formatNewsTime(row)}</span>
      {onAnalyze && (
        <>
          <span aria-hidden>·</span>
          <InlineAnalyzeButton
            onClick={() => onAnalyze(row)}
            disabled={!analyzed && analysisDisabled}
            isLoading={isAnalyzing}
            analyzed={analyzed}
            compact={compact}
          />
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
  const color = DOT_COLOR[priority];
  const label = priority === "red" ? "URGENT" : priority === "amber" ? "RELEVANT" : "INFO";
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
        className="max-h-[86vh] w-full max-w-[680px] overflow-y-auto rounded-[18px] border border-[#EBEAE4] bg-white shadow-[0_24px_80px_rgba(20,20,18,.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4 border-b border-[#EBEAE4] px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#CFE3DC] bg-[#F0F7F3] text-[#137A5C]">
            <Sparkles size={17} className={isLoading ? "animate-pulse" : ""} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#9B9B90]">
              <span className="inline-flex items-center gap-1 font-semibold tracking-wide" style={{ color }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </span>
              <span aria-hidden>·</span>
              <span>{item.source || "News"}</span>
              <span aria-hidden>·</span>
              <span>{formatNewsTime(item)}</span>
            </div>
            <h2 className="mt-2 text-[22px] font-semibold leading-tight text-[#22221E]">
              {item.headline || "Untitled update"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close AI summary"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[#6E6E64] transition-colors hover:bg-[#F2F1EC] hover:text-[#22221E]"
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
            <div className="rounded-[14px] border border-[#EBEAE4] bg-[#F7F6F1] px-4 py-4">
              <p className="text-[13px] text-[#6E6E64]">No AI summary is available yet.</p>
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
              style={{
                color,
                background: priority === "red" ? "#FBE9E7" : priority === "amber" ? "#FBF1DC" : "#E7F3ED",
              }}
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

function ExpandedTopic({
  row,
  priority,
  compact = false,
}: {
  row: NewsItem;
  priority: NewsPriority;
  compact?: boolean;
}) {
  const color = DOT_COLOR[priority];
  const background = priority === "red" ? "#FBE9E7" : priority === "amber" ? "#FBF1DC" : "#E7F3ED";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "mt-2" : "mt-4"}`}>
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{ color, background }}
      >
        {formatNewsTopic(row.topic)}
      </span>
    </div>
  );
}

function ExpandedNewsLoading() {
  return (
    <div className="bg-[#F7F6F1] px-6 py-6">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="overflow-hidden rounded-[18px] border border-[#EBEAE4] bg-white">
            <div className="h-[300px] w-full bg-[#F4F3EE]" />
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
                className="grid grid-cols-[116px_minmax(0,1fr)] gap-4 rounded-[16px] border border-[#EBEAE4] bg-white p-3"
              >
                <div className="h-[90px] rounded-[12px] bg-[#F4F3EE]" />
                <div>
                  <div className="h-3 w-28 rounded bg-[#F4F3EE]" />
                  <div className="mt-3 h-4 w-full rounded bg-[#F4F3EE]" />
                  <div className="mt-2 h-4 w-3/4 rounded bg-[#F4F3EE]" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function clampStyle(lines: number) {
  return {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: lines,
    overflow: "hidden",
  } as const;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11.5,
        fontWeight: 500,
        color: "#6E6E64",
        background: "#F2F1EC",
        borderRadius: 7,
        padding: "3px 9px",
      }}
    >
      {children}
    </span>
  );
}

function Segment<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <div className="inline-flex" style={{ background: "#F2F1EC", borderRadius: 11, padding: 3 }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              color: active ? "#1B1B17" : "#9B9B90",
              background: active ? "#FFFFFF" : "transparent",
              boxShadow: active ? "0 1px 2px rgba(20,20,18,.10)" : "none",
              borderRadius: 8,
              padding: "5px 11px",
              transition: "all .15s",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
