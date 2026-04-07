import { create } from "zustand";
import type { Editor, JSONContent } from "@tiptap/react";
import type { Contact } from "@/features/contacts/schemas/types";
import type { Template } from "@/features/email-templates/types";
import {
  resolveTemplateHtml,
  resolveTemplateTags,
} from "@/features/email-templates/utils/resolve-merge-tags";
import { getContacts } from "@/features/contacts/api/server";
import type { Recipient, ManualRecipient, ComposerMode } from "../types";
import { getRecipientEmail, getRecipientName } from "../types";
import type { BatchSource } from "@/features/email-schedule/types";

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

  // Per-recipient Tiptap rooms — each recipient gets their own collab doc
  activeRecipientEmail: string | null;
  recipientRooms: Record<string, string>;

  // Collection infinite scroll
  loadedCollectionId: string | null;
  collectionPage: number;
  collectionTotal: number;
  isLoadingMoreRecipients: boolean;

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

  // Per-recipient room actions
  selectRecipientForPreview: (email: string | null) => void;
  setEditorRef: (editor: Editor) => void;
  recipientRoomInitialized: (roomId: string) => void;
  recipientContentChanged: (html: string) => void;

  // Collection infinite scroll
  setCollectionPagination: (collectionId: string, total: number) => void;
  loadMoreCollectionRecipients: () => Promise<void>;
  hasMoreCollectionRecipients: () => boolean;

  getAllToEmails: () => string[];
  getBatchSources: () => BatchSource[];
  getEstimatedRecipientCount: () => number;
  reset: () => void;
}

export type EmailComposerStoreType = EmailComposerState & EmailComposerActions;

/** Non-reactive mutable refs — avoids re-renders for editor & file objects */
export const composerRefs = {
  localFiles: [] as File[],
  openFilePicker: null as (() => void) | null,
  editor: null as Editor | null,
  templateContent: null as JSONContent | null,
  templateHtml: null as string | null,
  pendingRecipientContent: {} as Record<string, JSONContent>,
  initializedRooms: new Set<string>(),
  recipientBodyMap: {} as Record<string, string>,
};

function clearRefs() {
  composerRefs.localFiles = [];
  composerRefs.openFilePicker = null;
  composerRefs.editor = null;
  composerRefs.templateContent = null;
  composerRefs.templateHtml = null;
  composerRefs.pendingRecipientContent = {};
  composerRefs.initializedRooms = new Set();
  composerRefs.recipientBodyMap = {};
}

function clearRecipientRefs() {
  composerRefs.pendingRecipientContent = {};
  composerRefs.initializedRooms = new Set();
  composerRefs.recipientBodyMap = {};
  composerRefs.templateContent = null;
  composerRefs.templateHtml = null;
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
  activeRecipientEmail: null,
  recipientRooms: {},
  loadedCollectionId: null,
  collectionPage: 0,
  collectionTotal: 0,
  isLoadingMoreRecipients: false,
  draftId: null,
};

export const useEmailComposerStore = create<EmailComposerStoreType>()(
  (set, get) => {
    // ── Private helpers ─────────────────────────────────────────────

    function captureTemplateContent() {
      if (composerRefs.editor) {
        composerRefs.templateContent = composerRefs.editor.getJSON();
        composerRefs.templateHtml = composerRefs.editor.getHTML();
      }
    }

    function getContactFields(recipient: Recipient) {
      if (recipient.type === "contact") {
        return {
          firstName: recipient.contact.firstName,
          lastName: recipient.contact.lastName,
          email: recipient.contact.email,
          company: recipient.contact.company,
        };
      }
      return { firstName: null, lastName: null, email: recipient.email, company: null };
    }

    function createRecipientRoom(recipient: Recipient) {
      const { selectedTemplate } = get();
      const tiptapRef = selectedTemplate?.tiptapReference;
      const hasTemplate = !!tiptapRef;
      const hasContent =
        composerRefs.templateContent !== null &&
        composerRefs.editor !== null &&
        !composerRefs.editor.isEmpty;
      if (!hasTemplate && !hasContent) return;

      const templateJSON = composerRefs.templateContent;
      if (!templateJSON) return;

      const email = getRecipientEmail(recipient);
      const contactFields = getContactFields(recipient);
      const resolvedContent = resolveTemplateTags(
        templateJSON as Record<string, unknown>,
        contactFields,
      );
      const roomId = `email-recipient-${email}-${tiptapRef ?? Date.now()}`;

      set((state) => ({
        recipientRooms: { ...state.recipientRooms, [email]: roomId },
      }));
      composerRefs.pendingRecipientContent[email] = resolvedContent as JSONContent;
      
      if (composerRefs.templateHtml) {
        composerRefs.recipientBodyMap[email] = resolveTemplateHtml(
          composerRefs.templateHtml,
          contactFields,
        );
      }
    }

    // ── Store definition ────────────────────────────────────────────

    return {
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
          recipientRooms: {},
          activeRecipientEmail: null,
        });
        clearRecipientRefs();
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
          const newRecipient: Recipient = { type: "contact", contact };
          set((s) => ({
            toRecipients: [...s.toRecipients, newRecipient],
          }));

          // Create a recipient room if template content exists
          if (get().toRecipients.length === 1) {
            captureTemplateContent();
          }
          createRecipientRoom(newRecipient);
        }
      },

      addManualRecipient: (email, name) => {
        const exists = get().toRecipients.some(
          (r) => getRecipientEmail(r) === email,
        );
        if (!exists) {
          const newRecipient: Recipient = { type: "manual", email, name };
          set((s) => ({
            toRecipients: [...s.toRecipients, newRecipient],
          }));

          if (get().toRecipients.length === 1) {
            captureTemplateContent();
          }
          createRecipientRoom(newRecipient);
        }
      },

      removeRecipient: (email) => {
        const { activeRecipientEmail } = get();
        set((s) => {
          const { [email]: _r, ...restRooms } = s.recipientRooms;
          return {
            toRecipients: s.toRecipients.filter(
              (r) => getRecipientEmail(r) !== email,
            ),
            recipientRooms: restRooms,
            activeRecipientEmail:
              activeRecipientEmail === email ? null : activeRecipientEmail,
          };
        });
        delete composerRefs.pendingRecipientContent[email];
        delete composerRefs.recipientBodyMap[email];
      },

      bulkAddContactRecipients: (contacts) => {
        const existing = new Set(get().toRecipients.map(getRecipientEmail));
        const newRecipients: Recipient[] = contacts
          .filter((c) => !existing.has(c.email))
          .map((contact) => ({ type: "contact", contact }));
        if (newRecipients.length === 0) return;

        const isFirstAdd = get().toRecipients.length === 0;
        set((s) => ({
          toRecipients: [...s.toRecipients, ...newRecipients],
        }));

        if (isFirstAdd) {
          captureTemplateContent();
        }
        for (const recipient of newRecipients) {
          createRecipientRoom(recipient);
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

      // Per-recipient room actions
      selectRecipientForPreview: (email) => {
        const { activeRecipientEmail, recipientRooms, toRecipients } = get();
        if (email === activeRecipientEmail) return;

        // Capture outgoing recipient's body before switching
        if (activeRecipientEmail !== null && composerRefs.editor) {
          composerRefs.recipientBodyMap[activeRecipientEmail] =
            composerRefs.editor.getHTML();
        }

        // Switching from template mode to recipient mode — capture template
        if (activeRecipientEmail === null && email !== null) {
          captureTemplateContent();
        }

        // Create room if recipient doesn't have one yet
        if (email !== null && !recipientRooms[email]) {
          const recipient = toRecipients.find(
            (r) => getRecipientEmail(r) === email,
          );
          if (recipient) {
            createRecipientRoom(recipient);
          }
        }

        set({ activeRecipientEmail: email });
      },

      setEditorRef: (editor) => {
        composerRefs.editor = editor;
      },

      recipientRoomInitialized: (roomId) => {
        composerRefs.initializedRooms.add(roomId);
      },

      recipientContentChanged: (html) => {
        const { activeRecipientEmail } = get();
        if (activeRecipientEmail !== null) {
          composerRefs.recipientBodyMap[activeRecipientEmail] = html;
        }
      },

      // Collection infinite scroll
      setCollectionPagination: (collectionId, total) => {
        set({
          loadedCollectionId: collectionId,
          collectionPage: 1,
          collectionTotal: total,
          isLoadingMoreRecipients: false,
        });
      },

      loadMoreCollectionRecipients: async () => {
        const { loadedCollectionId, collectionPage, isLoadingMoreRecipients } = get();
        if (!loadedCollectionId || isLoadingMoreRecipients) return;

        const nextPage = collectionPage + 1;
        set({ isLoadingMoreRecipients: true });

        try {
          const result = await getContacts({
            data: {
              collectionId: loadedCollectionId,
              page: nextPage,
              pageSize: 100,
            },
          });
          if (!("error" in result)) {
            get().bulkAddContactRecipients(result.data.data);
            set({ collectionPage: nextPage });
          }
        } finally {
          set({ isLoadingMoreRecipients: false });
        }
      },

      hasMoreCollectionRecipients: () => {
        const { loadedCollectionId, collectionPage, collectionTotal } = get();
        if (!loadedCollectionId) return false;
        return collectionPage * 100 < collectionTotal;
      },

      // Helpers
      getAllToEmails: () => get().toRecipients.map(getRecipientEmail),

      getBatchSources: (): BatchSource[] => {
        const { loadedCollectionId, toRecipients } = get();
        const sources: BatchSource[] = [];

        if (loadedCollectionId) {
          sources.push({ type: "COLLECTION", collectionId: loadedCollectionId });
        }

        // Add individual recipients (manual ones, or contacts added outside collection)
        for (const r of toRecipients) {
          if (r.type === "manual") {
            sources.push({ type: "INDIVIDUAL", email: r.email, name: r.name });
          } else if (!loadedCollectionId) {
            // If no collection loaded, treat all contacts as individual sources
            sources.push({
              type: "INDIVIDUAL",
              email: r.contact.email,
              name: getRecipientName(r),
            });
          }
        }

        return sources;
      },

      getEstimatedRecipientCount: () => {
        const { loadedCollectionId, collectionTotal, toRecipients } = get();
        if (loadedCollectionId) {
          // Count collection total + any manually added recipients not from the collection
          const manualCount = toRecipients.filter((r) => r.type === "manual").length;
          return collectionTotal + manualCount;
        }
        return toRecipients.length;
      },

      // Reset
      reset: () => {
        set(initialState);
        clearRefs();
      },
    };
  },
);
