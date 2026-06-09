import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Sidebar UI store — persists layout state to localStorage so the user's choice
 *  survives reloads:
 *   - `isPinned`: whether the icon rail is locked open (vs. hover-expand rail).
 *
 *  Section sub-navigation is no longer an in-rail accordion; it lives in the
 *  contextual second sidebar ([[SecondaryNav]]) driven by the active route, so
 *  there is no "expanded group" state to track here anymore. */

interface SidebarUIState {
	isPinned: boolean;
}

interface SidebarUIActions {
	togglePinned: () => void;
}

export const useSidebarStore = create<SidebarUIState & SidebarUIActions>()(
	persist(
		(set) => ({
			isPinned: false,
			togglePinned: () => set((s) => ({ isPinned: !s.isPinned })),
		}),
		{ name: "gomail-sidebar" },
	),
);
