import { create } from "zustand";

/** Contacts UI store — manages transient client-only UI state for the contacts feature.
 *  Search/filter/pagination state lives in URL search params, not here. */

interface ContactsUIState {
  deleteContactId: string | null;
  createContactOpen: boolean;
}

interface ContactsUIActions {
  openDeleteDialog: (contactId: string) => void;
  closeDeleteDialog: () => void;
  setCreateContactOpen: (open: boolean) => void;
}

export const useContactsUIStore = create<
  ContactsUIState & ContactsUIActions
>()((set) => ({
  deleteContactId: null,
  createContactOpen: false,
  openDeleteDialog: (contactId) => set({ deleteContactId: contactId }),
  closeDeleteDialog: () => set({ deleteContactId: null }),
  setCreateContactOpen: (open) => set({ createContactOpen: open }),
}));
