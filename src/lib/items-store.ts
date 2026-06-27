import { create } from "zustand";
import { items as SEED_ITEMS, type Item } from "@/data/items";

interface ItemsState {
  items: Item[];
  addItem: (item: Item) => void;
}

export const useItemsStore = create<ItemsState>((set) => ({
  items: SEED_ITEMS,
  addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
}));
