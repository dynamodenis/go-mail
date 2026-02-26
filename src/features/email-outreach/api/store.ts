import { create } from "zustand";
import type { TemplateCategory, MergeTagDefinition } from "../types";

/** Templates UI store — manages client-only UI state for the templates feature */

interface TemplatesUIState {
	selectedCategory: TemplateCategory | null;
	searchQuery: string;
	currentPage: number;
	deleteConfirmId: string | null;
	isEditorDirty: boolean;
	isCreateModalOpen: boolean;
	pendingMergeTags: MergeTagDefinition[];
}

interface TemplatesUIActions {
	setSelectedCategory: (category: TemplateCategory | null) => void;
	setSearchQuery: (query: string) => void;
	setCurrentPage: (page: number) => void;
	setDeleteConfirmId: (id: string | null) => void;
	setIsEditorDirty: (dirty: boolean) => void;
	setCreateModalOpen: (open: boolean) => void;
	addPendingMergeTag: (tag: MergeTagDefinition) => void;
	removePendingMergeTag: (value: string) => void;
	resetPendingMergeTags: () => void;
	resetFilters: () => void;
}

export const useTemplatesUIStore = create<
	TemplatesUIState & TemplatesUIActions
>()((set) => ({
	selectedCategory: null,
	searchQuery: "",
	currentPage: 1,
	deleteConfirmId: null,
	isEditorDirty: false,
	isCreateModalOpen: false,
	pendingMergeTags: [],
	setSelectedCategory: (category) =>
		set({ selectedCategory: category, currentPage: 1 }),
	setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
	setCurrentPage: (page) => set({ currentPage: page }),
	setDeleteConfirmId: (id) => set({ deleteConfirmId: id }),
	setIsEditorDirty: (dirty) => set({ isEditorDirty: dirty }),
	setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
	addPendingMergeTag: (tag) =>
		set((state) => {
			const exists = state.pendingMergeTags.some((t) => t.value === tag.value);
			if (exists) return state;
			return { pendingMergeTags: [...state.pendingMergeTags, tag] };
		}),
	removePendingMergeTag: (value) =>
		set((state) => ({
			pendingMergeTags: state.pendingMergeTags.filter((t) => t.value !== value),
		})),
	resetPendingMergeTags: () => set({ pendingMergeTags: [] }),
	resetFilters: () =>
		set({ selectedCategory: null, searchQuery: "", currentPage: 1 }),
}));
