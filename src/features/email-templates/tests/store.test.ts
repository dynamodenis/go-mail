import { describe, it, expect, beforeEach } from "vitest";
import { useTemplatesUIStore } from "../api/store";

describe("useTemplatesUIStore", () => {
	beforeEach(() => {
		useTemplatesUIStore.getState().resetFilters();
		useTemplatesUIStore.getState().setDeleteConfirmId(null);
		useTemplatesUIStore.getState().setIsEditorDirty(false);
		useTemplatesUIStore.getState().setCreateModalOpen(false);
		useTemplatesUIStore.getState().resetPendingMergeTags();
	});

	it("has correct initial state", () => {
		const state = useTemplatesUIStore.getState();
		expect(state.selectedCategory).toBeNull();
		expect(state.searchQuery).toBe("");
		expect(state.currentPage).toBe(1);
		expect(state.deleteConfirmId).toBeNull();
		expect(state.isEditorDirty).toBe(false);
		expect(state.isCreateModalOpen).toBe(false);
		expect(state.pendingMergeTags).toEqual([]);
	});

	it("setSelectedCategory updates category and resets page", () => {
		const store = useTemplatesUIStore;
		store.getState().setCurrentPage(3);
		store.getState().setSelectedCategory("NEWSLETTER");
		expect(store.getState().selectedCategory).toBe("NEWSLETTER");
		expect(store.getState().currentPage).toBe(1);
	});

	it("setSearchQuery updates query and resets page", () => {
		const store = useTemplatesUIStore;
		store.getState().setCurrentPage(3);
		store.getState().setSearchQuery("welcome");
		expect(store.getState().searchQuery).toBe("welcome");
		expect(store.getState().currentPage).toBe(1);
	});

	it("setCurrentPage updates page", () => {
		const store = useTemplatesUIStore;
		store.getState().setCurrentPage(5);
		expect(store.getState().currentPage).toBe(5);
	});

	it("setDeleteConfirmId updates id", () => {
		const store = useTemplatesUIStore;
		store.getState().setDeleteConfirmId("abc-123");
		expect(store.getState().deleteConfirmId).toBe("abc-123");
	});

	it("setIsEditorDirty updates dirty flag", () => {
		const store = useTemplatesUIStore;
		store.getState().setIsEditorDirty(true);
		expect(store.getState().isEditorDirty).toBe(true);
	});

	it("resetFilters returns to defaults", () => {
		const store = useTemplatesUIStore;
		store.getState().setSelectedCategory("PROMOTIONAL");
		store.getState().setSearchQuery("test");
		store.getState().setCurrentPage(5);
		store.getState().resetFilters();
		expect(store.getState().selectedCategory).toBeNull();
		expect(store.getState().searchQuery).toBe("");
		expect(store.getState().currentPage).toBe(1);
	});

	it("setCreateModalOpen toggles modal state", () => {
		const store = useTemplatesUIStore;
		store.getState().setCreateModalOpen(true);
		expect(store.getState().isCreateModalOpen).toBe(true);
		store.getState().setCreateModalOpen(false);
		expect(store.getState().isCreateModalOpen).toBe(false);
	});

	it("addPendingMergeTag adds a tag", () => {
		const store = useTemplatesUIStore;
		store.getState().addPendingMergeTag({ label: "Company", value: "{company}" });
		expect(store.getState().pendingMergeTags).toEqual([
			{ label: "Company", value: "{company}" },
		]);
	});

	it("addPendingMergeTag prevents duplicates", () => {
		const store = useTemplatesUIStore;
		store.getState().addPendingMergeTag({ label: "Company", value: "{company}" });
		store.getState().addPendingMergeTag({ label: "Company 2", value: "{company}" });
		expect(store.getState().pendingMergeTags).toHaveLength(1);
	});

	it("removePendingMergeTag removes a tag by value", () => {
		const store = useTemplatesUIStore;
		store.getState().addPendingMergeTag({ label: "Company", value: "{company}" });
		store.getState().addPendingMergeTag({ label: "Title", value: "{title}" });
		store.getState().removePendingMergeTag("{company}");
		expect(store.getState().pendingMergeTags).toEqual([
			{ label: "Title", value: "{title}" },
		]);
	});

	it("resetPendingMergeTags clears all pending tags", () => {
		const store = useTemplatesUIStore;
		store.getState().addPendingMergeTag({ label: "Company", value: "{company}" });
		store.getState().addPendingMergeTag({ label: "Title", value: "{title}" });
		store.getState().resetPendingMergeTags();
		expect(store.getState().pendingMergeTags).toEqual([]);
	});
});
