import { create } from "zustand";

/** Settings UI store — manages client-only UI state for the settings feature */

interface SettingsUIState {
  activeTab: string;
}

interface SettingsUIActions {
  setActiveTab: (tab: string) => void;
}

export const useSettingsUIStore = create<SettingsUIState & SettingsUIActions>()(
  (set) => ({
    activeTab: "account",
    setActiveTab: (tab) => set({ activeTab: tab }),
  })
);
