import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bookmark, Check, ChevronDown, ExternalLink, Languages, X } from "lucide-react";
import { useNgoStore } from "@/lib/ngo-store";
import { useItemsStore } from "@/lib/items-store";
import type { Item, Urgency } from "@/data/items";

type Search = { id?: string };

export const Route = createFileRoute("/inbox")({
  head: () => ({ meta: [{ title: "Inbox · Canopy" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  component: InboxPage,
});

const FONT_STACK =
  '"Schibsted Grotesk", -apple-system, "Helvetica Neue", Arial, sans-serif';

const NOW_REF = new Date("2026-06-27T08:00:00Z").getTime();

const DOT: Record<Urgency, { dot: string; ring: string }> = {
  red: { dot: "#E0533D", ring: "rgba(224,83,61,.14)" },
  yellow: { dot: "#E8A53D", ring: "rgba(232,165,61,.14)" },
  green: { dot: "#2FA36B", ring: "rgba(47,163,107,.14)" },
};

const PRIORITY_PILL: Record<Urgency, { color: string; bg: string; label: string }> = {
  red: { color: "#CC4444", bg: "#FBE9E7", label: "Urgent" },
  yellow: { color: "#B07814", bg: "#FBF1DC", label: "Relevant" },
  green: { color: "#2C7A55", bg: "#E6F2EB", label: "Info" },
};

function timeAgo(iso: string): string {
  const diff = NOW_REF - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function initials(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function InboxPage() {
  const current = useNgoStore((s) => s.current);
  if (!current) throw redirect({ to: "/" });

  const items = useItemsStore((s) => s.items);
  const navigate = useNavigate();
  const search = Route.useSearch();

  const list = useMemo(() => {
    const rank = { red: 0, yellow: 1, green: 2 } as const;
    return items
      .filter((i) => i.ngo_id === current.id)
      .sort((a, b) => {
        const u = rank[a.urgency] - rank[b.urgency];
        if (u !== 0) return u;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });
  }, [items, current.id]);

  const [filter, setFilter] = useState<"all" | Urgency>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => (filter === "all" ? list : list.filter((i) => i.urgency === filter)),
    [list, filter],
  );

  // Resolve selected item
  const selected: Item | undefined = useMemo(() => {
    if (search.id) {
      const hit = list.find((i) => i.id === search.id);
      if (hit) return hit;
    }
    return filtered[0] ?? list[0];
  }, [search.id, list, filtered]);

  // Sync default id to URL (replace, no scroll)
  useEffect(() => {
    if (selected && search.id !== selected.id) {
      navigate({
        to: "/inbox",
        search: { id: selected.id },
        replace: true,
        resetScroll: false,
      });
    }
  }, [selected, search.id, navigate]);

  const selectItem = (id: string) =>
    navigate({ to: "/inbox", search: { id }, replace: true, resetScroll: false });

  const clearSelection = () =>
    navigate({ to: "/inbox", search: {}, replace: true, resetScroll: false });

  const toggleRead = (id: string) =>
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const urgentCount = list.filter((i) => i.urgency === "red").length;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "#F2F1EC", fontFamily: FONT_STACK, color: "#1B1B17" }}
    >
      <TopNav />

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 56px)" }}>
        {/* LEFT PANEL */}
        <aside
          className="flex shrink-0 flex-col"
          style={{ width: 380, background: "#FFFFFF", borderRight: "1px solid #EBEAE4" }}
        >
          <div
            className="flex items-center gap-2"
            style={{ padding: "18px 20px", borderBottom: "1px solid #EBEAE4" }}
          >
            <Link
              to="/dashboard"
              aria-label="Back to dashboard"
              className="flex items-center justify-center hover:bg-[#F4F3EE]"
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                color: "#3A3A34",
                marginLeft: -6,
              }}
            >
              <ArrowLeft size={16} strokeWidth={1.8} />
            </Link>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-.02em",
                color: "#1B1B17",
              }}
            >
              Inbox
            </h1>
            {urgentCount > 0 && (
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  background: "#E0533D",
                  borderRadius: 999,
                  padding: "2px 8px",
                  lineHeight: 1.4,
                }}
              >
                {urgentCount}
              </span>
            )}
            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                className="inline-flex items-center gap-1.5"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E6E5DF",
                  borderRadius: 999,
                  padding: "5px 10px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#1B1B17",
                }}
              >
                {filter === "all"
                  ? "All items"
                  : filter === "red"
                    ? "Urgent"
                    : filter === "yellow"
                      ? "Relevant"
                      : "Info"}
                <ChevronDown size={13} style={{ color: "#9B9B90" }} />
              </button>
              {filterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setFilterOpen(false)}
                    aria-hidden
                  />
                  <div
                    className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #EBEAE4",
                      borderRadius: 12,
                      boxShadow: "0 14px 30px -16px rgba(20,20,18,.25)",
                    }}
                  >
                    {(
                      [
                        ["all", "All items"],
                        ["red", "Urgent"],
                        ["yellow", "Relevant"],
                        ["green", "Info"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setFilter(id);
                          setFilterOpen(false);
                        }}
                        className="flex w-full items-center justify-between hover:bg-[#FAF9F5]"
                        style={{ padding: "8px 12px", fontSize: 13, color: "#1B1B17" }}
                      >
                        {label}
                        {filter === id && <Check size={13} style={{ color: "#16A06B" }} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto">
            {filtered.map((it) => {
              const isSel = selected?.id === it.id;
              const dot = DOT[it.urgency];
              const pill = PRIORITY_PILL[it.urgency];
              const read = readIds.has(it.id);
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => selectItem(it.id)}
                    className="w-full text-left transition-colors"
                    style={{
                      padding: "14px 20px 14px 17px",
                      borderBottom: "1px solid #F4F3EE",
                      borderLeft: isSel ? "3px solid #16A06B" : "3px solid transparent",
                      background: isSel ? "#F0F7F3" : "transparent",
                      opacity: read && !isSel ? 0.7 : 1,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSel) e.currentTarget.style.background = "#FAF9F5";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSel) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: dot.dot,
                          boxShadow: `0 0 0 3px ${dot.ring}`,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#22221E",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {it.source}
                      </span>
                      <span
                        className="ml-auto"
                        style={{ fontSize: 12, color: "#9B9B90", flexShrink: 0 }}
                      >
                        {timeAgo(it.published_at)}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#22221E",
                        lineHeight: 1.35,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {it.translated_title}
                    </div>
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 13,
                        color: "#6E6E64",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {it.summary}
                    </div>
                    <div className="mt-2">
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: pill.color,
                          background: pill.bg,
                          borderRadius: 7,
                          padding: "3px 9px",
                        }}
                      >
                        {pill.label}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#9B9B90",
                  fontSize: 13,
                }}
              >
                No items match this filter.
              </li>
            )}
          </ul>
        </aside>

        {/* RIGHT PANEL */}
        <section
          className="flex flex-1 flex-col"
          style={{ background: "#FFFFFF", minWidth: 0 }}
        >
          {selected ? (
            <DetailPane
              item={selected}
              isRead={readIds.has(selected.id)}
              onToggleRead={() => toggleRead(selected.id)}
              onClose={clearSelection}
              ngoName={current.name}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p style={{ color: "#9B9B90", fontSize: 14 }}>Select an item to read</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DetailPane({
  item,
  isRead,
  onToggleRead,
  onClose,
  ngoName,
}: {
  item: Item;
  isRead: boolean;
  onToggleRead: () => void;
  onClose: () => void;
  ngoName: string;
}) {
  const pill = PRIORITY_PILL[item.urgency];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* Title bar */}
        <div
          className="flex items-start gap-4"
          style={{ padding: "20px 28px", borderBottom: "1px solid #EBEAE4" }}
        >
          <h2
            className="flex-1"
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-.02em",
              color: "#1B1B17",
              lineHeight: 1.25,
            }}
          >
            {item.translated_title}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onToggleRead}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#3A3A34",
                background: "#FFFFFF",
                border: "1px solid #E6E5DF",
                borderRadius: 9,
                padding: "6px 14px",
              }}
            >
              {isRead ? "Mark as unread" : "Mark as read"}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex items-center justify-center hover:bg-[#F4F3EE]"
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                color: "#3A3A34",
              }}
            >
              <X size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div
          className="flex items-center gap-4"
          style={{ padding: "16px 28px", borderBottom: "1px solid #F4F3EE" }}
        >
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "#F2F1EC",
              fontSize: 13,
              fontWeight: 600,
              color: "#6E6E64",
            }}
          >
            {initials(item.source)}
          </div>
          <div className="flex items-center gap-2 text-[14px]">
            <span style={{ fontWeight: 600, color: "#22221E" }}>{item.source}</span>
            <span style={{ color: "#9B9B90" }}>·</span>
            <span style={{ fontSize: 13, color: "#9B9B90" }}>{timeAgo(item.published_at)}</span>
          </div>
          <span
            className="ml-auto"
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: pill.color,
              background: pill.bg,
              borderRadius: 7,
              padding: "4px 10px",
            }}
          >
            {pill.label}
          </span>
        </div>

        {/* Tags */}
        {item.topic_tags.length > 0 && (
          <div
            className="flex flex-wrap gap-1.5"
            style={{ padding: "12px 28px", borderBottom: "1px solid #F4F3EE" }}
          >
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: "#6E6E64",
                background: "#F2F1EC",
                borderRadius: 7,
                padding: "3px 9px",
                textTransform: "capitalize",
              }}
            >
              {item.category}
            </span>
            {item.topic_tags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11.5,
                  fontWeight: 500,
                  color: "#6E6E64",
                  background: "#F2F1EC",
                  borderRadius: 7,
                  padding: "3px 9px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "24px 28px" }}>
          <Section label="Why relevant">
            <div
              style={{
                background: "#F8F8F5",
                borderRadius: 10,
                padding: "14px 16px",
                borderLeft: "3px solid #16A06B",
                fontSize: 15,
                color: "#3A3A34",
                lineHeight: 1.65,
              }}
            >
              {item.why_relevant} <span style={{ color: "#9B9B90" }}>· for {ngoName}</span>
            </div>
          </Section>

          <Divider />

          <Section label="Full summary">
            <p style={{ fontSize: 15, color: "#3A3A34", lineHeight: 1.65 }}>
              {item.full_summary}
            </p>
          </Section>

          {item.next_steps.length > 0 && (
            <>
              <Divider />
              <Section label="Next steps">
                <ul className="flex flex-col gap-2">
                  {item.next_steps.map((s, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 15,
                        color: "#3A3A34",
                        lineHeight: 1.65,
                        paddingLeft: 22,
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "#16A06B",
                          fontWeight: 600,
                        }}
                      >
                        →
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          )}
        </div>
      </div>

      {/* Sticky action bar */}
      <div
        className="flex items-center gap-2.5 shrink-0"
        style={{
          padding: "14px 28px",
          borderTop: "1px solid #EBEAE4",
          background: "#FFFFFF",
        }}
      >
        <ActionBtn icon={<Languages size={14} />} accent>
          Translate
        </ActionBtn>
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: "#3A3A34",
            background: "#FFFFFF",
            border: "1px solid #E6E5DF",
            borderRadius: 9,
            padding: "7px 14px",
          }}
        >
          <ExternalLink size={14} />
          Open source
        </a>
        <ActionBtn icon={<Bookmark size={14} />}>Save</ActionBtn>
      </div>
    </div>
  );
}

function ActionBtn({
  children,
  icon,
  accent,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5"
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: accent ? "#137A5C" : "#3A3A34",
        background: "#FFFFFF",
        border: `1px solid ${accent ? "#CFE3DC" : "#E6E5DF"}`,
        borderRadius: 9,
        padding: "7px 14px",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: ".08em",
          color: "#A0A096",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#F4F3EE", margin: "20px 0" }} />;
}

function TopNav() {
  const current = useNgoStore((s) => s.current);
  if (!current) return null;
  return (
    <header
      className="sticky top-0 z-10"
      style={{
        background: "rgba(255,255,255,.86)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #E9E8E2",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "13px 26px", height: 56 }}
      >
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#16A06B",
              boxShadow: "0 0 0 3px rgba(22,160,107,.16)",
              display: "block",
            }}
          />
          <span
            style={{
              fontWeight: 700,
              letterSpacing: "0.15em",
              fontSize: 14,
              color: "#1B1B17",
            }}
          >
            CANOPY
          </span>
        </Link>
        <span style={{ fontSize: 13, color: "#6E6E64" }}>{current.name}</span>
      </div>
    </header>
  );
}
