import { create } from "zustand";

/** Templates UI store — manages client-only UI state for the templates feature */

interface TemplatesUIState {
  selectedCategory: string | null;
  searchQuery: string;
}

interface TemplatesUIActions {
  setSelectedCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useTemplatesUIStore = create<
  TemplatesUIState & TemplatesUIActions
>()((set) => ({
  selectedCategory: null,
  searchQuery: "",
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
