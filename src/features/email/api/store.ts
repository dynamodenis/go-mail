import { create } from "zustand";

/** Email UI store — manages client-only UI state for the email feature */

type EmailFolder = "inbox" | "sent" | "drafts";

interface EmailUIState {
  selectedFolder: EmailFolder;
  searchQuery: string;
}

interface EmailUIActions {
  setSelectedFolder: (folder: EmailFolder) => void;
  setSearchQuery: (query: string) => void;
}

export const useEmailUIStore = create<EmailUIState & EmailUIActions>()(
  (set) => ({
    selectedFolder: "inbox",
    searchQuery: "",
    setSelectedFolder: (folder) => set({ selectedFolder: folder }),
    setSearchQuery: (query) => set({ searchQuery: query }),
  })
);
