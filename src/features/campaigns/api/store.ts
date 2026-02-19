import { create } from "zustand";

/** Campaigns UI store — manages client-only UI state for the campaigns feature */

interface CampaignsUIState {
  selectedStatus: string | null;
  searchQuery: string;
}

interface CampaignsUIActions {
  setSelectedStatus: (status: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useCampaignsUIStore = create<
  CampaignsUIState & CampaignsUIActions
>()((set) => ({
  selectedStatus: null,
  searchQuery: "",
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
