import { create } from "zustand";
import type { EmailThread } from "../types";

/** Email UI store — client-only UI state for the inbox: the search query and
 *  the thread currently selected into the reading pane. Server data (threads,
 *  message bodies) lives in React Query, never here. The active folder is
 *  derived from the route, so it is not stored here. */

interface EmailUIState {
  searchQuery: string;
  selectedThread: EmailThread | null;
}

interface EmailUIActions {
  setSearchQuery: (query: string) => void;
  setSelectedThread: (thread: EmailThread | null) => void;
}

export const useEmailUIStore = create<EmailUIState & EmailUIActions>()(
  (set) => ({
    searchQuery: "",
    selectedThread: null,
    setSearchQuery: (query) => set({ searchQuery: query }),
    setSelectedThread: (thread) => set({ selectedThread: thread }),
  }),
);
