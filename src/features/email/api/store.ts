import { create } from "zustand";
import type { EmailThread } from "../types";

/** Email UI store — client-only UI state for the inbox: the search query, the
 *  thread currently selected into the reading pane, and the compose window's
 *  open/minimized state. Server data (threads, message bodies) lives in React
 *  Query, never here. The active folder is derived from the route, so it is
 *  not stored here. */

interface EmailUIState {
	searchQuery: string;
	selectedThread: EmailThread | null;
	previewThread: EmailThread | null;
	composeOpen: boolean;
	composeMinimized: boolean;
}

interface EmailUIActions {
	setSearchQuery: (query: string) => void;
	setSelectedThread: (thread: EmailThread | null) => void;
	setPreviewThread: (thread: EmailThread | null) => void;
	openCompose: () => void;
	closeCompose: () => void;
	toggleComposeMinimized: () => void;
}

export const useEmailUIStore = create<EmailUIState & EmailUIActions>()(
	(set) => ({
		searchQuery: "",
		selectedThread: null,
		previewThread: null,
		composeOpen: false,
		composeMinimized: false,
		setSearchQuery: (query) => set({ searchQuery: query }),
		setSelectedThread: (thread) => set({ selectedThread: thread }),
		setPreviewThread: (thread) => set({ previewThread: thread }),
		// Opening always restores the expanded window, even if it was minimized
		// when last closed.
		openCompose: () => set({ composeOpen: true, composeMinimized: false }),
		closeCompose: () => set({ composeOpen: false }),
		toggleComposeMinimized: () =>
			set((s) => ({ composeMinimized: !s.composeMinimized })),
	}),
);
