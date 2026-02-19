import { create } from "zustand";

/** Calendar UI store — manages client-only UI state for the calendar feature */

type CalendarView = "month" | "week" | "day";

interface CalendarUIState {
  currentDate: Date;
  view: CalendarView;
}

interface CalendarUIActions {
  setCurrentDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
}

export const useCalendarUIStore = create<CalendarUIState & CalendarUIActions>()(
  (set) => ({
    currentDate: new Date(),
    view: "month",
    setCurrentDate: (date) => set({ currentDate: date }),
    setView: (view) => set({ view }),
  })
);
