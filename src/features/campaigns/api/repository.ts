import type {
	Campaign,
	CampaignDetail,
	CampaignFilters,
	CampaignStatus,
} from "@/features/campaigns/types";
import { prisma } from "@/lib/prisma";
import type {
	CampaignStatus as DbCampaignStatus,
	Prisma,
	SendStatus,
} from "@prisma/client";

// The database enum names a finished campaign COMPLETED, while the client/type
// layer (campaignStatusSchema) calls it SENT. Map at this boundary so the rest
// of the app speaks a single vocabulary (the type's CampaignStatus). Every
// other status name is identical between the two enums.
function toDbStatus(status: CampaignStatus): DbCampaignStatus {
	return status === "SENT" ? "COMPLETED" : (status as DbCampaignStatus);
}

function fromDbStatus(status: DbCampaignStatus): CampaignStatus {
	return status === "COMPLETED" ? "SENT" : (status as CampaignStatus);
}

const CAMPAIGN_SELECT = {
	id: true,
	name: true,
	subject: true,
	status: true,
	templateId: true,
	scheduledAt: true,
	sentAt: true,
	createdAt: true,
	// Campaigns are linked to collections many-to-many; the list row only needs
	// one id for navigation, so we take the first link below.
	collections: { select: { collectionId: true }, take: 1 },
} as const;

type CampaignRow = Prisma.CampaignGetPayload<{
	select: typeof CAMPAIGN_SELECT;
}>;

interface SendMetrics {
	totalRecipients: number;
	delivered: number;
	opened: number;
	clicked: number;
	bounced: number;
	unsubscribed: number;
}

const EMPTY_METRICS: SendMetrics = {
	totalRecipients: 0,
	delivered: 0,
	opened: 0,
	clicked: 0,
	bounced: 0,
	unsubscribed: 0,
};

// Engagement counts are derived from CampaignSend. "delivered" has no timestamp
// column, so it is inferred from any status at or beyond DELIVERED; the other
// metrics key off their respective *At timestamps. One indexed groupBy per
// metric keeps this O(metrics) queries instead of O(campaigns) (no N+1).
const DELIVERED_STATUSES: SendStatus[] = [
	"DELIVERED",
	"OPENED",
	"CLICKED",
	"UNSUBSCRIBED",
];

async function getMetricsByCampaign(
	campaignIds: string[],
): Promise<Map<string, SendMetrics>> {
	const metrics = new Map<string, SendMetrics>();
	if (campaignIds.length === 0) return metrics;

	const base = { campaignId: { in: campaignIds } };
	const countBy = (where: Prisma.CampaignSendWhereInput) =>
		prisma.campaignSend.groupBy({
			by: ["campaignId"],
			where,
			_count: { _all: true },
		});

	const [total, delivered, opened, clicked, bounced, unsubscribed] =
		await Promise.all([
			countBy(base),
			countBy({ ...base, status: { in: DELIVERED_STATUSES } }),
			countBy({ ...base, openedAt: { not: null } }),
			countBy({ ...base, clickedAt: { not: null } }),
			countBy({ ...base, bouncedAt: { not: null } }),
			countBy({ ...base, unsubscribedAt: { not: null } }),
		]);

	const apply = (
		rows: { campaignId: string; _count: { _all: number } }[],
		key: keyof SendMetrics,
	) => {
		for (const row of rows) {
			const entry = metrics.get(row.campaignId) ?? { ...EMPTY_METRICS };
			entry[key] = row._count._all;
			metrics.set(row.campaignId, entry);
		}
	};

	apply(total, "totalRecipients");
	apply(delivered, "delivered");
	apply(opened, "opened");
	apply(clicked, "clicked");
	apply(bounced, "bounced");
	apply(unsubscribed, "unsubscribed");

	return metrics;
}

function toCampaign(row: CampaignRow, metrics: SendMetrics): Campaign {
	return {
		id: row.id,
		name: row.name,
		subject: row.subject,
		status: fromDbStatus(row.status),
		templateId: row.templateId,
		collectionId: row.collections[0]?.collectionId ?? "",
		scheduledAt: row.scheduledAt?.toISOString() ?? null,
		sentAt: row.sentAt?.toISOString() ?? null,
		...metrics,
		createdAt: row.createdAt.toISOString(),
		// The Campaign model has no updatedAt column yet; fall back to createdAt
		// so the list-page contract is satisfied without a schema migration.
		updatedAt: row.createdAt.toISOString(),
	};
}

export async function getCampaigns(userId: string, filters: CampaignFilters) {
	const { search, status, page, pageSize } = filters;

	const where: Prisma.CampaignWhereInput = {
		userId,
		...(status && { status: toDbStatus(status) }),
		...(search && {
			OR: [
				{ name: { contains: search, mode: "insensitive" as const } },
				{ subject: { contains: search, mode: "insensitive" as const } },
			],
		}),
	};

	const [rows, total] = await Promise.all([
		prisma.campaign.findMany({
			where,
			select: CAMPAIGN_SELECT,
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		prisma.campaign.count({ where }),
	]);

	const metrics = await getMetricsByCampaign(rows.map((r) => r.id));
	const data = rows.map((row) =>
		toCampaign(row, metrics.get(row.id) ?? EMPTY_METRICS),
	);

	return { data, total, page, pageSize };
}

// Detail view needs the related template + collection names, which the list
// row select omits. Pull them via the relations here.
const CAMPAIGN_DETAIL_SELECT = {
	id: true,
	name: true,
	subject: true,
	previewText: true,
	status: true,
	templateId: true,
	scheduledAt: true,
	sentAt: true,
	createdAt: true,
	template: { select: { name: true } },
	collections: {
		select: { collectionId: true, collection: { select: { name: true } } },
		take: 1,
	},
} as const;

type CampaignDetailRow = Prisma.CampaignGetPayload<{
	select: typeof CAMPAIGN_DETAIL_SELECT;
}>;

function toCampaignDetail(
	row: CampaignDetailRow,
	metrics: SendMetrics,
): CampaignDetail {
	const link = row.collections[0];
	return {
		id: row.id,
		name: row.name,
		subject: row.subject,
		previewText: row.previewText,
		status: fromDbStatus(row.status),
		templateId: row.templateId,
		templateName: row.template.name,
		collectionId: link?.collectionId ?? "",
		collectionName: link?.collection.name ?? null,
		scheduledAt: row.scheduledAt?.toISOString() ?? null,
		sentAt: row.sentAt?.toISOString() ?? null,
		...metrics,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.createdAt.toISOString(),
	};
}

export async function getCampaignById(
	userId: string,
	campaignId: string,
): Promise<CampaignDetail | null> {
	const row = await prisma.campaign.findFirst({
		where: { id: campaignId, userId },
		select: CAMPAIGN_DETAIL_SELECT,
	});
	if (!row) return null;

	const metrics = await getMetricsByCampaign([row.id]);
	return toCampaignDetail(row, metrics.get(row.id) ?? EMPTY_METRICS);
}

export async function updateCampaign(
	userId: string,
	campaignId: string,
	data: {
		name?: string;
		subject?: string;
		templateId?: string;
		status?: CampaignStatus;
		scheduledAt?: string | null;
		collectionId?: string;
	},
) {
	await prisma.$transaction(async (tx) => {
		await tx.campaign.update({
			// userId in the where (extended unique) ensures a user can only update
			// their own campaign; a mismatch throws P2025 → CAMPAIGN_NOT_FOUND.
			where: { id: campaignId, userId },
			data: {
				...(data.name !== undefined && { name: data.name }),
				...(data.subject !== undefined && { subject: data.subject }),
				...(data.templateId !== undefined && { templateId: data.templateId }),
				...(data.status !== undefined && { status: toDbStatus(data.status) }),
				...(data.scheduledAt !== undefined && {
					scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
				}),
			},
		});

		// Reassigning the audience replaces the single collection link.
		if (data.collectionId !== undefined) {
			await tx.campaignCollection.deleteMany({ where: { campaignId } });
			await tx.campaignCollection.create({
				data: { campaignId, collectionId: data.collectionId },
			});
		}
	});

	return { id: campaignId };
}

export async function deleteCampaign(userId: string, campaignId: string) {
	return prisma.campaign.delete({
		where: { id: campaignId, userId },
	});
}

// Ownership probes used by the create flow to confirm user-supplied foreign
// keys reference the caller's own records (never another user's) before they
// are linked to a new campaign.
export async function templateBelongsToUser(userId: string, templateId: string) {
	const count = await prisma.template.count({
		where: { id: templateId, userId },
	});
	return count > 0;
}

export async function collectionBelongsToUser(
	userId: string,
	collectionId: string,
) {
	const count = await prisma.collection.count({
		where: { id: collectionId, userId },
	});
	return count > 0;
}

export async function createCampaign(
	userId: string,
	data: {
		name: string;
		subject: string;
		templateId: string;
		collectionId: string;
		status: CampaignStatus;
		scheduledAt: string | null;
	},
) {
	const row = await prisma.campaign.create({
		data: {
			userId,
			name: data.name,
			subject: data.subject,
			templateId: data.templateId,
			status: toDbStatus(data.status),
			scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
			// One contact collection is linked at creation via the join table.
			collections: { create: { collectionId: data.collectionId } },
		},
		select: { id: true },
	});
	return { id: row.id };
}
