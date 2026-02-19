import { create } from "zustand";

/** Contacts UI store — manages client-only UI state for the contacts feature */

interface ContactsUIState {
  selectedStatus: string | null;
  searchQuery: string;
}

interface ContactsUIActions {
  setSelectedStatus: (status: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useContactsUIStore = create<
  ContactsUIState & ContactsUIActions
>()((set) => ({
  selectedStatus: null,
  searchQuery: "",
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
