import { create } from "zustand";
import type { NgoId } from "./ngo-store";

export type WidgetId = "inbox" | "translator" | "funding" | "news" | "reports";

export const ALL_WIDGETS: WidgetId[] = ["inbox", "translator", "funding", "news", "reports"];

export const WIDGET_META: Record<WidgetId, { name: string; description: string }> = {
  inbox: { name: "Inbox", description: "Prioritized feed of incoming items" },
  translator: { name: "Translator", description: "Translate field content into English" },
  funding: { name: "Funding Tracker", description: "Open grant calls and deadlines" },
  news: { name: "News Monitor", description: "Latest headlines filtered by your topics" },
  reports: { name: "Reports & Documents", description: "Field reports and donor documents" },
};

// Supabase stores these long-form values; the local store uses short ids for back-compat.
export type DashTemplateId = "bk" | "wtg" | "fundraiser" | "analyst";
export type RemoteTemplateId = "burundi-kids" | "wtg" | "fundraiser" | "analyst";
export const toLocalTemplate = (r: string): DashTemplateId =>
  r === "burundi-kids" ? "bk" : (r as DashTemplateId);
export const toRemoteTemplate = (l: DashTemplateId): RemoteTemplateId =>
  l === "bk" ? "burundi-kids" : (l as RemoteTemplateId);

export interface GridItem {
  i: WidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
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
      { i: "inbox", x: 0, y: 0, w: 8, h: 6 },
      { i: "translator", x: 8, y: 0, w: 4, h: 6 },
      { i: "news", x: 0, y: 6, w: 6, h: 5 },
      { i: "reports", x: 6, y: 6, w: 6, h: 5 },
    ],
    hidden: ["funding"],
  },
  wtg: {
    id: "wtg",
    name: "WTG",
    description: "Built for international operations tracking news across many countries.",
    layout: [
      { i: "news", x: 0, y: 0, w: 8, h: 6 },
      { i: "funding", x: 8, y: 0, w: 4, h: 6 },
      { i: "inbox", x: 0, y: 6, w: 6, h: 5 },
      { i: "reports", x: 6, y: 6, w: 6, h: 5 },
    ],
    hidden: ["translator"],
  },
  fundraiser: {
    id: "fundraiser",
    name: "Fundraiser",
    description: "Grant-seeking teams that live by deadlines and funding calls.",
    layout: [
      { i: "funding", x: 0, y: 0, w: 12, h: 5 },
      { i: "inbox", x: 0, y: 5, w: 6, h: 5 },
      { i: "news", x: 6, y: 5, w: 6, h: 5 },
      { i: "reports", x: 8, y: 10, w: 4, h: 4 },
    ],
    hidden: ["translator"],
  },
  analyst: {
    id: "analyst",
    name: "Analyst",
    description: "Monitoring, synthesis, and reporting across topics and regions.",
    layout: [
      { i: "inbox", x: 0, y: 0, w: 6, h: 5 },
      { i: "news", x: 6, y: 0, w: 6, h: 5 },
      { i: "reports", x: 0, y: 5, w: 12, h: 6 },
      { i: "translator", x: 8, y: 11, w: 4, h: 4 },
    ],
    hidden: ["funding"],
  },
};

const layoutKey = (n: NgoId) => `canopy_layout_${n}`;
const templateKey = (n: NgoId) => `canopy_dash_template_${n}`;

function writeLS(key: string, val: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore */
  }
}

export function hasSavedLayout(ngo: NgoId): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(layoutKey(ngo)) !== null;
}

// ---------- Remote saver (Supabase) ----------
export interface RemotePatch {
  layout?: GridItem[];
  selected_template?: RemoteTemplateId;
  hidden_widgets?: WidgetId[];
  visible_widgets?: WidgetId[];
}
type RemoteSaver = (patch: RemotePatch) => Promise<void> | void;
let _remoteSaver: RemoteSaver | null = null;
let _saveTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingPatch: RemotePatch = {};
function scheduleRemoteSave(patch: RemotePatch, debounceMs = 600) {
  if (!_remoteSaver) return;
  _pendingPatch = { ..._pendingPatch, ...patch };
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    const send = _pendingPatch;
    _pendingPatch = {};
    _saveTimer = null;
    if (_remoteSaver) void _remoteSaver(send);
  }, debounceMs);
}

interface DashState {
  layouts: Partial<Record<NgoId, GridItem[]>>;
  templates: Partial<Record<NgoId, DashTemplateId>>;
  hasRemote: Partial<Record<NgoId, boolean>>;
  setRemoteSaver: (fn: RemoteSaver | null) => void;
  setFromRemote: (ngo: NgoId, layout: GridItem[], remoteTpl: string) => void;
  hydrate: (ngo: NgoId) => void;
  applyTemplate: (ngo: NgoId, tpl: DashTemplateId) => void;
  setLayout: (ngo: NgoId, layout: GridItem[]) => void;
  removeWidget: (ngo: NgoId, id: WidgetId) => void;
  addWidget: (ngo: NgoId, id: WidgetId) => void;
}

export const useDashboardStore = create<DashState>((set, get) => ({
  layouts: {},
  templates: {},
  hasRemote: {},
  setRemoteSaver: (fn) => {
    _remoteSaver = fn;
  },
  setFromRemote: (ngo, layout, remoteTpl) => {
    const tpl = toLocalTemplate(remoteTpl);
    const effective = layout && layout.length > 0 ? layout : DASH_TEMPLATES[tpl].layout;
    set((s) => ({
      layouts: { ...s.layouts, [ngo]: effective },
      templates: { ...s.templates, [ngo]: tpl },
      hasRemote: { ...s.hasRemote, [ngo]: true },
    }));
  },
  hydrate: () => {
    /* no-op: AuthProvider hydrates from Supabase via setFromRemote */
  },
  applyTemplate: (ngo, tpl) => {
    const layout = DASH_TEMPLATES[tpl].layout.map((g) => ({ ...g }));
    writeLS(layoutKey(ngo), layout);
    writeLS(templateKey(ngo), tpl);
    set((s) => ({
      layouts: { ...s.layouts, [ngo]: layout },
      templates: { ...s.templates, [ngo]: tpl },
    }));
    scheduleRemoteSave(
      {
        layout,
        selected_template: toRemoteTemplate(tpl),
        hidden_widgets: DASH_TEMPLATES[tpl].hidden,
      },
      150,
    );
  },
  setLayout: (ngo, layout) => {
    writeLS(layoutKey(ngo), layout);
    set((s) => ({ layouts: { ...s.layouts, [ngo]: layout } }));
    scheduleRemoteSave({ layout });
  },
  removeWidget: (ngo, id) => {
    const cur = get().layouts[ngo] ?? [];
    const next = cur.filter((g) => g.i !== id);
    writeLS(layoutKey(ngo), next);
    set((s) => ({ layouts: { ...s.layouts, [ngo]: next } }));
    scheduleRemoteSave({ layout: next });
  },
  addWidget: (ngo, id) => {
    const cur = get().layouts[ngo] ?? [];
    if (cur.some((g) => g.i === id)) return;
    const maxY = cur.reduce((m, g) => Math.max(m, g.y + g.h), 0);
    const next = [...cur, { i: id, x: 0, y: maxY, w: 6, h: 5 }];
    writeLS(layoutKey(ngo), next);
    set((s) => ({ layouts: { ...s.layouts, [ngo]: next } }));
    scheduleRemoteSave({ layout: next });
  },
}));
