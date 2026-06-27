import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  Mail,
  Send,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
} from "lucide-react";
import { useNgoStore, NGOS, type NgoId } from "@/lib/ngo-store";
import { items as ALL_ITEMS, type Item, type Category, type Urgency } from "@/data/items";

export const Route = createFileRoute("/inbox")({
  head: () => ({ meta: [{ title: "Inbox · CANOPY" }] }),
  component: Inbox,
});

type CategoryFilter = "all" | Category;

const URGENCY_RANK: Record<Urgency, number> = { red: 0, yellow: 1, green: 2 };

const URGENCY_META: Record<Urgency, { label: string; color: string; borderClass: string }> = {
  red: { label: "URGENT", color: "#DC2626", borderClass: "border-l-[#DC2626]" },
  yellow: { label: "RELEVANT", color: "#D97706", borderClass: "border-l-[#D97706]" },
  green: { label: "INFO", color: "#059669", borderClass: "border-l-[#059669]" },
};

const CATEGORY_LABEL: Record<Category, string> = {
  news: "News",
  funding: "Funding",
  report: "Report",
};

const LANG_LABEL: Record<"fr" | "en" | "de", string> = {
  fr: "FR",
  en: "EN",
  de: "DE",
};

function formatDate(iso: string): string {
  const dt = new Date(iso);
  const day = String(dt.getUTCDate()).padStart(2, "0");
  const month = dt.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const year = dt.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

function daysUntil(iso: string): number {
  const target = new Date(iso).getTime();
  const today = new Date("2026-06-27T00:00:00Z").getTime();
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function Inbox() {
  const current = useNgoStore((s) => s.current);
  const setNgo = useNgoStore((s) => s.setNgo);

  if (!current) {
    throw redirect({ to: "/" });
  }

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [activeTopics, setActiveTopics] = useState<string[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // Reset filters when switching NGO
  useEffect(() => {
    setCategoryFilter("all");
    setActiveTopics([]);
  }, [current.id]);

  const ngoItems = useMemo(
    () => ALL_ITEMS.filter((i) => i.ngo_id === current.id),
    [current.id],
  );

  const hasUrgentRed = ngoItems.some((i) => i.urgency === "red");

  const filtered = useMemo(() => {
    let list = ngoItems;
    if (categoryFilter !== "all") {
      list = list.filter((i) => i.category === categoryFilter);
    }
    if (activeTopics.length > 0) {
      list = list.filter((i) => i.topic_tags.some((t) => activeTopics.includes(t)));
    }
    return [...list].sort((a, b) => {
      const u = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
      if (u !== 0) return u;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
  }, [ngoItems, categoryFilter, activeTopics]);

  const filtersActive = categoryFilter !== "all" || activeTopics.length > 0;

  const toggleTopic = (t: string) =>
    setActiveTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const clearAll = () => {
    setCategoryFilter("all");
    setActiveTopics([]);
  };

  const switchNgo = (id: NgoId) => {
    setNgo(NGOS[id]);
    setSwitcherOpen(false);
  };

  const markRead = (id: string) =>
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-8">
          <div className="text-[15px] font-semibold tracking-tight text-foreground">CANOPY</div>

          {/* NGO switcher */}
          <div className="relative">
            <button
              onClick={() => setSwitcherOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:border-[color:var(--accent)]"
            >
              {current.name}
              <ChevronDown size={14} className="text-[color:var(--metadata)]" />
            </button>
            {switcherOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setSwitcherOpen(false)}
                  aria-hidden
                />
                <div className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-md border border-border bg-card shadow-md">
                  {(["bk", "wtg"] as NgoId[]).map((id) => (
                    <button
                      key={id}
                      onClick={() => switchNgo(id)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary"
                    >
                      {NGOS[id].name}
                      {current.id === id && (
                        <Check size={14} className="text-[color:var(--accent)]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => console.log("open today's email")}
              className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--accent)] px-3 py-1.5 text-sm font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent)]/5"
            >
              <Mail size={14} />
              Today's Email
            </button>
            <button
              onClick={() => console.log("notifications")}
              className="relative flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--metadata)] hover:bg-secondary"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {hasUrgentRed && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#DC2626]" />
              )}
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div className="border-t border-border bg-background">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-8 py-3">
            <div className="flex shrink-0 items-center gap-1.5">
              {(["all", "news", "funding", "report"] as const).map((c) => (
                <Chip
                  key={c}
                  active={categoryFilter === c}
                  onClick={() => setCategoryFilter(c)}
                >
                  {c === "all" ? "All" : c === "report" ? "Reports" : CATEGORY_LABEL[c]}
                </Chip>
              ))}
            </div>
            <div className="h-5 w-px bg-border" />
            <div className="flex flex-1 items-center gap-1.5 overflow-x-auto">
              {current.topics.map((t) => (
                <Chip key={t} active={activeTopics.includes(t)} onClick={() => toggleTopic(t)}>
                  {t}
                </Chip>
              ))}
            </div>
            {filtersActive && (
              <button
                onClick={clearAll}
                className="shrink-0 text-xs font-medium text-[color:var(--accent)] hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Feed */}
      <main className="mx-auto max-w-[720px] px-6 py-8">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center text-sm text-[color:var(--metadata)]">
            No items match these filters. Adjust filters or clear them.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((item) => (
              <CardItem
                key={item.id}
                item={item}
                ngoName={current.name}
                isRead={readIds.has(item.id)}
                onMarkRead={() => markRead(item.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
        (active
          ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
          : "border-border bg-card text-foreground hover:border-[color:var(--accent)]")
      }
    >
      {children}
    </button>
  );
}

function CardItem({
  item,
  ngoName,
  isRead,
  onMarkRead,
}: {
  item: Item;
  ngoName: string;
  isRead: boolean;
  onMarkRead: () => void;
}) {
  const meta = URGENCY_META[item.urgency];
  const translated = item.source_language !== "en";

  return (
    <article
      className={
        "rounded-xl border border-border border-l-4 bg-card p-4 transition-opacity " +
        meta.borderClass +
        (isRead ? " opacity-70" : "")
      }
    >
      {/* Top metadata row */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[color:var(--metadata)]">
        <span
          className="inline-flex items-center gap-1 font-semibold tracking-wide"
          style={{ color: meta.color }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          {meta.label}
        </span>
        <span aria-hidden>·</span>
        <span className="rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-foreground">
          {CATEGORY_LABEL[item.category]}
        </span>
        <span aria-hidden>·</span>
        <span>
          {item.source}
          {translated && (
            <span className="ml-1 text-[color:var(--metadata)]">
              · {LANG_LABEL[item.source_language]}→EN
            </span>
          )}
        </span>
        <span aria-hidden>·</span>
        <span>{formatDate(item.published_at)}</span>
      </div>

      {/* Title */}
      <h3 className="mt-2 text-[16px] font-semibold leading-snug text-foreground">
        {item.translated_title}
      </h3>

      {/* Funding strip */}
      {item.category === "funding" && (
        <FundingStrip item={item} />
      )}

      {/* Summary */}
      <p className="mt-2 text-[14px] leading-relaxed text-foreground">{item.summary}</p>

      {/* Why relevant */}
      <p className="mt-3 text-[13px] italic text-[color:var(--metadata)]">
        Why this matters for {ngoName}: {item.why_relevant}
      </p>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-1">
        <IconBtn
          label={isRead ? "Mark as unread" : "Mark as read"}
          onClick={() => {
            console.log("mark-as-read", item.id);
            onMarkRead();
          }}
        >
          <Check size={15} />
        </IconBtn>
        <IconBtn label="Save" onClick={() => console.log("save", item.id)}>
          <Bookmark size={15} />
        </IconBtn>
        <IconBtn label="Send to team" onClick={() => console.log("send", item.id)}>
          <Send size={15} />
        </IconBtn>
        <button
          onClick={() => console.log("open", item.id)}
          className="ml-2 text-[13px] font-semibold text-[color:var(--accent)] hover:underline"
        >
          Open
        </button>
      </div>
    </article>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--metadata)] hover:bg-secondary hover:text-foreground"
    >
      {children}
    </button>
  );
}

function FundingStrip({ item }: { item: Item }) {
  const verdict = item.eligibility_verdict;
  const deadline = item.funding_deadline;
  const days = deadline ? daysUntil(deadline) : null;
  const urgent = days !== null && days <= 7 && days >= 0;

  const amount =
    item.funding_amount_min && item.funding_amount_max
      ? `€${Math.round(item.funding_amount_min / 1000)}k to €${Math.round(item.funding_amount_max / 1000)}k`
      : null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[color:var(--metadata)]">
      {deadline &&
        (urgent ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626]/10 px-2 py-0.5 text-[11px] font-semibold text-[#DC2626]">
            ⏰ {days} {days === 1 ? "day" : "days"} left
          </span>
        ) : (
          <span>Deadline: {formatDate(deadline)}</span>
        ))}
      {amount && (
        <>
          {deadline && <span aria-hidden>·</span>}
          <span>{amount}</span>
        </>
      )}
      {verdict && (
        <>
          <span aria-hidden>·</span>
          <span className="text-[color:var(--metadata)]">Eligible?</span>
          <VerdictPill verdict={verdict} />
        </>
      )}
    </div>
  );
}

function VerdictPill({ verdict }: { verdict: "yes" | "check" | "no" }) {
  if (verdict === "yes") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#059669]/10 px-2 py-0.5 text-[11px] font-semibold text-[#059669]">
        <CheckCircle2 size={12} /> Yes
      </span>
    );
  }
  if (verdict === "check") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#D97706]/10 px-2 py-0.5 text-[11px] font-semibold text-[#D97706]">
        <AlertTriangle size={12} /> Check
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626]/10 px-2 py-0.5 text-[11px] font-semibold text-[#DC2626]">
      <XCircle size={12} /> No
    </span>
  );
}
