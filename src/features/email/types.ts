import { z } from "zod";

export const emailFolderSchema = z.enum(["inbox", "sent", "drafts"]);
export type EmailFolder = z.infer<typeof emailFolderSchema>;

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
