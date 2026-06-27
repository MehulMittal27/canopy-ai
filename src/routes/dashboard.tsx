import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import GridLayout, { WidthProvider, type LayoutItem } from "react-grid-layout/legacy";
import { TopBar } from "@/components/canopy/TopBar";
import { useNgoStore } from "@/lib/ngo-store";
import {
  ALL_WIDGETS,
  DASH_TEMPLATES,
  WIDGET_META,
  hasSavedLayout,
  useDashboardStore,
  type WidgetId,
} from "@/lib/dashboard-store";
import { Widget } from "@/components/widgets/Widget";
import { WIDGET_COMPONENTS } from "@/components/widgets/registry";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Canopy" }] }),
  component: Dashboard,
});

const ReactGridLayout = WidthProvider(GridLayout);

function Dashboard() {
  const current = useNgoStore((s) => s.current);
  if (!current) throw redirect({ to: "/" });

  const hydrate = useDashboardStore((s) => s.hydrate);
  const setLayout = useDashboardStore((s) => s.setLayout);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const addWidget = useDashboardStore((s) => s.addWidget);
  const applyTemplate = useDashboardStore((s) => s.applyTemplate);
  const layouts = useDashboardStore((s) => s.layouts);
  const layout = layouts[current.id];

  const [mounted, setMounted] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);

  useEffect(() => {
    hydrate(current.id);
    if (!hasSavedLayout(current.id)) {
      // Safety net: apply a default if dashboard reached without picker.
      applyTemplate(current.id, current.id === "wtg" ? "wtg" : "bk");
    }
    setMounted(true);
  }, [current.id, hydrate, applyTemplate]);

  const activeIds = useMemo(() => new Set((layout ?? []).map((g) => g.i)), [layout]);
  const trayWidgets = ALL_WIDGETS.filter((w) => !activeIds.has(w));

  const handleLayoutChange = (next: readonly LayoutItem[]) => {
    if (!layout) return;
    const updated = next.map((n) => ({
      i: n.i as WidgetId,
      x: n.x,
      y: n.y,
      w: n.w,
      h: n.h,
    }));
    setLayout(current.id, updated);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <TopBar />
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 pt-5">
        <h1 className="text-[18px] font-semibold text-[#111827]">Workspace</h1>
        <button
          type="button"
          onClick={() => setTrayOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#0F766E] px-3 py-1.5 text-sm font-medium text-[#0F766E] hover:bg-[#0F766E]/5"
        >
          <Plus size={14} />
          Add widget
        </button>
      </div>

      <main className="mx-auto max-w-[1400px] px-4 py-4" style={{ paddingRight: trayOpen ? 300 : 16 }}>
        {mounted && layout && (
          <ReactGridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={60}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            draggableHandle=".widget-drag-handle"
            onLayoutChange={handleLayoutChange}
            isDroppable={false}
          >
            {layout.map((g) => {
              const Body = WIDGET_COMPONENTS[g.i];
              return (
                <div key={g.i}>
                  <Widget
                    title={WIDGET_META[g.i].name}
                    onRemove={() => removeWidget(current.id, g.i)}
                  >
                    <Body />
                  </Widget>
                </div>
              );
            })}
          </ReactGridLayout>
        )}
      </main>

      {/* Tray */}
      <aside
        className={`fixed right-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-[280px] transform border-l border-[#E5E5E0] bg-white shadow-lg transition-transform ${
          trayOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E5E5E0] px-4 py-3">
          <div className="text-[14px] font-semibold text-[#111827]">Add widgets</div>
          <button
            type="button"
            onClick={() => setTrayOpen(false)}
            className="rounded p-1 text-[#6B7280] hover:bg-[#FAFAF8]"
            aria-label="Close tray"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-2 p-3">
          {trayWidgets.length === 0 && (
            <div className="rounded-md border border-dashed border-[#E5E5E0] p-4 text-center text-[12px] text-[#6B7280]">
              All widgets are on your dashboard.
            </div>
          )}
          {trayWidgets.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => {
                addWidget(current.id, w);
                setTrayOpen(false);
              }}
              className="rounded-lg border border-[#E5E5E0] bg-white p-3 text-left hover:border-[#0F766E] hover:shadow-sm"
            >
              <div className="text-[13px] font-semibold text-[#111827]">{WIDGET_META[w].name}</div>
              <div className="mt-0.5 text-[12px] text-[#6B7280]">{WIDGET_META[w].description}</div>
            </button>
          ))}
          <div className="mt-2 text-[11px] text-[#6B7280]">
            Click a widget to add it to your dashboard.
          </div>
        </div>
        <div className="border-t border-[#E5E5E0] p-3 text-[11px] text-[#6B7280]">
          Template: {DASH_TEMPLATES[useDashboardStore.getState().templates[current.id] ?? "bk"]?.name ?? "Custom"}
        </div>
      </aside>
    </div>
  );
}
