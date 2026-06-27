import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NgoId = "bk" | "wtg";

export interface CurrentNgo {
  id: NgoId;
  name: string;
  workingLanguage: "de";
  topics: string[];
}

interface NgoState {
  current: CurrentNgo | null;
  setNgo: (ngo: CurrentNgo) => void;
  logout: () => void;
}

export const NGOS: Record<NgoId, CurrentNgo> = {
  bk: {
    id: "bk",
    name: "Burundi Kids",
    workingLanguage: "de",
    topics: ["Sicherheit", "Gesundheit", "GBV", "Bildung", "Humanitäre Hilfe", "Förderung"],
  },
  wtg: {
    id: "wtg",
    name: "Welttierschutzgesellschaft",
    workingLanguage: "de",
    topics: ["Tierschutz DE", "International", "Social Media", "Landwirtschaft", "Andere NGOs"],
  },
};

export const useNgoStore = create<NgoState>()(
  persist(
    (set) => ({
      current: null,
      setNgo: (ngo) => set({ current: ngo }),
      logout: () => set({ current: null }),
    }),
    { name: "aidsignal-ngo" },
  ),
);
