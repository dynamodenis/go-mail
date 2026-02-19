import { create } from "zustand";

/** Dashboard UI store — manages client-only UI state for the dashboard feature */

type DateRange = "7d" | "30d" | "90d";

interface DashboardUIState {
  selectedDateRange: DateRange;
}

interface DashboardUIActions {
  setDateRange: (range: DateRange) => void;
}

export const useDashboardUIStore = create<
  DashboardUIState & DashboardUIActions
>()((set) => ({
  selectedDateRange: "7d",
  setDateRange: (range) => set({ selectedDateRange: range }),
}));
