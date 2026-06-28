import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import GridLayout, { WidthProvider, type LayoutItem } from "react-grid-layout/legacy";
import { useNgoStore } from "@/lib/ngo-store";
import {
  ALL_WIDGETS,
  DASHBOARD_GRID_COLS,
  DASH_TEMPLATES,
  WIDGET_META,
  defaultTemplateForNgo,
  useDashboardStore,
  type WidgetId,
} from "@/lib/dashboard-store";
import { WIDGET_COMPONENTS } from "@/components/widgets/registry";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/canopy/TopBar";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Canopy" }] }),
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

const ReactGridLayout = WidthProvider(GridLayout);

const FONT_STACK = '"Schibsted Grotesk", -apple-system, "Helvetica Neue", Arial, sans-serif';

function Dashboard() {
  const current = useNgoStore((s) => s.current);
  const navigate = useNavigate();
  const { user } = useAuth();

  const setLayout = useDashboardStore((s) => s.setLayout);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const addWidget = useDashboardStore((s) => s.addWidget);
  const hydrate = useDashboardStore((s) => s.hydrate);
  const layouts = useDashboardStore((s) => s.layouts);
  const templates = useDashboardStore((s) => s.templates);
  const saveErrors = useDashboardStore((s) => s.saveErrors);

  const [mounted, setMounted] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const dashboardKey = user?.id ?? null;

  useEffect(() => {
    setMounted(false);
    if (!current) {
      navigate({ to: "/login" });
      return;
    }
    if (!dashboardKey) return;

    hydrate(dashboardKey, defaultTemplateForNgo(current.id)).finally(() => {
      setMounted(true);
    });
  }, [current, dashboardKey, hydrate, navigate]);

  const layout = dashboardKey ? layouts[dashboardKey] : undefined;
  const saveError = dashboardKey ? saveErrors[dashboardKey] : null;

  const activeIds = useMemo(() => new Set((layout ?? []).map((g) => g.i)), [layout]);
  const trayWidgets = ALL_WIDGETS.filter((w) => !activeIds.has(w));

  const handleLayoutChange = (next: readonly LayoutItem[]) => {
    if (!dashboardKey || !layout) return;
    const updated = next.map((n) => ({
      i: n.i as WidgetId,
      x: n.x,
      y: n.y,
      w: n.w,
      h: n.h,
    }));
    setLayout(dashboardKey, updated);
  };

  if (!current) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#F2F1EC", fontFamily: FONT_STACK, color: "#6E6E64" }}
      >
        <div style={{ fontSize: 13 }}>Loading your workspace…</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#F2F1EC",
        color: "#1B1B17",
        fontFamily: FONT_STACK,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <TopBar />

      <header className="mx-auto max-w-[1440px]" style={{ padding: "22px 26px 22px" }}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "#A0A096",
              }}
            >
              WORKSPACE
            </div>
            <div
              style={{
                fontSize: 21,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#1B1B17",
                marginTop: 4,
              }}
            >
              {current.name}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTrayOpen((o) => !o)}
            className="inline-flex items-center gap-1.5"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E5DF",
              borderRadius: 11,
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "#1B1B17",
            }}
          >
            <span style={{ color: "#16A06B", fontWeight: 700 }}>+</span>
            Add widget
          </button>
        </div>
      </header>

      <main
        className="mx-auto max-w-[1440px]"
        style={{ padding: "0 26px 40px", paddingRight: trayOpen ? 320 : 26 }}
      >
        {saveError && (
          <div
            style={{
              marginBottom: 12,
              border: "1px solid #FBF1DC",
              borderRadius: 10,
              background: "#FBF1DC",
              color: "#B07814",
              padding: "8px 10px",
              fontSize: 12,
            }}
          >
            {saveError}
          </div>
        )}
        {mounted && layout && dashboardKey ? (
          <ReactGridLayout
            className="layout"
            layout={layout}
            cols={DASHBOARD_GRID_COLS}
            rowHeight={60}
            margin={[18, 18]}
            containerPadding={[0, 0]}
            draggableHandle=".widget-drag-handle"
            onLayoutChange={handleLayoutChange}
            isDroppable={false}
          >
            {layout.map((g) => {
              const Body = WIDGET_COMPONENTS[g.i];
              return (
                <div key={g.i}>
                  <Body onRemove={() => removeWidget(dashboardKey, g.i)} />
                </div>
              );
            })}
          </ReactGridLayout>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{ minHeight: 240, color: "#6E6E64", fontSize: 13 }}
          >
            Loading your dashboard…
          </div>
        )}
      </main>

      {/* Widget tray */}
      <aside
        className="fixed right-0 top-[46px] z-40 h-[calc(100vh-46px)] w-[300px] transform transition-transform"
        style={{
          background: "#FFFFFF",
          borderLeft: "1px solid #E9E8E2",
          boxShadow: trayOpen ? "0 10px 30px -10px rgba(20,20,18,.18)" : "none",
          transform: trayOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "13px 18px", borderBottom: "1px solid #F2F1EC" }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1B1B17" }}>Add widgets</div>
          <button
            type="button"
            onClick={() => setTrayOpen(false)}
            aria-label="Close tray"
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[#F2F1EC]"
            style={{ color: "#6E6E64" }}
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-2 p-3">
          {trayWidgets.length === 0 && (
            <div
              className="text-center"
              style={{
                border: "1px dashed #E6E5DF",
                borderRadius: 12,
                padding: 16,
                fontSize: 12,
                color: "#9B9B90",
              }}
            >
              All widgets are on your dashboard.
            </div>
          )}
          {trayWidgets.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => {
                if (dashboardKey) addWidget(dashboardKey, w);
                setTrayOpen(false);
              }}
              className="text-left"
              style={{
                background: "#FFFFFF",
                border: "1px solid #EBEAE4",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1B1B17" }}>
                {WIDGET_META[w].name}
              </div>
              <div style={{ fontSize: 12, color: "#9B9B90", marginTop: 2 }}>
                {WIDGET_META[w].description}
              </div>
            </button>
          ))}
          <div style={{ fontSize: 11, color: "#9B9B90", marginTop: 4 }}>
            Click a widget to add it to your dashboard.
          </div>
        </div>
        <div
          style={{
            borderTop: "1px solid #F2F1EC",
            padding: "10px 16px",
            fontSize: 11,
            color: "#9B9B90",
          }}
        >
          Template:{" "}
          {(() => {
            const t = dashboardKey ? templates[dashboardKey] : null;
            return t ? DASH_TEMPLATES[t].name : "Custom";
          })()}
        </div>
      </aside>
    </div>
  );
}
