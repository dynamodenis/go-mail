import { z } from "zod";

export const sendingProviderSchema = z.enum([
  "NYLAS",
  "SENDGRID",
  "MAILGUN",
  "SES",
  "NONE",
]);
export type SendingProvider = z.infer<typeof sendingProviderSchema>;

export const settingsTabSchema = z.enum([
  "account",
  "team",
  "integrations",
  "compliance",
  "logs",
]);
export type SettingsTab = z.infer<typeof settingsTabSchema>;

export const updateAccountSettingsSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  companyName: z.string().max(255).optional(),
  timezone: z.string().optional(),
  defaultFromName: z.string().max(255).optional(),
  defaultFromEmail: z.string().email().optional(),
  defaultReplyTo: z.string().email().optional(),
});
export type UpdateAccountSettingsInput = z.infer<
  typeof updateAccountSettingsSchema
>;

export const updateComplianceSettingsSchema = z.object({
  physicalAddress: z.string().min(1, "Physical address is required for CAN-SPAM compliance").max(500),
  unsubscribeUrl: z.string().url().optional(),
  includeUnsubscribeLink: z.boolean().default(true),
});
export type UpdateComplianceSettingsInput = z.infer<
  typeof updateComplianceSettingsSchema
>;

export const connectNylasSchema = z.object({
  grantId: z.string().min(1),
  email: z.string().email(),
});
export type ConnectNylasInput = z.infer<typeof connectNylasSchema>;

/** Identifies one of the user's connected Nylas accounts for disconnect /
 *  set-primary actions. */
export const nylasAccountIdSchema = z.object({
  accountId: z.string().min(1),
});
export type NylasAccountIdInput = z.infer<typeof nylasAccountIdSchema>;

/** Query params Nylas appends when redirecting back to our callback route. */
export const nylasCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});
export type NylasCallbackInput = z.infer<typeof nylasCallbackSchema>;

/** One connected mailbox. `isPrimary` marks the default used by inbox/sending. */
export interface NylasAccount {
  id: string;
  email: string;
  isPrimary: boolean;
  createdAt: string;
}

/** Connection status surfaced to the Integrations UI. `configured` reflects the
 *  server env; `accounts` is every mailbox this user has connected (empty when
 *  none). */
export interface NylasConnection {
  configured: boolean;
  accounts: NylasAccount[];
}

export interface UserSettings {
  id: string;
  userId: string;
  displayName: string | null;
  companyName: string | null;
  timezone: string;
  defaultFromName: string | null;
  defaultFromEmail: string | null;
  defaultReplyTo: string | null;
  sendingProvider: SendingProvider;
  physicalAddress: string | null;
  unsubscribeUrl: string | null;
  includeUnsubscribeLink: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  email: string;
  displayName: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  userId: string;
  userEmail: string;
  createdAt: string;
}
