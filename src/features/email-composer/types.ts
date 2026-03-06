import { z } from "zod";
import type { Contact } from "@/features/contacts/schemas/types";

/** Manual email entry (typed by hand, not from contact DB) */
export interface ManualRecipient {
  email: string;
  name?: string;
}

/** A selected recipient — either a DB contact or a manually-typed email */
export type Recipient =
  | { type: "contact"; contact: Contact }
  | { type: "manual"; email: string; name?: string };

/** Helper to extract email from any recipient */
export function getRecipientEmail(r: Recipient): string {
  return r.type === "contact" ? r.contact.email : r.email;
}

/** Helper to get display name from a recipient */
export function getRecipientName(r: Recipient): string {
  if (r.type === "contact") {
    return [r.contact.firstName, r.contact.lastName].filter(Boolean).join(" ") || r.contact.email;
  }
  return r.name || r.email;
}

/** Merge tag context for live preview in the center panel */
export interface MergeTagContext {
  firstName?: string;
  lastName?: string;
  email: string;
  company?: string;
  [key: string]: string | undefined;
}

/** Build merge tag context from a recipient */
export function recipientToMergeContext(r: Recipient): MergeTagContext {
  if (r.type === "contact") {
    return {
      firstName: r.contact.firstName ?? undefined,
      lastName: r.contact.lastName ?? undefined,
      email: r.contact.email,
      company: r.contact.company ?? undefined,
    };
  }
  return { email: r.email };
}

/** Conversation message in the collaboration panel */
export interface ConversationMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

/** Composer mode */
export type ComposerMode = "compose" | "reply" | "forward";

/** Send email input (used by server function) */
export const composerSendSchema = z.object({
  to: z.array(z.string().email()).min(1, "At least one recipient required"),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().min(1, "Subject is required").max(255),
  body: z.string().min(1, "Email body is required"),
  templateId: z.string().uuid().optional(),
  replyToMessageId: z.string().optional(),
});
export type ComposerSendInput = z.infer<typeof composerSendSchema>;
