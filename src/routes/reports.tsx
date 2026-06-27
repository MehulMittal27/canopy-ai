import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/canopy/TopBar";
import { CardItem, Chip } from "@/components/canopy/CardItem";
import { URGENCY_RANK } from "@/components/canopy/shared";
import { useNgoStore } from "@/lib/ngo-store";
import { useItemsStore } from "@/lib/items-store";
import { DetailHeader, EmptyState } from "./news";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · CANOPY" }] }),
  component: ReportsRoute,
});

function ReportsRoute() {
  return (
    <ProtectedRoute>
      <ReportsView />
    </ProtectedRoute>
  );
}

function ReportsView() {
  const current = useNgoStore((s) => s.current);
  if (!current) throw redirect({ to: "/login" });
  const items = useItemsStore((s) => s.items);
  const [activeTopics, setActiveTopics] = useState<string[]>([]);
  const [scope, setScope] = useState<"all" | "uploaded">("all");

  const list = useMemo(() => {
    let l = items.filter((i) => i.ngo_id === current.id && i.category === "report");
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
      <DetailHeader
        title="Reports and Documents"
        subtitle="Field reports, partner updates, and uploaded documents"
      />
      <div className="mx-auto max-w-[1200px] border-b border-border px-6 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {current.topics.map((t) => (
            <Chip key={t} active={activeTopics.includes(t)} onClick={() => toggle(t)}>
              {t}
            </Chip>
          ))}
          <div className="ml-auto flex overflow-hidden rounded-md border border-border">
            <ToggleBtn active={scope === "all"} onClick={() => setScope("all")}>
              All
            </ToggleBtn>
            <ToggleBtn active={scope === "uploaded"} onClick={() => setScope("uploaded")}>
              Uploaded by us
            </ToggleBtn>
          </div>
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

function ToggleBtn({
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
        "px-3 py-1 text-xs font-medium transition-colors " +
        (active
          ? "bg-[color:var(--accent)] text-white"
          : "bg-card text-foreground hover:bg-secondary")
      }
    >
      {children}
    </button>
  );
}
