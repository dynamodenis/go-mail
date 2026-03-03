import { create } from "zustand";
import type { Collection } from "@/features/collections/schemas/types";

/** Collections UI store — manages transient client-only UI state for the collections feature.
 *  Search/filter/pagination state lives in URL search params, not here. */

interface CollectionsUIState {
	deleteCollectionId: string | null;
	collectionDialogOpen: boolean;
	editingCollection: Collection | null;
}

interface CollectionsUIActions {
	openDeleteDialog: (collectionId: string) => void;
	closeDeleteDialog: () => void;
	openCreateDialog: () => void;
	openEditDialog: (collection: Collection) => void;
	closeCollectionDialog: () => void;
}

export const useCollectionsUIStore = create<
	CollectionsUIState & CollectionsUIActions
>()((set) => ({
	deleteCollectionId: null,
	collectionDialogOpen: false,
	editingCollection: null,
	openDeleteDialog: (collectionId) => set({ deleteCollectionId: collectionId }),
	closeDeleteDialog: () => set({ deleteCollectionId: null }),
	openCreateDialog: () =>
		set({ collectionDialogOpen: true, editingCollection: null }),
	openEditDialog: (collection) =>
		set({ collectionDialogOpen: true, editingCollection: collection }),
	closeCollectionDialog: () =>
		set({ collectionDialogOpen: false, editingCollection: null }),
}));
