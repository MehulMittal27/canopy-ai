import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, Check, ChevronDown, Plus, Settings as SettingsIcon, X } from "lucide-react";
import GridLayout, { WidthProvider, type LayoutItem } from "react-grid-layout/legacy";
import { NGOS, useNgoStore, type NgoId } from "@/lib/ngo-store";
import { useItemsStore } from "@/lib/items-store";
import {
  ALL_WIDGETS,
  DASH_TEMPLATES,
  WIDGET_META,
  useDashboardStore,
  type WidgetId,
} from "@/lib/dashboard-store";
import { WIDGET_COMPONENTS } from "@/components/widgets/registry";
import { useRequireOrg } from "@/lib/auth-context";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Canopy" }] }),
  component: Dashboard,
});

const ReactGridLayout = WidthProvider(GridLayout);

const FLAG_BY_NGO: Record<NgoId, string> = { bk: "🇧🇮", wtg: "🐾" };

const FONT_STACK =
  '"Schibsted Grotesk", -apple-system, "Helvetica Neue", Arial, sans-serif';

function Dashboard() {
  const { ready, current } = useRequireOrg();

  const setLayout = useDashboardStore((s) => s.setLayout);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const addWidget = useDashboardStore((s) => s.addWidget);
  const layouts = useDashboardStore((s) => s.layouts);
  const layout = current ? layouts[current.id] : undefined;

  const [mounted, setMounted] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);

  useEffect(() => {
    if (ready) setMounted(true);
  }, [ready]);

  const activeIds = useMemo(() => new Set((layout ?? []).map((g) => g.i)), [layout]);
  const trayWidgets = ALL_WIDGETS.filter((w) => !activeIds.has(w));

  const handleLayoutChange = (next: readonly LayoutItem[]) => {
    if (!current || !layout) return;
    const updated = next.map((n) => ({
      i: n.i as WidgetId,
      x: n.x,
      y: n.y,
      w: n.w,
      h: n.h,
    }));
    setLayout(current.id, updated);
  };

  if (!ready || !current) {
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
      <CanopyTopNav />

      <header className="mx-auto max-w-[1200px]" style={{ padding: "22px 26px 22px" }}>
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
        className="mx-auto max-w-[1200px]"
        style={{ padding: "0 26px 40px", paddingRight: trayOpen ? 320 : 26 }}
      >
        {mounted && layout && (
          <ReactGridLayout
            className="layout"
            layout={layout}
            cols={12}
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
                  <Body onRemove={() => removeWidget(current.id, g.i)} />
                </div>
              );
            })}
          </ReactGridLayout>
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
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1B1B17" }}>
            Add widgets
          </div>
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
                addWidget(current.id, w);
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
          {DASH_TEMPLATES[useDashboardStore.getState().templates[current.id] ?? "bk"]
            ?.name ?? "Custom"}
        </div>
      </aside>
    </div>
  );
}

/* ---------- Top nav (matches Canopy_Dashboard.html reference) ---------- */

function CanopyTopNav() {
  const current = useNgoStore((s) => s.current);
  const setNgo = useNgoStore((s) => s.setNgo);
  const items = useItemsStore((s) => s.items);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!current) return null;
  const urgent = items.filter((i) => i.ngo_id === current.id && i.urgency === "red").length;

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
        className="mx-auto flex max-w-[1200px] items-center justify-between"
        style={{ padding: "13px 26px" }}
      >
        <div className="flex items-center gap-4">
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

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1.5"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6E5DF",
                borderRadius: 999,
                padding: "5px 11px 5px 9px",
              }}
            >
              <span style={{ fontSize: 14 }}>{FLAG_BY_NGO[current.id]}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1B1B17" }}>
                {current.name}
              </span>
              <ChevronDown size={13} style={{ color: "#9B9B90" }} />
            </button>
            {open && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
                <div
                  className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #EBEAE4",
                    borderRadius: 12,
                    boxShadow: "0 14px 30px -16px rgba(20,20,18,.25)",
                  }}
                >
                  {(["bk", "wtg"] as NgoId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setNgo(NGOS[id]);
                        setOpen(false);
                        navigate({ to: "/dashboard" });
                      }}
                      className="flex w-full items-center justify-between hover:bg-[#FAF9F5]"
                      style={{ padding: "9px 12px", fontSize: 13, color: "#1B1B17" }}
                    >
                      <span className="flex items-center gap-2">
                        <span>{FLAG_BY_NGO[id]}</span>
                        {NGOS[id].name}
                      </span>
                      {current.id === id && <Check size={14} style={{ color: "#16A06B" }} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex items-center justify-center hover:bg-[#EDECE6]"
            style={{ width: 38, height: 38, borderRadius: 11 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z"
                stroke="#3A3A34"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 21a2 2 0 0 0 4 0"
                stroke="#3A3A34"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            {urgent > 0 && (
              <span
                className="absolute"
                style={{
                  top: 6,
                  right: 6,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  borderRadius: 999,
                  background: "#E0533D",
                  color: "#FFFFFF",
                  fontSize: 9.5,
                  fontWeight: 700,
                  border: "2px solid #FFFFFF",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {urgent}
              </span>
            )}
          </button>
          <Link
            to="/settings"
            aria-label="Settings"
            className="flex items-center justify-center hover:bg-[#EDECE6]"
            style={{ width: 38, height: 38, borderRadius: 11, color: "#3A3A34" }}
          >
            <SettingsIcon size={18} strokeWidth={1.6} />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* Avoid unused-import warning when not all icons are used elsewhere. */
void Plus;
void Bell;
