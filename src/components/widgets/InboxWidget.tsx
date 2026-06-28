import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getInboxItems } from "@/lib/api/inbox";
import { Widget } from "./Widget";
import { ExpandOverlay } from "./ExpandOverlay";
import { InboxLayout } from "@/components/inbox/InboxLayout";



const DOT_COLOR: Record<string, { dot: string; ring: string }> = {
  red: { dot: "#E0533D", ring: "rgba(224,83,61,.14)" },
  amber: { dot: "#E8A53D", ring: "rgba(232,165,61,.14)" },
  green: { dot: "#2FA36B", ring: "rgba(47,163,107,.14)" },
};

const TAG_STYLE: Record<string, { color: string; bg: string }> = {
  news: { color: "#6E6E64", bg: "#F2F1EC" },
  funding: { color: "#B07814", bg: "#FBF1DC" },
  report: { color: "#6E6E64", bg: "#F2F1EC" },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function InboxWidget({ onRemove }: { onRemove?: () => void }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["inbox_items"],
    queryFn: getInboxItems,
  });
  const rows = (data ?? []).slice(0, 6);

  const urgentCount = rows.filter((r) => r.urgency === "red").length;

  return (
    <>
    <Widget
      title="Inbox"
      onRemove={onRemove}
      onExpand={() => setExpanded(true)}
      headerRight={
        urgentCount > 0 ? (
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "#CC4444",
              background: "#FBE9E7",
              borderRadius: 999,
              padding: "4px 11px",
            }}
          >
            {urgentCount} urgent
          </span>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="px-5 py-6 text-[13px] text-[#9B9B90]">Loading inbox...</div>
      ) : error ? (
        <div className="px-5 py-6 text-[13px] text-[#CC4444]">Inbox could not load.</div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-6 text-[13px] text-[#9B9B90]">No inbox items yet.</div>
      ) : (
        <ul className="flex flex-col">
          {rows.map((it, idx) => {
          const dot = DOT_COLOR[it.urgency];
          const tag = TAG_STYLE[it.category] ?? TAG_STYLE.news;
          const tagLabel =
            it.urgency === "red"
              ? "Urgent"
              : it.category === "funding"
                ? "Funding"
                : it.category === "report"
                  ? "Report"
                  : "News";
          const tagColor =
            tagLabel === "Urgent"
              ? { color: "#CC4444", bg: "#FBE9E7" }
              : tagLabel === "Funding"
                ? { color: "#B07814", bg: "#FBF1DC" }
                : tag;
          return (
            <li
              key={it.id}
              className="transition-colors hover:bg-[#FAF9F5]"
              style={{
                padding: "15px 18px",
                borderTop: idx === 0 ? "none" : "1px solid #F4F3EE",
              }}
            >
              <button
                type="button"
                onClick={() => navigate({ to: "/inbox", search: { id: it.id } })}
                className="flex w-full items-start gap-3 text-left"
              >
                <span
                  className="shrink-0"
                  style={{
                    marginTop: 6,
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: dot.dot,
                    boxShadow: `0 0 0 3px ${dot.ring}`,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 600,
                      lineHeight: 1.34,
                      letterSpacing: "-0.005em",
                      color: "#22221E",
                    }}
                  >
                    {it.translated_title}
                  </div>
                  <div style={{ fontSize: 12, color: "#9B9B90", marginTop: 4 }}>
                    {it.source} · {fmt(it.published_at)}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#6E6E64",
                      lineHeight: 1.5,
                      marginTop: 6,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {it.summary}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 500,
                        color: tagColor.color,
                        background: tagColor.bg,
                        borderRadius: 7,
                        padding: "3px 9px",
                      }}
                    >
                      {tagLabel}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
          })}
        </ul>
      )}
    </Widget>
    {expanded && (
      <ExpandOverlay title="Inbox" onClose={() => setExpanded(false)}>
        <div style={{ height: "100%" }}>
          <InboxLayout embedded />
        </div>
      </ExpandOverlay>
    )}
    </>
  );
}
