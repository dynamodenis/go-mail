import { fallback } from "@tanstack/zod-adapter";
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

// Validates the campaigns list-page URL search params. `fallback` keeps the
// page from crashing on a malformed query string (e.g. ?page=abc) by falling
// back to the default instead of throwing.
export const campaignSearchSchema = z.object({
	search: fallback(z.string(), "").default(""),
	status: fallback(campaignStatusSchema.optional(), undefined),
	page: fallback(z.number().int().positive(), 1).default(1),
	pageSize: fallback(z.number().int().positive().max(100), 25).default(25),
});
export type CampaignSearchParams = z.infer<typeof campaignSearchSchema>;

export const getCampaignByIdSchema = z.object({
	id: z.string().uuid(),
});

export const deleteCampaignSchema = z.object({
	id: z.string().uuid(),
});

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

/** A single campaign enriched with the related template/collection names for
 *  the detail view (the list rows don't need these). */
export interface CampaignDetail extends Campaign {
	previewText: string;
	templateName: string;
	collectionName: string | null;
}

/** Campaign statuses that may still be edited. Once a campaign is sending,
 *  sent, or cancelled its configuration is frozen. */
export const EDITABLE_CAMPAIGN_STATUSES: CampaignStatus[] = [
	"DRAFT",
	"SCHEDULED",
	"PAUSED",
];
