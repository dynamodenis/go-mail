import { create } from "zustand";

/** Collections UI store — manages client-only UI state for the collections feature */

interface CollectionsUIState {
  searchQuery: string;
}

interface CollectionsUIActions {
  setSearchQuery: (query: string) => void;
}

export const useCollectionsUIStore = create<
  CollectionsUIState & CollectionsUIActions
>()((set) => ({
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
