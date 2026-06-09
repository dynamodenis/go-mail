import * as repo from "@/features/campaigns/api/repository";
import type {
	CampaignFilters,
	CreateCampaignInput,
	UpdateCampaignInput,
} from "@/features/campaigns/types";
import { AppError } from "@/lib/errors";
import { Prisma } from "@prisma/client";

export async function getCampaignsService(
	userId: string,
	filters: CampaignFilters,
) {
	return repo.getCampaigns(userId, filters);
}

export async function createCampaignService(
	userId: string,
	input: CreateCampaignInput,
) {
	// The template and collection ids come from the client, so verify both
	// reference the caller's own records before linking them — a campaign must
	// never point at another user's template or contact collection.
	if (!(await repo.templateBelongsToUser(userId, input.templateId))) {
		throw new AppError("TEMPLATE_NOT_FOUND", "Selected template was not found.");
	}
	if (!(await repo.collectionBelongsToUser(userId, input.collectionId))) {
		throw new AppError(
			"COLLECTION_NOT_FOUND",
			"Selected collection was not found.",
		);
	}

	// A campaign with a send time starts SCHEDULED; otherwise it's a DRAFT the
	// user can finish later.
	const status = input.scheduledAt ? "SCHEDULED" : "DRAFT";
	return repo.createCampaign(userId, {
		name: input.name,
		subject: input.subject,
		templateId: input.templateId,
		collectionId: input.collectionId,
		status,
		scheduledAt: input.scheduledAt ?? null,
	});
}

export async function getCampaignByIdService(
	userId: string,
	campaignId: string,
) {
	const campaign = await repo.getCampaignById(userId, campaignId);
	if (!campaign) {
		throw new AppError("CAMPAIGN_NOT_FOUND", "Campaign not found.");
	}
	return campaign;
}

export async function updateCampaignService(
	userId: string,
	input: UpdateCampaignInput,
) {
	const { id, ...changes } = input;

	// Verify ownership of any newly-referenced template/collection, mirroring the
	// create path — these ids come from the client.
	if (
		changes.templateId !== undefined &&
		!(await repo.templateBelongsToUser(userId, changes.templateId))
	) {
		throw new AppError("TEMPLATE_NOT_FOUND", "Selected template was not found.");
	}
	if (
		changes.collectionId !== undefined &&
		!(await repo.collectionBelongsToUser(userId, changes.collectionId))
	) {
		throw new AppError(
			"COLLECTION_NOT_FOUND",
			"Selected collection was not found.",
		);
	}

	try {
		return await repo.updateCampaign(userId, id, changes);
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2025"
		) {
			throw new AppError("CAMPAIGN_NOT_FOUND", "Campaign not found.");
		}
		throw error;
	}
}

export async function deleteCampaignService(
	userId: string,
	campaignId: string,
) {
	try {
		return await repo.deleteCampaign(userId, campaignId);
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2025"
		) {
			throw new AppError("CAMPAIGN_NOT_FOUND", "Campaign not found.");
		}
		throw error;
	}
}
