import { create } from "zustand";
import type { NgoId } from "./ngo-store";

export type TemplateId = "clarity" | "command" | "focus" | "field";

export interface TemplateDef {
  id: TemplateId;
  name: string;
  tagline: string;
  description: string;
  swatch: string[];
  theme: {
    background: string;
    foreground: string;
    card: string;
    border: string;
    accent: string;
    metadata: string;
    secondary: string;
  };
}

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  clarity: {
    id: "clarity",
    name: "Clarity",
    tagline: "Everything in one focused feed.",
    description: "Single-column inbox, maximum content density.",
    swatch: ["#FAFAF9", "#FFFFFF", "#0F766E"],
    theme: {
      background: "#FAFAF9",
      foreground: "#1F2937",
      card: "#FFFFFF",
      border: "#E5E5E0",
      accent: "#0F766E",
      metadata: "#6B7280",
      secondary: "#F3F4F1",
    },
  },
  command: {
    id: "command",
    name: "Command",
    tagline: "Full situational awareness at a glance.",
    description: "Two-column split with a live stats panel.",
    swatch: ["#0F172A", "#1E293B", "#38BDF8"],
    theme: {
      background: "#0F172A",
      foreground: "#E2E8F0",
      card: "#1E293B",
      border: "#334155",
      accent: "#38BDF8",
      metadata: "#94A3B8",
      secondary: "#243049",
    },
  },
  focus: {
    id: "focus",
    name: "Focus",
    tagline: "Built for grant seekers.",
    description: "Funding-first card grid with warm tones.",
    swatch: ["#FFFBF5", "#FFFFFF", "#B45309"],
    theme: {
      background: "#FFFBF5",
      foreground: "#1F2937",
      card: "#FFFFFF",
      border: "#F3E8D0",
      accent: "#B45309",
      metadata: "#78716C",
      secondary: "#FBF3E2",
    },
  },
  field: {
    id: "field",
    name: "Field",
    tagline: "Designed for field-heavy operations.",
    description: "Three-panel layout with reports first.",
    swatch: ["#F0FDF4", "#FFFFFF", "#166534"],
    theme: {
      background: "#F0FDF4",
      foreground: "#1F2937",
      card: "#FFFFFF",
      border: "#BBF7D0",
      accent: "#166534",
      metadata: "#4B5563",
      secondary: "#DCFCE7",
    },
  },
};

const storageKey = (ngoId: NgoId) => `canopy_template_${ngoId}`;

export function readSavedTemplate(ngoId: NgoId): TemplateId | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(storageKey(ngoId));
  if (v && v in TEMPLATES) return v as TemplateId;
  return null;
}

export function writeSavedTemplate(ngoId: NgoId, t: TemplateId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(ngoId), t);
}

interface TemplateState {
  // per-ngo selection cached in memory; nudges re-renders when changed
  selections: Partial<Record<NgoId, TemplateId>>;
  setTemplate: (ngoId: NgoId, t: TemplateId) => void;
  hydrate: (ngoId: NgoId) => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  selections: {},
  setTemplate: (ngoId, t) => {
    writeSavedTemplate(ngoId, t);
    set((s) => ({ selections: { ...s.selections, [ngoId]: t } }));
  },
  hydrate: (ngoId) => {
    if (get().selections[ngoId]) return;
    const saved = readSavedTemplate(ngoId);
    if (saved) set((s) => ({ selections: { ...s.selections, [ngoId]: saved } }));
  },
}));

export function getTemplateForNgo(ngoId: NgoId): TemplateId {
  const sel = useTemplateStore.getState().selections[ngoId];
  if (sel) return sel;
  const saved = readSavedTemplate(ngoId);
  return saved ?? "clarity";
}
