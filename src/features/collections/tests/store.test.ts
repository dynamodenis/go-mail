import { describe, it, expect, beforeEach } from "vitest";
import { useCollectionsUIStore } from "../api/store";
import type { Collection } from "../schemas/types";

const mockCollection: Collection = {
	id: "col-1",
	name: "Newsletter",
	description: "Subscribers",
	color: "#3B82F6",
	contactCount: 42,
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
};

describe("useCollectionsUIStore", () => {
	beforeEach(() => {
		useCollectionsUIStore.getState().closeDeleteDialog();
		useCollectionsUIStore.getState().closeCollectionDialog();
	});

	it("has correct initial state", () => {
		const state = useCollectionsUIStore.getState();
		expect(state.deleteCollectionId).toBeNull();
		expect(state.collectionDialogOpen).toBe(false);
		expect(state.editingCollection).toBeNull();
	});

	it("openDeleteDialog sets the collection id", () => {
		useCollectionsUIStore.getState().openDeleteDialog("col-1");
		expect(useCollectionsUIStore.getState().deleteCollectionId).toBe("col-1");
	});

	it("closeDeleteDialog clears the collection id", () => {
		useCollectionsUIStore.getState().openDeleteDialog("col-1");
		useCollectionsUIStore.getState().closeDeleteDialog();
		expect(useCollectionsUIStore.getState().deleteCollectionId).toBeNull();
	});

	it("openCreateDialog opens dialog with no editing collection", () => {
		useCollectionsUIStore.getState().openCreateDialog();
		const state = useCollectionsUIStore.getState();
		expect(state.collectionDialogOpen).toBe(true);
		expect(state.editingCollection).toBeNull();
	});

	it("openEditDialog opens dialog with the collection to edit", () => {
		useCollectionsUIStore.getState().openEditDialog(mockCollection);
		const state = useCollectionsUIStore.getState();
		expect(state.collectionDialogOpen).toBe(true);
		expect(state.editingCollection).toEqual(mockCollection);
	});

	it("closeCollectionDialog resets dialog state", () => {
		useCollectionsUIStore.getState().openEditDialog(mockCollection);
		useCollectionsUIStore.getState().closeCollectionDialog();
		const state = useCollectionsUIStore.getState();
		expect(state.collectionDialogOpen).toBe(false);
		expect(state.editingCollection).toBeNull();
	});

	it("openCreateDialog clears a previously editing collection", () => {
		useCollectionsUIStore.getState().openEditDialog(mockCollection);
		useCollectionsUIStore.getState().openCreateDialog();
		expect(useCollectionsUIStore.getState().editingCollection).toBeNull();
	});
});
