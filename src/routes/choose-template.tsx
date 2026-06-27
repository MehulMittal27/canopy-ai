import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { TopBar } from "@/components/canopy/TopBar";
import {
  DASH_TEMPLATES,
  WIDGET_META,
  useDashboardStore,
  type DashTemplateId,
  type GridItem,
} from "@/lib/dashboard-store";
import { useNgoStore } from "@/lib/ngo-store";

export const Route = createFileRoute("/choose-template")({
  head: () => ({ meta: [{ title: "Choose your layout · Canopy" }] }),
  component: ChooseTemplate,
});

function ChooseTemplate() {
  const current = useNgoStore((s) => s.current);
  if (!current) throw redirect({ to: "/login" });
  const apply = useDashboardStore((s) => s.applyTemplate);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<DashTemplateId | null>(null);

  const handleSelect = (id: DashTemplateId) => {
    setSelected(id);
    apply(current.id, id);
    setTimeout(() => navigate({ to: "/dashboard" }), 160);
  };



  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <TopBar />
      <main className="mx-auto max-w-[1100px] px-6 py-12">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-[#111827]">
            Choose your starting layout
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Pick the workspace that fits your team. You can always rearrange, add, or remove widgets later.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {(Object.values(DASH_TEMPLATES) as (typeof DASH_TEMPLATES)[DashTemplateId][]).map((t) => (
            <TemplateCard
              key={t.id}
              id={t.id}
              name={t.name}
              description={t.description}
              layout={t.layout}
              active={selected === t.id}
              onSelect={() => handleSelect(t.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function TemplateCard({
  id,
  name,
  description,
  layout,
  active,
  onSelect,
}: {
  id: DashTemplateId;
  name: string;
  description: string;
  layout: GridItem[];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={
        "relative flex flex-col rounded-2xl border bg-white p-5 transition-all duration-200 " +
        (active
          ? "border-[#0F766E] shadow-[0_8px_28px_rgba(15,118,110,0.18)]"
          : "border-[#E5E5E0] hover:-translate-y-0.5 hover:border-[#0F766E]/50 hover:shadow-[0_6px_22px_rgba(0,0,0,0.06)]")
      }
    >
      {active && (
        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#0F766E] text-white">
          <Check size={14} />
        </div>
      )}
      <Thumbnail layout={layout} />
      <div className="mt-4">
        <h3 className="text-[16px] font-semibold text-[#111827]">{name}</h3>
        <p className="mt-1 text-[13px] text-[#6B7280]">{description}</p>
      </div>
      <button
        type="button"
        onClick={onSelect}
        data-tpl={id}
        className="mt-4 w-full rounded-xl bg-[#0F766E] py-2.5 text-sm font-semibold text-white hover:bg-[#0F766E]/90"
      >
        Select
      </button>
    </div>
  );
}

const TILE_COLORS: Record<string, string> = {
  inbox: "#0F766E",
  news: "#1D4ED8",
  funding: "#B45309",
  reports: "#6B7280",
  translator: "#7C3AED",
};

function Thumbnail({ layout }: { layout: GridItem[] }) {
  const rows = layout.reduce((m, g) => Math.max(m, g.y + g.h), 0);
  const cellW = 100 / 12;
  const cellH = 100 / Math.max(rows, 1);
  return (
    <div className="relative h-40 w-full overflow-hidden rounded-lg border border-[#E5E5E0] bg-[#FAFAF8]">
      {layout.map((g) => (
        <div
          key={g.i}
          className="absolute rounded p-1.5 text-[9px] font-semibold text-white"
          style={{
            left: `${g.x * cellW}%`,
            top: `${g.y * cellH}%`,
            width: `calc(${g.w * cellW}% - 4px)`,
            height: `calc(${g.h * cellH}% - 4px)`,
            margin: 2,
            backgroundColor: TILE_COLORS[g.i] ?? "#374151",
            opacity: 0.9,
          }}
        >
          {WIDGET_META[g.i].name}
        </div>
      ))}
    </div>
  );
}
