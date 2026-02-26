import { create } from "zustand";

/** Email Composer UI store — manages client-only UI state for composing emails */

interface EmailComposerUIState {
	selectedTemplateId: string | null;
}

interface EmailComposerUIActions {
	setSelectedTemplateId: (id: string | null) => void;
	reset: () => void;
}

export const useEmailComposerUIStore = create<
	EmailComposerUIState & EmailComposerUIActions
>()((set) => ({
	selectedTemplateId: null,
	setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
	reset: () => set({ selectedTemplateId: null }),
}));
