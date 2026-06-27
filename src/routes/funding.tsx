import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/canopy/TopBar";
import { CardItem, Chip } from "@/components/canopy/CardItem";
import { URGENCY_RANK } from "@/components/canopy/shared";
import { useNgoStore } from "@/lib/ngo-store";
import { useItemsStore } from "@/lib/items-store";
import { DetailHeader, EmptyState } from "./news";

export const Route = createFileRoute("/funding")({
  head: () => ({ meta: [{ title: "Funding · CANOPY" }] }),
  component: FundingView,
});

type Sort = "urgency" | "deadline" | "eligibility";

const VERDICT_RANK: Record<string, number> = { yes: 0, check: 1, no: 2 };

function FundingView() {
  const current = useNgoStore((s) => s.current);
  if (!current) throw redirect({ to: "/login" });
  const items = useItemsStore((s) => s.items);
  const [activeTopics, setActiveTopics] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("urgency");

  const list = useMemo(() => {
    let l = items.filter((i) => i.ngo_id === current.id && i.category === "funding");
    if (activeTopics.length > 0) {
      l = l.filter((i) => i.topic_tags.some((t) => activeTopics.includes(t)));
    }
    const sorted = [...l];
    if (sort === "urgency") {
      sorted.sort((a, b) => {
        const u = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
        if (u !== 0) return u;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });
    } else if (sort === "deadline") {
      sorted.sort((a, b) => {
        const ad = a.funding_deadline ? new Date(a.funding_deadline).getTime() : Infinity;
        const bd = b.funding_deadline ? new Date(b.funding_deadline).getTime() : Infinity;
        return ad - bd;
      });
    } else {
      sorted.sort((a, b) => {
        const av = a.eligibility_verdict ? VERDICT_RANK[a.eligibility_verdict] : 99;
        const bv = b.eligibility_verdict ? VERDICT_RANK[b.eligibility_verdict] : 99;
        return av - bv;
      });
    }
    return sorted;
  }, [items, current.id, activeTopics, sort]);

  const toggle = (t: string) =>
    setActiveTopics((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <DetailHeader
        title="Funding Opportunities"
        subtitle={`Grants, calls, and prizes for ${current.name}`}
      />
      <div className="mx-auto max-w-[1200px] border-b border-border px-6 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {current.topics.map((t) => (
            <Chip key={t} active={activeTopics.includes(t)} onClick={() => toggle(t)}>
              {t}
            </Chip>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            <SortBtn active={sort === "urgency"} onClick={() => setSort("urgency")}>
              By urgency
            </SortBtn>
            <SortBtn active={sort === "deadline"} onClick={() => setSort("deadline")}>
              By deadline (soonest)
            </SortBtn>
            <SortBtn active={sort === "eligibility"} onClick={() => setSort("eligibility")}>
              By eligibility (Yes first)
            </SortBtn>
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

function SortBtn({
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
        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors " +
        (active
          ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
          : "border-border bg-card text-foreground hover:border-[color:var(--accent)]")
      }
    >
      {children}
    </button>
  );
}
