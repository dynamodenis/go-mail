import { create } from "zustand";

/** Reports UI store — manages client-only UI state for the reports feature */

interface ReportsDateRange {
  start: Date;
  end: Date;
}

interface ReportsUIState {
  dateRange: ReportsDateRange;
}

interface ReportsUIActions {
  setDateRange: (range: ReportsDateRange) => void;
}

export const useReportsUIStore = create<ReportsUIState & ReportsUIActions>()(
  (set) => ({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
    setDateRange: (range) => set({ dateRange: range }),
  })
);
