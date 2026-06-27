import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Coins,
  FileText,
  Languages,
  Newspaper,
  Upload,
} from "lucide-react";
import { TopBar } from "@/components/canopy/TopBar";
import { VerdictPill } from "@/components/canopy/CardItem";
import { URGENCY_META, URGENCY_RANK, formatDate } from "@/components/canopy/shared";
import { useNgoStore } from "@/lib/ngo-store";
import { useItemsStore } from "@/lib/items-store";
import type { Category, Item } from "@/data/items";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · CANOPY" }] }),
  component: Dashboard,
});

function Dashboard() {
  const current = useNgoStore((s) => s.current);
  if (!current) throw redirect({ to: "/" });

  const items = useItemsStore((s) => s.items);
  const ngoItems = useMemo(
    () => items.filter((i) => i.ngo_id === current.id),
    [items, current.id],
  );

  const previewBy = (cat: Category, n = 3) =>
    [...ngoItems.filter((i) => i.category === cat)]
      .sort((a, b) => {
        const u = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
        if (u !== 0) return u;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      })
      .slice(0, n);

  const recentTranslations = [...ngoItems.filter(
    (i) => i.category === "report" && i.source_language !== "en",
  )]
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          <Widget
            colSpan={6}
            icon={<Newspaper size={18} />}
            title="News Monitor"
            subtitle="Latest news from your countries and topics"
            to="/news"
          >
            <PreviewList items={previewBy("news")} to="/news" />
          </Widget>

          <Widget
            colSpan={6}
            icon={<Coins size={18} />}
            title="Funding Opportunities"
            subtitle="Open calls, grants, and prizes you can apply for"
            to="/funding"
          >
            <PreviewList items={previewBy("funding")} to="/funding" showEligibility />
          </Widget>

          <Widget
            colSpan={6}
            icon={<FileText size={18} />}
            title="Reports and Documents"
            subtitle="Field reports, partner updates, and your uploads"
            to="/reports"
          >
            <PreviewList items={previewBy("report")} to="/reports" />
          </Widget>

          <Widget
            colSpan={6}
            icon={<Languages size={18} />}
            title="Translator"
            subtitle="Drop a French or local-language document, get a clean English summary"
            to="/translator"
          >
            <TranslatorWidgetBody recent={recentTranslations} />
          </Widget>
        </div>
      </main>
    </div>
  );
}

function Widget({
  colSpan,
  icon,
  title,
  subtitle,
  to,
  children,
}: {
  colSpan: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  to: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`col-span-${colSpan} group rounded-xl border border-border bg-card p-5`}
      style={{ gridColumn: `span ${colSpan} / span ${colSpan}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[color:var(--metadata)] group-hover:text-[color:var(--accent)]">
            {icon}
          </span>
          <h2 className="text-[16px] font-semibold text-foreground">{title}</h2>
        </div>
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[color:var(--accent)] hover:underline"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>
      <p className="mt-1 text-[12px] text-[color:var(--metadata)]">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PreviewList({
  items,
  to,
  showEligibility,
}: {
  items: Item[];
  to: string;
  showEligibility?: boolean;
}) {
  const navigate = useNavigate();
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-[12px] text-[color:var(--metadata)]">
        Nothing to show yet.
      </div>
    );
  }
  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item.id}>
          <button
            onClick={() => navigate({ to })}
            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-[#FAFAF8]"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: URGENCY_META[item.urgency].color }}
            />
            <span className="min-w-0 flex-1 truncate text-[14px] text-foreground">
              {item.translated_title}
            </span>
            {showEligibility && item.eligibility_verdict && (
              <VerdictPill verdict={item.eligibility_verdict} />
            )}
            <span className="shrink-0 text-[12px] text-[color:var(--metadata)]">
              {item.source} · {formatDate(item.published_at)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function TranslatorWidgetBody({ recent }: { recent: Item[] }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => navigate({ to: "/translator" })}
        className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-[#FAFAF8] px-4 py-6 text-center text-[13px] text-[color:var(--metadata)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
      >
        <Upload size={20} />
        Drag a PDF or DOCX here, or click to upload
      </button>
      {recent.length > 0 && (
        <ul className="flex flex-col">
          {recent.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => navigate({ to: "/translator" })}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-[#FAFAF8]"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: URGENCY_META[item.urgency].color }}
                />
                <span className="min-w-0 flex-1 truncate text-[14px] text-foreground">
                  {item.translated_title}
                </span>
                <span className="shrink-0 text-[12px] text-[color:var(--metadata)]">
                  {item.source} · {formatDate(item.published_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
