import { z } from "zod";

export const campaignStatusSchema = z.enum([
  "DRAFT",
  "SCHEDULED",
  "SENDING",
  "SENT",
  "PAUSED",
  "CANCELLED",
]);
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;

export const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(255),
  subject: z.string().min(1, "Subject line is required").max(255),
  templateId: z.string().uuid("Invalid template ID"),
  collectionId: z.string().uuid("Invalid collection ID"),
  scheduledAt: z.string().datetime().optional(),
});
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(255).optional(),
  templateId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  status: campaignStatusSchema.optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

export const campaignFiltersSchema = z.object({
  status: campaignStatusSchema.optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(25),
});
export type CampaignFilters = z.infer<typeof campaignFiltersSchema>;

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: CampaignStatus;
  templateId: string;
  collectionId: string;
  scheduledAt: string | null;
  sentAt: string | null;
  totalRecipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  createdAt: string;
  updatedAt: string;
}
