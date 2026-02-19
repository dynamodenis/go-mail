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
