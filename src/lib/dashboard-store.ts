import { create } from "zustand";
import { getMyDashboardLayout, upsertMyDashboardLayout } from "@/lib/api/layouts";
import type { NgoId } from "./ngo-store";

export type WidgetId = "inbox" | "translator" | "funding" | "news" | "reports";

export const ALL_WIDGETS: WidgetId[] = ["inbox", "translator", "funding", "news", "reports"];
export const DASHBOARD_LAYOUT_VERSION = 3;
export const DASHBOARD_GRID_COLS = 16;

export const WIDGET_META: Record<WidgetId, { name: string; description: string }> = {
  inbox: { name: "Inbox", description: "Prioritized feed of incoming items" },
  translator: { name: "Translator", description: "Translate field content into English" },
  funding: { name: "Funding Tracker", description: "Open grant calls and deadlines" },
  news: { name: "News Monitor", description: "Latest headlines filtered by your topics" },
  reports: { name: "Reports & Documents", description: "Field reports and donor documents" },
};

export type DashTemplateId = "bk" | "wtg" | "fundraiser" | "analyst";

export interface GridItem {
  i: WidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SavedDashboardLayout {
  version: typeof DASHBOARD_LAYOUT_VERSION;
  cols: typeof DASHBOARD_GRID_COLS;
  items: GridItem[];
}

export interface DashTemplate {
  id: DashTemplateId;
  name: string;
  description: string;
  layout: GridItem[];
  hidden: WidgetId[];
}

export const DASH_TEMPLATES: Record<DashTemplateId, DashTemplate> = {
  bk: {
    id: "bk",
    name: "Burundi Kids",
    description: "Ideal for field-focused teams working with multilingual sources.",
    layout: [
      { i: "news", x: 0, y: 0, w: 10, h: 7 },
      { i: "inbox", x: 10, y: 0, w: 6, h: 7 },
      { i: "translator", x: 0, y: 7, w: 6, h: 6 },
      { i: "reports", x: 6, y: 7, w: 10, h: 6 },
    ],
    hidden: ["funding"],
  },
  wtg: {
    id: "wtg",
    name: "WTG",
    description: "Built for international operations tracking news across many countries.",
    layout: [
      { i: "news", x: 0, y: 0, w: 10, h: 7 },
      { i: "inbox", x: 10, y: 0, w: 6, h: 7 },
      { i: "funding", x: 0, y: 7, w: 6, h: 6 },
      { i: "reports", x: 6, y: 7, w: 10, h: 6 },
    ],
    hidden: ["translator"],
  },
  fundraiser: {
    id: "fundraiser",
    name: "Fundraiser",
    description: "Grant-seeking teams that live by deadlines and funding calls.",
    layout: [
      { i: "funding", x: 0, y: 0, w: 6, h: 6 },
      { i: "news", x: 6, y: 0, w: 10, h: 7 },
      { i: "inbox", x: 0, y: 6, w: 6, h: 6 },
      { i: "reports", x: 6, y: 7, w: 10, h: 6 },
    ],
    hidden: ["translator"],
  },
  analyst: {
    id: "analyst",
    name: "Analyst",
    description: "Monitoring, synthesis, and reporting across topics and regions.",
    layout: [
      { i: "news", x: 0, y: 0, w: 10, h: 7 },
      { i: "translator", x: 10, y: 0, w: 6, h: 7 },
      { i: "inbox", x: 0, y: 7, w: 6, h: 6 },
      { i: "reports", x: 6, y: 7, w: 10, h: 6 },
    ],
    hidden: ["funding"],
  },
};

const SAVE_DELAY_MS = 500;
const saveTimers = new Map<string, number>();

function cloneLayout(layout: readonly GridItem[]): GridItem[] {
  return layout.map((g) => ({ ...g }));
}

function isWidgetId(value: unknown): value is WidgetId {
  return typeof value === "string" && ALL_WIDGETS.includes(value as WidgetId);
}

function isTemplateId(value: unknown): value is DashTemplateId {
  return typeof value === "string" && value in DASH_TEMPLATES;
}

function clampGridItem(item: GridItem): GridItem {
  const width = Math.min(Math.max(Math.round(item.w), 3), DASHBOARD_GRID_COLS);
  const x = Math.min(Math.max(Math.round(item.x), 0), DASHBOARD_GRID_COLS - width);
  return {
    i: item.i,
    x,
    y: Math.max(Math.round(item.y), 0),
    w: width,
    h: Math.max(Math.round(item.h), 3),
  };
}

function normalizeSavedLayout(value: unknown): GridItem[] | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { version?: unknown; cols?: unknown; items?: unknown };
  if (candidate.version !== DASHBOARD_LAYOUT_VERSION || candidate.cols !== DASHBOARD_GRID_COLS) {
    return null;
  }
  if (!Array.isArray(candidate.items)) return null;

  const items: GridItem[] = [];
  for (const raw of candidate.items) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Partial<GridItem>;
    if (!isWidgetId(item.i)) continue;
    if (
      typeof item.x !== "number" ||
      typeof item.y !== "number" ||
      typeof item.w !== "number" ||
      typeof item.h !== "number"
    ) {
      continue;
    }
    items.push(clampGridItem({ i: item.i, x: item.x, y: item.y, w: item.w, h: item.h }));
  }

  return items.length > 0 ? items : null;
}

function toSavedLayout(layout: readonly GridItem[]): SavedDashboardLayout {
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    cols: DASHBOARD_GRID_COLS,
    items: cloneLayout(layout).map(clampGridItem),
  };
}

export function defaultTemplateForNgo(ngo: NgoId | string): DashTemplateId {
  return ngo === "wtg" ? "wtg" : "bk";
}

function defaultLayoutForTemplate(template: DashTemplateId): GridItem[] {
  return cloneLayout(DASH_TEMPLATES[template].layout);
}

function logSaveError(error: unknown) {
  console.error("Could not save dashboard layout", error);
}

async function persistLayout(key: string, template: DashTemplateId, layout: readonly GridItem[]) {
  await upsertMyDashboardLayout(template, toSavedLayout(layout));
  const state = useDashboardStore.getState();
  if (state.saveErrors[key]) {
    useDashboardStore.setState((s) => ({
      saveErrors: { ...s.saveErrors, [key]: null },
    }));
  }
}

function scheduleSave(key: string, template: DashTemplateId, layout: readonly GridItem[]) {
  const existing = saveTimers.get(key);
  if (existing) window.clearTimeout(existing);
  const timer = window.setTimeout(() => {
    saveTimers.delete(key);
    persistLayout(key, template, layout).catch((error) => {
      logSaveError(error);
      useDashboardStore.setState((s) => ({
        saveErrors: { ...s.saveErrors, [key]: "Dashboard changes are saved locally for now." },
      }));
    });
  }, SAVE_DELAY_MS);
  saveTimers.set(key, timer);
}

export function hasSavedLayout(_ngo: NgoId): boolean {
  return false;
}

interface DashState {
  layouts: Record<string, GridItem[]>;
  templates: Record<string, DashTemplateId>;
  hydrated: Record<string, boolean>;
  hydrating: Record<string, boolean>;
  saveErrors: Record<string, string | null>;
  hydrate: (key: string, fallbackTemplate: DashTemplateId) => Promise<void>;
  applyTemplate: (key: string, tpl: DashTemplateId) => void;
  setLayout: (key: string, layout: GridItem[]) => void;
  removeWidget: (key: string, id: WidgetId) => void;
  addWidget: (key: string, id: WidgetId) => void;
  clear: () => void;
}

export const useDashboardStore = create<DashState>((set, get) => ({
  layouts: {},
  templates: {},
  hydrated: {},
  hydrating: {},
  saveErrors: {},
  hydrate: async (key, fallbackTemplate) => {
    if (get().hydrated[key] || get().hydrating[key]) return;
    set((s) => ({ hydrating: { ...s.hydrating, [key]: true } }));

    try {
      const record = await getMyDashboardLayout();
      const template = isTemplateId(record?.template) ? record.template : fallbackTemplate;
      const savedLayout = normalizeSavedLayout(record?.layout_json);
      const layout = savedLayout ?? defaultLayoutForTemplate(template);

      set((s) => ({
        layouts: { ...s.layouts, [key]: layout },
        templates: { ...s.templates, [key]: template },
        hydrated: { ...s.hydrated, [key]: true },
        saveErrors: { ...s.saveErrors, [key]: null },
      }));

      if (!savedLayout) {
        await persistLayout(key, template, layout);
      }
    } catch (error) {
      console.error("Could not load dashboard layout", error);
      const layout = defaultLayoutForTemplate(fallbackTemplate);
      set((s) => ({
        layouts: { ...s.layouts, [key]: layout },
        templates: { ...s.templates, [key]: fallbackTemplate },
        hydrated: { ...s.hydrated, [key]: true },
        saveErrors: { ...s.saveErrors, [key]: "Dashboard layout could not sync yet." },
      }));
    } finally {
      set((s) => ({ hydrating: { ...s.hydrating, [key]: false } }));
    }
  },
  applyTemplate: (key, tpl) => {
    const layout = defaultLayoutForTemplate(tpl);
    set((s) => ({
      layouts: { ...s.layouts, [key]: layout },
      templates: { ...s.templates, [key]: tpl },
      hydrated: { ...s.hydrated, [key]: true },
    }));
    void persistLayout(key, tpl, layout).catch((error) => {
      logSaveError(error);
      set((s) => ({
        saveErrors: { ...s.saveErrors, [key]: "Dashboard changes are saved locally for now." },
      }));
    });
  },
  setLayout: (key, layout) => {
    const template = get().templates[key] ?? "bk";
    const normalized = cloneLayout(layout).map(clampGridItem);
    set((s) => ({ layouts: { ...s.layouts, [key]: normalized } }));
    scheduleSave(key, template, normalized);
  },
  removeWidget: (key, id) => {
    const cur = get().layouts[key] ?? [];
    const next = cur.filter((g) => g.i !== id);
    const template = get().templates[key] ?? "bk";
    set((s) => ({ layouts: { ...s.layouts, [key]: next } }));
    void persistLayout(key, template, next).catch((error) => {
      logSaveError(error);
      set((s) => ({
        saveErrors: { ...s.saveErrors, [key]: "Dashboard changes are saved locally for now." },
      }));
    });
  },
  addWidget: (key, id) => {
    const cur = get().layouts[key] ?? [];
    if (cur.some((g) => g.i === id)) return;
    const maxY = cur.reduce((m, g) => Math.max(m, g.y + g.h), 0);
    const next = [...cur, { i: id, x: 0, y: maxY, w: id === "news" ? 10 : 5, h: id === "news" ? 7 : 5 }];
    const template = get().templates[key] ?? "bk";
    set((s) => ({ layouts: { ...s.layouts, [key]: next } }));
    void persistLayout(key, template, next).catch((error) => {
      logSaveError(error);
      set((s) => ({
        saveErrors: { ...s.saveErrors, [key]: "Dashboard changes are saved locally for now." },
      }));
    });
  },
  clear: () => {
    for (const timer of saveTimers.values()) window.clearTimeout(timer);
    saveTimers.clear();
    set({ layouts: {}, templates: {}, hydrated: {}, hydrating: {}, saveErrors: {} });
  },
}));
