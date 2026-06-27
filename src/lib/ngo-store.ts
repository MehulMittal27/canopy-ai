import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NgoId = "bk" | "wtg";

export interface CurrentNgo {
  id: NgoId;
  name: string;
  workingLanguage: "en";
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
    workingLanguage: "en",
    topics: ["Security", "Health", "GBV", "Education", "Humanitarian", "Funding"],
  },
  wtg: {
    id: "wtg",
    name: "WTG",
    workingLanguage: "en",
    topics: ["Animal Welfare DE", "International", "Social Media", "Agriculture", "Other NGOs"],
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
