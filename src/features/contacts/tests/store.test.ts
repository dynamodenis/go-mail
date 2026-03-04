import { describe, it, expect, beforeEach } from "vitest";
import { useContactsUIStore } from "../api/store";
import type { Contact } from "../schemas/types";

const mockContact: Contact = {
	id: "ct-1",
	email: "alice@example.com",
	firstName: "Alice",
	lastName: "Smith",
	phone: "+1234567890",
	company: "Acme Inc",
	status: "ACTIVE",
	tags: ["vip"],
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
};

describe("useContactsUIStore", () => {
	beforeEach(() => {
		useContactsUIStore.getState().closeDeleteDialog();
		useContactsUIStore.getState().closeContactDialog();
	});

	it("has correct initial state", () => {
		const state = useContactsUIStore.getState();
		expect(state.deleteContactId).toBeNull();
		expect(state.contactDialogOpen).toBe(false);
		expect(state.editingContact).toBeNull();
	});

	it("openDeleteDialog sets the contact id", () => {
		useContactsUIStore.getState().openDeleteDialog("ct-1");
		expect(useContactsUIStore.getState().deleteContactId).toBe("ct-1");
	});

	it("closeDeleteDialog clears the contact id", () => {
		useContactsUIStore.getState().openDeleteDialog("ct-1");
		useContactsUIStore.getState().closeDeleteDialog();
		expect(useContactsUIStore.getState().deleteContactId).toBeNull();
	});

	it("openCreateDialog opens dialog with no editing contact", () => {
		useContactsUIStore.getState().openCreateDialog();
		const state = useContactsUIStore.getState();
		expect(state.contactDialogOpen).toBe(true);
		expect(state.editingContact).toBeNull();
	});

	it("openEditDialog opens dialog with the contact to edit", () => {
		useContactsUIStore.getState().openEditDialog(mockContact);
		const state = useContactsUIStore.getState();
		expect(state.contactDialogOpen).toBe(true);
		expect(state.editingContact).toEqual(mockContact);
	});

	it("closeContactDialog resets dialog state", () => {
		useContactsUIStore.getState().openEditDialog(mockContact);
		useContactsUIStore.getState().closeContactDialog();
		const state = useContactsUIStore.getState();
		expect(state.contactDialogOpen).toBe(false);
		expect(state.editingContact).toBeNull();
	});

	it("openCreateDialog clears a previously editing contact", () => {
		useContactsUIStore.getState().openEditDialog(mockContact);
		useContactsUIStore.getState().openCreateDialog();
		expect(useContactsUIStore.getState().editingContact).toBeNull();
	});
});
