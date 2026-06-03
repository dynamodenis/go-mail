import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Sidebar UI store — persists layout state to localStorage so the user's choices
 *  survive reloads and navigation:
 *   - `isPinned`: whether the sidebar is locked open (vs. hover-expand rail).
 *   - `expandedGroup`: the currently open nav section (the "selected tab"). `null`
 *     means "follow the active route" — the section containing the current page
 *     opens by default until the user explicitly picks one. */

interface SidebarUIState {
	isPinned: boolean;
	expandedGroup: string | null;
}

interface SidebarUIActions {
	togglePinned: () => void;
	/** Open `label`, or close it (back to following the active route) if it's
	 *  already the open one. Single-open accordion. */
	toggleGroup: (label: string) => void;
}

export const useSidebarStore = create<SidebarUIState & SidebarUIActions>()(
	persist(
		(set) => ({
			isPinned: false,
			expandedGroup: null,
			togglePinned: () => set((s) => ({ isPinned: !s.isPinned })),
			toggleGroup: (label) =>
				set((s) => ({
					expandedGroup: s.expandedGroup === label ? null : label,
				})),
		}),
		{ name: "gomail-sidebar" },
	),
);
