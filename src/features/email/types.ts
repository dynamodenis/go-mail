import { z } from "zod";

export const emailFolderSchema = z.enum(["inbox", "sent", "drafts"]);
export type EmailFolder = z.infer<typeof emailFolderSchema>;

/** Maps a UI folder to the IMAP special-use attribute Nylas tags the matching
 *  system folder with. Resolving by attribute (not name) keeps folder lookup
 *  working across Gmail/Microsoft/iCloud, which name their system folders
 *  differently. */
export const FOLDER_ATTRIBUTE: Record<EmailFolder, string> = {
  inbox: "\\Inbox",
  sent: "\\Sent",
  drafts: "\\Drafts",
};

/** Error codes the email feature throws/returns. NOT_CONNECTED and
 *  NOT_CONFIGURED are expected states the UI turns into a connect CTA rather
 *  than a generic error. */
export const EMAIL_ERROR = {
  NOT_CONFIGURED: "NYLAS_NOT_CONFIGURED",
  NOT_CONNECTED: "NYLAS_NOT_CONNECTED",
  FETCH_FAILED: "EMAIL_FETCH_FAILED",
} as const;

/** Codes that represent "no mailbox to read", surfaced as a CTA, not an error. */
export const EMAIL_CONNECT_CODES: ReadonlySet<string> = new Set([
  EMAIL_ERROR.NOT_CONFIGURED,
  EMAIL_ERROR.NOT_CONNECTED,
]);

export const emailThreadsQuerySchema = z.object({
  folder: emailFolderSchema,
  search: z.string().trim().max(255).optional(),
});
export type EmailThreadsQuery = z.infer<typeof emailThreadsQuerySchema>;

export const emailThreadDetailQuerySchema = z.object({
  threadId: z.string().min(1),
});
export type EmailThreadDetailQuery = z.infer<typeof emailThreadDetailQuerySchema>;

export const emailFiltersSchema = z.object({
  folder: emailFolderSchema.default("inbox"),
  search: z.string().optional(),
  unreadOnly: z.boolean().default(false),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(25),
});
export type EmailFilters = z.infer<typeof emailFiltersSchema>;

export const sendEmailSchema = z.object({
  to: z.array(z.string().email()).min(1, "At least one recipient is required"),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().min(1, "Subject is required").max(255),
  body: z.string().min(1, "Email body is required"),
  replyToMessageId: z.string().optional(),
});
export type SendEmailInput = z.infer<typeof sendEmailSchema>;

export const saveDraftSchema = z.object({
  to: z.array(z.string().email()).optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().max(255).optional(),
  body: z.string().optional(),
  draftId: z.string().optional(),
});
export type SaveDraftInput = z.infer<typeof saveDraftSchema>;

export interface EmailMessage {
  id: string;
  threadId: string;
  from: EmailParticipant;
  to: EmailParticipant[];
  cc: EmailParticipant[];
  bcc: EmailParticipant[];
  subject: string;
  body: string;
  snippet: string;
  isRead: boolean;
  starred: boolean;
  date: string;
  folders: string[];
  attachments: EmailAttachment[];
}

export interface EmailParticipant {
  name: string | null;
  email: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
}

// ── Inbox UI shapes (Superhuman-style list + reading pane) ──────────────────
// Provider-agnostic shapes the inbox UI renders, so the Nylas integration can
// map its payloads onto them without the components knowing about Nylas.

/** A condensed thread for the list pane. */
export interface EmailThread {
  id: string;
  subject: string;
  snippet: string;
  unread: boolean;
  starred: boolean;
  hasAttachments: boolean;
  /** Participants shown as the avatar stack in the reading pane. */
  participants: EmailParticipant[];
  /** Name/email shown in the list row — latest sender, or the recipient for
   *  the sent/drafts folders. */
  preview: EmailParticipant;
  date: string; // ISO
  messageCount: number;
}

/** A single message within an opened thread (reading pane). */
export interface EmailThreadMessage {
  id: string;
  from: EmailParticipant;
  to: EmailParticipant[];
  cc?: EmailParticipant[];
  subject: string;
  /** Skeleton renders this as plain text; once Nylas is wired this becomes
   *  sanitized HTML (CLAUDE.md security rules — sanitize before render). */
  body: string;
  snippet: string;
  date: string; // ISO
  unread: boolean;
}

/** The fully-expanded thread for the reading pane. */
export interface EmailThreadDetail {
  id: string;
  subject: string;
  participants: EmailParticipant[];
  messages: EmailThreadMessage[];
}
