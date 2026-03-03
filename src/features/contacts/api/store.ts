import { create } from "zustand";
import type { Contact } from "@/features/contacts/schemas/types";

/** Contacts UI store — manages transient client-only UI state for the contacts feature.
 *  Search/filter/pagination state lives in URL search params, not here. */

interface ContactsUIState {
	deleteContactId: string | null;
	contactDialogOpen: boolean;
	editingContact: Contact | null;
}

interface ContactsUIActions {
	openDeleteDialog: (contactId: string) => void;
	closeDeleteDialog: () => void;
	openCreateDialog: () => void;
	openEditDialog: (contact: Contact) => void;
	closeContactDialog: () => void;
}

export const useContactsUIStore = create<
	ContactsUIState & ContactsUIActions
>()((set) => ({
	deleteContactId: null,
	contactDialogOpen: false,
	editingContact: null,
	openDeleteDialog: (contactId) => set({ deleteContactId: contactId }),
	closeDeleteDialog: () => set({ deleteContactId: null }),
	openCreateDialog: () =>
		set({ contactDialogOpen: true, editingContact: null }),
	openEditDialog: (contact) =>
		set({ contactDialogOpen: true, editingContact: contact }),
	closeContactDialog: () =>
		set({ contactDialogOpen: false, editingContact: null }),
}));
