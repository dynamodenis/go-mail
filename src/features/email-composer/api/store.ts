import { create } from "zustand";
import type { Contact } from "@/features/contacts/schemas/types";
import type { Template } from "@/features/email-templates/types";
import type { Recipient, ManualRecipient, ComposerMode } from "../types";
import { getRecipientEmail } from "../types";

/**
 * Email Composer UI store — manages all client-only state for the
 * three-panel email composer dialog.
 *
 * Left sidebar: template select + recipient search
 * Center panel: subject + body editor with merge tag preview
 * Right sidebar: collaboration conversation
 */

interface EmailComposerState {
  open: boolean;
  mode: ComposerMode;

  // Template
  selectedTemplate: Template | null;
  isTemplateModalOpen: boolean;

  // Content
  subject: string;
  bodyHtml: string;

  // Recipients
  toRecipients: Recipient[];
  ccRecipients: ManualRecipient[];
  bccRecipients: ManualRecipient[];
  recipientSearch: string;
  showCcBcc: boolean;

  // Panels
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;

  // Collaboration
  conversationMessage: string;

  // Attachments — actual File objects stored in composerRefs (non-reactive)
  fileVersion: number;

  // Preview — which recipient's merge tags to show in live preview
  previewRecipientIndex: number;

  // Draft
  draftId: string | null;
}

interface EmailComposerActions {
  setOpen: (open: boolean) => void;
  setMode: (mode: ComposerMode) => void;

  setSelectedTemplate: (template: Template | null) => void;
  setTemplateModalOpen: (open: boolean) => void;

  setSubject: (subject: string) => void;
  setBodyHtml: (html: string) => void;

  addContactRecipient: (contact: Contact) => void;
  addManualRecipient: (email: string, name?: string) => void;
  removeRecipient: (email: string) => void;
  bulkAddContactRecipients: (contacts: Contact[]) => void;
  setRecipientSearch: (search: string) => void;
  setShowCcBcc: (show: boolean) => void;

  addCcRecipient: (email: string, name?: string) => void;
  removeCcRecipient: (email: string) => void;
  addBccRecipient: (email: string, name?: string) => void;
  removeBccRecipient: (email: string) => void;

  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;

  setConversationMessage: (msg: string) => void;

  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;

  setPreviewRecipientIndex: (idx: number) => void;
  setDraftId: (id: string | null) => void;

  getAllToEmails: () => string[];
  reset: () => void;
}

export type EmailComposerStoreType = EmailComposerState & EmailComposerActions;

/** Non-reactive mutable refs — avoids re-renders for editor & file objects */
export const composerRefs = {
  localFiles: [] as File[],
  openFilePicker: null as (() => void) | null,
};

function clearRefs() {
  composerRefs.localFiles = [];
  composerRefs.openFilePicker = null;
}

const initialState: EmailComposerState = {
  open: false,
  mode: "compose",
  selectedTemplate: null,
  isTemplateModalOpen: false,
  subject: "",
  bodyHtml: "",
  toRecipients: [],
  ccRecipients: [],
  bccRecipients: [],
  recipientSearch: "",
  showCcBcc: false,
  isLeftSidebarOpen: true,
  isRightSidebarOpen: false,
  conversationMessage: "",
  fileVersion: 0,
  previewRecipientIndex: 0,
  draftId: null,
};

export const useEmailComposerStore = create<EmailComposerStoreType>()(
  (set, get) => ({
    ...initialState,

    setOpen: (open) => set({ open }),
    setMode: (mode) => set({ mode }),

    // Template — also populates subject & body from template
    setSelectedTemplate: (template) => {
      set({
        selectedTemplate: template,
        subject: template?.subject ?? get().subject,
        bodyHtml: template?.bodyHtml ?? get().bodyHtml,
        isTemplateModalOpen: false,
      });
    },
    setTemplateModalOpen: (open) => set({ isTemplateModalOpen: open }),

    // Content
    setSubject: (subject) => set({ subject }),
    setBodyHtml: (html) => set({ bodyHtml: html }),

    // Recipients — deduplicate by email
    addContactRecipient: (contact) => {
      const exists = get().toRecipients.some(
        (r) => getRecipientEmail(r) === contact.email,
      );
      if (!exists) {
        set((s) => ({
          toRecipients: [...s.toRecipients, { type: "contact", contact }],
        }));
      }
    },

    addManualRecipient: (email, name) => {
      const exists = get().toRecipients.some(
        (r) => getRecipientEmail(r) === email,
      );
      if (!exists) {
        set((s) => ({
          toRecipients: [...s.toRecipients, { type: "manual", email, name }],
        }));
      }
    },

    removeRecipient: (email) => {
      set((s) => ({
        toRecipients: s.toRecipients.filter(
          (r) => getRecipientEmail(r) !== email,
        ),
      }));
    },

    bulkAddContactRecipients: (contacts) => {
      const existing = new Set(get().toRecipients.map(getRecipientEmail));
      const newRecipients: Recipient[] = contacts
        .filter((c) => !existing.has(c.email))
        .map((contact) => ({ type: "contact", contact }));
      if (newRecipients.length > 0) {
        set((s) => ({
          toRecipients: [...s.toRecipients, ...newRecipients],
        }));
      }
    },

    setRecipientSearch: (search) => set({ recipientSearch: search }),
    setShowCcBcc: (show) => set({ showCcBcc: show }),

    // CC / BCC
    addCcRecipient: (email, name) => {
      if (!get().ccRecipients.some((r) => r.email === email)) {
        set((s) => ({ ccRecipients: [...s.ccRecipients, { email, name }] }));
      }
    },
    removeCcRecipient: (email) =>
      set((s) => ({
        ccRecipients: s.ccRecipients.filter((r) => r.email !== email),
      })),
    addBccRecipient: (email, name) => {
      if (!get().bccRecipients.some((r) => r.email === email)) {
        set((s) => ({ bccRecipients: [...s.bccRecipients, { email, name }] }));
      }
    },
    removeBccRecipient: (email) =>
      set((s) => ({
        bccRecipients: s.bccRecipients.filter((r) => r.email !== email),
      })),

    // Panels
    toggleLeftSidebar: () =>
      set((s) => ({ isLeftSidebarOpen: !s.isLeftSidebarOpen })),
    toggleRightSidebar: () =>
      set((s) => ({ isRightSidebarOpen: !s.isRightSidebarOpen })),

    // Collaboration
    setConversationMessage: (msg) => set({ conversationMessage: msg }),

    // File management (actual File objects in composerRefs)
    addFiles: (files) => {
      composerRefs.localFiles = [...composerRefs.localFiles, ...files];
      set((s) => ({ fileVersion: s.fileVersion + 1 }));
    },
    removeFile: (index) => {
      composerRefs.localFiles = composerRefs.localFiles.filter(
        (_, i) => i !== index,
      );
      set((s) => ({ fileVersion: s.fileVersion + 1 }));
    },

    // Preview
    setPreviewRecipientIndex: (idx) => set({ previewRecipientIndex: idx }),
    setDraftId: (id) => set({ draftId: id }),

    // Helpers
    getAllToEmails: () => get().toRecipients.map(getRecipientEmail),

    // Reset
    reset: () => {
      set(initialState);
      clearRefs();
    },
  }),
);
