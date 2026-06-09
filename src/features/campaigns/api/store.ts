import { create } from "zustand";

/** Campaigns UI store — manages client-only UI state for the campaigns feature
 *  (filter selection and the delete-confirmation dialog target). Server data
 *  lives in React Query, never here. */

interface CampaignsUIState {
	selectedStatus: string | null;
	searchQuery: string;
	deleteDialogId: string | null;
}

interface CampaignsUIActions {
	setSelectedStatus: (status: string | null) => void;
	setSearchQuery: (query: string) => void;
	openDeleteDialog: (id: string) => void;
	closeDeleteDialog: () => void;
}

export const useCampaignsUIStore = create<
	CampaignsUIState & CampaignsUIActions
>()((set) => ({
	selectedStatus: null,
	searchQuery: "",
	deleteDialogId: null,
	setSelectedStatus: (status) => set({ selectedStatus: status }),
	setSearchQuery: (query) => set({ searchQuery: query }),
	openDeleteDialog: (id) => set({ deleteDialogId: id }),
	closeDeleteDialog: () => set({ deleteDialogId: null }),
}));
