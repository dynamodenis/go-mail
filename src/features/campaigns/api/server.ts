import {
	createCampaignService,
	deleteCampaignService,
	getCampaignByIdService,
	getCampaignsService,
	updateCampaignService,
} from "@/features/campaigns/api/service";
import type {
	CampaignFilters,
	CreateCampaignInput,
	UpdateCampaignInput,
} from "@/features/campaigns/types";
import {
	campaignFiltersSchema,
	createCampaignSchema,
	deleteCampaignSchema,
	getCampaignByIdSchema,
	updateCampaignSchema,
} from "@/features/campaigns/types";
import { handleServerError } from "@/lib/errors";
import { requireUserId } from "@/lib/require-user";
import { createServerFn } from "@tanstack/react-start";

/** Fetches paginated campaigns with optional search and status filters,
 *  each enriched with aggregate send metrics (opens, clicks, bounces, etc.).
 *  Auth: Requires authenticated session.
 *  Errors: INTERNAL_ERROR */
export const getCampaigns = createServerFn({ method: "GET" })
	.inputValidator((data: CampaignFilters) => campaignFiltersSchema.parse(data))
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			const result = await getCampaignsService(userId, data);
			return { data: result };
		} catch (error) {
			return handleServerError(error);
		}
	});

/** Fetches a single campaign owned by the authenticated user, enriched with
 *  send metrics and the related template/collection names.
 *  Auth: Requires authenticated session.
 *  Errors: CAMPAIGN_NOT_FOUND, INTERNAL_ERROR */
export const getCampaignById = createServerFn({ method: "GET" })
	.inputValidator((data: { id: string }) => getCampaignByIdSchema.parse(data))
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			const result = await getCampaignByIdService(userId, data.id);
			return { data: result };
		} catch (error) {
			return handleServerError(error);
		}
	});

/** Updates an existing campaign owned by the authenticated user. Any subset of
 *  name, subject, template, collection, status, or schedule may be changed.
 *  Auth: Requires authenticated session.
 *  Errors: CAMPAIGN_NOT_FOUND, TEMPLATE_NOT_FOUND, COLLECTION_NOT_FOUND, INTERNAL_ERROR */
export const updateCampaign = createServerFn({ method: "POST" })
	.inputValidator((data: UpdateCampaignInput) =>
		updateCampaignSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			const result = await updateCampaignService(userId, data);
			return { data: result };
		} catch (error) {
			return handleServerError(error);
		}
	});

/** Creates a draft (or scheduled) campaign for the authenticated user, linking
 *  the chosen email template and contact collection.
 *  Auth: Requires authenticated session.
 *  Errors: TEMPLATE_NOT_FOUND, COLLECTION_NOT_FOUND, INTERNAL_ERROR */
export const createCampaign = createServerFn({ method: "POST" })
	.inputValidator((data: CreateCampaignInput) =>
		createCampaignSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			const result = await createCampaignService(userId, data);
			return { data: result };
		} catch (error) {
			return handleServerError(error);
		}
	});

/** Deletes a single campaign owned by the authenticated user.
 *  Auth: Requires authenticated session.
 *  Errors: CAMPAIGN_NOT_FOUND, INTERNAL_ERROR */
export const deleteCampaign = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) => deleteCampaignSchema.parse(data))
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			await deleteCampaignService(userId, data.id);
			return { data: { success: true } };
		} catch (error) {
			return handleServerError(error);
		}
	});
