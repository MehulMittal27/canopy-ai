import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  getNewsItems,
  getNewsPriority,
  sortNewsItems,
  type NewsItem,
  type NewsPriority,
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
  const [tab, setTab] = useState<NewsTab>("All");
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["news_items", org?.id],
    queryFn: getNewsItems,
    enabled: Boolean(org),
  });

  const rows = useMemo(() => sortNewsItems(data ?? []), [data]);
  const baseFiltered = useMemo(() => filterByTab(rows, tab), [rows, tab]);
  const compactRows = baseFiltered.slice(0, 6);

  const fullRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return baseFiltered;

    return baseFiltered.filter((row) =>
      [row.headline, row.source, row.topic].some((value) => value?.toLowerCase().includes(q)),
    );
  }, [baseFiltered, search]);

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
          onClose={() => setExpanded(false)}
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
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search headlines..."
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: 16,
                color: "#22221E",
                background: "transparent",
              }}
            />
          </div>
          <NewsList
            rows={fullRows}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
          />
        </ExpandOverlay>
      )}
    </>
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
            <div className="h-[34px] w-[34px] shrink-0 rounded-[9px] bg-[#F4F3EE]" />
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

  return (
    <li
      className="flex items-start gap-3 transition-colors hover:bg-[#FAF9F5]"
      style={{ padding: "13px 18px", borderTop: index === 0 ? "none" : "1px solid #F4F3EE" }}
    >
      <div
        className="flex shrink-0 items-center justify-center"
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: "#F4F3EE",
          border: "1px solid #ECEBE4",
          fontSize: 18,
        }}
      >
        {row.country_flag || "🌍"}
      </div>
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
    </li>
  );
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
