import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/canopy/TopBar";
import { CardItem, Chip } from "@/components/canopy/CardItem";
import { URGENCY_RANK } from "@/components/canopy/shared";
import { useNgoStore } from "@/lib/ngo-store";
import { useItemsStore } from "@/lib/items-store";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "News Monitor · CANOPY" }] }),
  component: NewsRoute,
});

function NewsRoute() {
  return (
    <ProtectedRoute>
      <NewsView />
    </ProtectedRoute>
  );
}

function NewsView() {
  const current = useNgoStore((s) => s.current);
  if (!current) throw redirect({ to: "/login" });
  const items = useItemsStore((s) => s.items);
  const [activeTopics, setActiveTopics] = useState<string[]>([]);

  const list = useMemo(() => {
    let l = items.filter((i) => i.ngo_id === current.id && i.category === "news");
    if (activeTopics.length > 0) {
      l = l.filter((i) => i.topic_tags.some((t) => activeTopics.includes(t)));
    }
    return [...l].sort((a, b) => {
      const u = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
      if (u !== 0) return u;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
  }, [items, current.id, activeTopics]);

  const toggle = (t: string) =>
    setActiveTopics((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <DetailHeader title="News Monitor" subtitle={`All news items for ${current.name}`} />
      <div className="mx-auto max-w-[1200px] border-b border-border px-6 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip active disabled>News</Chip>
          <div className="mx-2 h-5 w-px bg-border" />
          {current.topics.map((t) => (
            <Chip key={t} active={activeTopics.includes(t)} onClick={() => toggle(t)}>
              {t}
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
      <main className="mx-auto max-w-[720px] px-6 py-8">
        {list.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-4">
            {list.map((i) => (
              <CardItem key={i.id} item={i} ngoName={current.name} />
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
      <h1 className="mt-3 text-[22px] font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-1 text-[13px] text-[color:var(--metadata)]">{subtitle}</p>
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
