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
  nylasGrantId: string | null;
  nylasEmail: string | null;
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
